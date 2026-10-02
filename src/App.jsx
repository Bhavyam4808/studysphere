import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { Toast } from './components/Toast.js';
import { PdfViewerModal } from './components/PdfViewerModal.js';
import { VideoPlayerModal } from './components/VideoPlayerModal.js';

// Pages
import { Home } from './pages/Home.js';
import { Subjects } from './pages/Subjects.js';
import { Resources } from './pages/Resources.js';
import { Dashboard } from './pages/Dashboard.js';
import { Bookmarks } from './pages/Bookmarks.js';
import { StudyAI } from './pages/StudyAI.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';

// API & Storage
import { api, AuthStorage } from './api.js';

/**
 * StudySphere Main Application
 * =============================
 * Core controller managing routing, real user authentication,
 * context-aware StudySphere AI, and resource interactions.
 */
export function App() {
  // Authentication state
  const [user, setUser] = useState(AuthStorage.getUser());

  // Routing state
  const [activeTab, setActiveTab] = useState('home');
  const [navParams, setNavParams] = useState({});

  // Active AI study context (attached when student asks AI from inside a resource)
  const [activeAIContext, setActiveAIContext] = useState(null);

  // Resources state
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);

  // User interactive states
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [completedIds, setCompletedIds] = useState(new Set());
  const [userRatings, setUserRatings] = useState({});

  // Active modals
  const [activePdfResource, setActivePdfResource] = useState(null);
  const [activeVideoResource, setActiveVideoResource] = useState(null);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load resources from backend
  const loadResources = async () => {
    try {
      setLoadingResources(true);
      const res = await api.getResources();
      setResources(res.resources || []);
    } catch (err) {
      console.error('Failed to load resources:', err);
      showToast('Could not fetch resources from server.', 'error');
    } finally {
      setLoadingResources(false);
    }
  };

  // Load personalized student activity & bookmarks
  const loadUserData = async () => {
    if (!AuthStorage.getToken()) return;
    try {
      const [bmData, dashData] = await Promise.all([
        api.getBookmarks().catch(() => ({ bookmarks: [] })),
        api.getDashboard().catch(() => ({ recentViews: [] }))
      ]);

      if (bmData.bookmarks) {
        setBookmarkedIds(new Set(bmData.bookmarks.map((b) => b.id)));
      }

      if (dashData.recentViews) {
        const completed = new Set();
        dashData.recentViews.forEach((r) => {
          if (r.completed) completed.add(r.id);
        });
        setCompletedIds(completed);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  useEffect(() => {
    loadResources();
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Navigation Handler with Role & Authentication Guards
  const handleNavigate = (tabId, params = {}) => {
    // Protected student routes
    if ((tabId === 'dashboard' || tabId === 'bookmarks') && !user) {
      showToast('Please sign in to access your student dashboard and bookmarks.', 'info');
      setActiveTab('login');
      return;
    }

    // Protected admin route
    if (tabId === 'admin' && (!user || user.role !== 'admin')) {
      showToast('Access denied: Admin role required for Admin Dashboard.', 'error');
      setActiveTab('home');
      return;
    }

    setNavParams(params);
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Handlers with Role-Based Redirection
  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    // If admin: redirect to Admin Dashboard; If student: redirect to Student Dashboard
    if (loggedInUser.role === 'admin') {
      handleNavigate('admin');
    } else {
      handleNavigate('dashboard');
    }
  };

  const handleRegisterSuccess = (registeredUser) => {
    setUser(registeredUser);
    if (registeredUser.role === 'admin') {
      handleNavigate('admin');
    } else {
      handleNavigate('dashboard');
    }
  };

  const handleLogout = () => {
    AuthStorage.logout();
    setUser(null);
    setBookmarkedIds(new Set());
    setCompletedIds(new Set());
    setUserRatings({});
    setActiveAIContext(null);
    showToast('Signed out successfully.', 'info');
    handleNavigate('home');
  };

  // Open resource in modal and record real view count
  const handleOpenResource = async (resource) => {
    try {
      api.recordView(resource.id);
      // Increment real view count locally
      setResources((prev) =>
        prev.map((r) =>
          r.id === resource.id ? { ...r, view_count: (r.view_count || 0) + 1 } : r
        )
      );
    } catch (err) {
      console.error('Failed to record view:', err);
    }

    try {
      const fullRes = await api.getResource(resource.id);
      const resData = fullRes.resource || resource;

      if (resData.userRating) {
        setUserRatings((prev) => ({ ...prev, [resource.id]: resData.userRating }));
      }
      if (resData.isBookmarked) {
        setBookmarkedIds((prev) => new Set([...prev, resource.id]));
      }
      if (resData.isCompleted) {
        setCompletedIds((prev) => new Set([...prev, resource.id]));
      }

      if (resource.type === 'pdf') {
        setActivePdfResource(resData);
      } else {
        setActiveVideoResource(resData);
      }
    } catch {
      if (resource.type === 'pdf') {
        setActivePdfResource(resource);
      } else {
        setActiveVideoResource(resource);
      }
    }
  };

  // Connects Ask StudySphere AI directly from inside a resource
  const handleAskAIFromResource = (resource) => {
    setActiveAIContext(resource);
    handleNavigate('ai');
  };

  // Rate Resource
  const handleRateResource = async (resourceId, ratingValue) => {
    if (!user) {
      showToast('Please sign in to submit a rating.', 'error');
      return;
    }
    try {
      const res = await api.rateResource(resourceId, ratingValue);
      setUserRatings((prev) => ({ ...prev, [resourceId]: ratingValue }));
      showToast(`Rating submitted: ${ratingValue}★`, 'success');

      // Update in resources list
      setResources((prev) =>
        prev.map((r) =>
          r.id === resourceId
            ? {
                ...r,
                average_rating: res.averageRating,
                rating_count: res.ratingCount
              }
            : r
        )
      );

      // Update active modals
      if (activePdfResource && activePdfResource.id === resourceId) {
        setActivePdfResource((prev) => ({
          ...prev,
          average_rating: res.averageRating,
          rating_count: res.ratingCount
        }));
      }
      if (activeVideoResource && activeVideoResource.id === resourceId) {
        setActiveVideoResource((prev) => ({
          ...prev,
          average_rating: res.averageRating,
          rating_count: res.ratingCount
        }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit rating.', 'error');
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async (resourceId) => {
    if (!user) {
      showToast('Please sign in to bookmark resources.', 'error');
      return;
    }
    try {
      const res = await api.toggleBookmark(resourceId);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (res.bookmarked) {
          next.add(resourceId);
          showToast('Added to Bookmarks.', 'success');
        } else {
          next.delete(resourceId);
          showToast('Removed from Bookmarks.', 'info');
        }
        return next;
      });
    } catch (err) {
      showToast(err.message || 'Bookmark action failed.', 'error');
    }
  };

  // Toggle Complete / Mark as Read
  const handleToggleComplete = async (resourceId, completed) => {
    if (!user) {
      showToast('Please sign in to track study progress.', 'error');
      return;
    }
    try {
      await api.toggleComplete(resourceId, completed);
      setCompletedIds((prev) => {
        const next = new Set(prev);
        if (completed) {
          next.add(resourceId);
          showToast('Marked as completed. Progress updated.', 'success');
        } else {
          next.delete(resourceId);
          showToast('Marked as incomplete.', 'info');
        }
        return next;
      });
    } catch (err) {
      showToast(err.message || 'Could not update progress.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Header */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <Home
            resources={resources}
            user={user}
            onNavigate={handleNavigate}
            onOpenResource={handleOpenResource}
            onToggleBookmark={handleToggleBookmark}
            bookmarkedIds={bookmarkedIds}
            completedIds={completedIds}
          />
        )}

        {activeTab === 'subjects' && (
          <Subjects
            resources={resources}
            initialSubject={navParams.subject || 'Engineering Physics'}
            onOpenResource={handleOpenResource}
            onToggleBookmark={handleToggleBookmark}
            bookmarkedIds={bookmarkedIds}
            completedIds={completedIds}
          />
        )}

        {activeTab === 'resources' && (
          <Resources
            resources={resources}
            initialSearch={navParams.search || ''}
            initialSort={navParams.sort || 'popular'}
            onOpenResource={handleOpenResource}
            onToggleBookmark={handleToggleBookmark}
            bookmarkedIds={bookmarkedIds}
            completedIds={completedIds}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            user={user}
            onNavigate={handleNavigate}
            onOpenResource={handleOpenResource}
            onToggleBookmark={handleToggleBookmark}
            bookmarkedIds={bookmarkedIds}
            completedIds={completedIds}
          />
        )}

        {activeTab === 'bookmarks' && (
          <Bookmarks
            onNavigate={handleNavigate}
            onOpenResource={handleOpenResource}
            onToggleBookmark={handleToggleBookmark}
            bookmarkedIds={bookmarkedIds}
            completedIds={completedIds}
          />
        )}

        {activeTab === 'ai' && (
          <StudyAI
            initialContext={activeAIContext}
            onClearContext={() => setActiveAIContext(null)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            user={user}
            resources={resources}
            onRefreshResources={loadResources}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'login' && (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'register' && (
          <Register
            onRegisterSuccess={handleRegisterSuccess}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Modals */}
      <PdfViewerModal
        resource={activePdfResource}
        isOpen={Boolean(activePdfResource)}
        onClose={() => setActivePdfResource(null)}
        onRate={handleRateResource}
        onToggleBookmark={handleToggleBookmark}
        onToggleComplete={handleToggleComplete}
        onAskAI={handleAskAIFromResource}
        userRating={activePdfResource ? userRatings[activePdfResource.id] || 0 : 0}
        isBookmarked={activePdfResource ? bookmarkedIds.has(activePdfResource.id) : false}
        isCompleted={activePdfResource ? completedIds.has(activePdfResource.id) : false}
        isLoggedIn={Boolean(user)}
      />

      <VideoPlayerModal
        resource={activeVideoResource}
        isOpen={Boolean(activeVideoResource)}
        onClose={() => setActiveVideoResource(null)}
        onRate={handleRateResource}
        onToggleBookmark={handleToggleBookmark}
        onToggleComplete={handleToggleComplete}
        onOpenRelatedResource={(relId) => {
          const found = resources.find((r) => r.id === relId);
          if (found) handleOpenResource(found);
        }}
        onAskAI={handleAskAIFromResource}
        userRating={activeVideoResource ? userRatings[activeVideoResource.id] || 0 : 0}
        isBookmarked={activeVideoResource ? bookmarkedIds.has(activeVideoResource.id) : false}
        isCompleted={activeVideoResource ? completedIds.has(activeVideoResource.id) : false}
        isLoggedIn={Boolean(user)}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
