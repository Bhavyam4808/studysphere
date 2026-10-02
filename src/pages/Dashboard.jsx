import React, { useEffect, useState } from 'react';
import { Icons } from '../components/Icons.js';
import { ResourceCard } from '../components/ResourceCard.js';
import { api } from '../api.js';

/**
 * Dashboard Page Component
 * ========================
 * Student dashboard displaying real personalized learning metrics:
 * - Real completion percentages
 * - Real recently viewed resources
 * - Real subject progress bars
 * - Empty states for new students with no fake data.
 */
export function Dashboard({
  user,
  onNavigate,
  onOpenResource,
  onToggleBookmark,
  bookmarkedIds = new Set(),
  completedIds = new Set()
}) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await api.getDashboard();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading your study progress...</p>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    viewedCount: 0,
    completedCount: 0,
    bookmarkCount: 0,
    overallProgress: 0
  };

  const recentViews = dashboardData?.recentViews || [];
  const subjectProgress = dashboardData?.subjectProgress || [];
  const recommended = dashboardData?.recommended || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
            Student Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
            Track your semester reading progress, access your bookmarked materials, and continue where you left off.
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate('resources')}
            className="px-4 py-2 text-xs font-bold bg-white text-blue-700 rounded-xl hover:bg-blue-50 shadow-sm transition-colors"
          >
            Explore Resources
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ai')}
            className="px-4 py-2 text-xs font-semibold bg-blue-800/60 hover:bg-blue-800/80 text-white rounded-xl border border-blue-400/40 transition-colors flex items-center gap-1.5"
          >
            <Icons.Bot className="w-3.5 h-3.5" />
            <span>Ask StudySphere AI</span>
          </button>
        </div>
      </div>

      {/* Real Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Overall Progress</span>
            <Icons.CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.overallProgress}%</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Completed Items</span>
            <Icons.CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600">{stats.completedCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Marked read or watched</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Resources Viewed</span>
            <Icons.Eye className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.viewedCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Materials accessed</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Bookmarks</span>
            <Icons.Bookmark className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{stats.bookmarkCount}</p>
          <button
            type="button"
            onClick={() => onNavigate('bookmarks')}
            className="text-[11px] text-blue-600 hover:underline mt-1 block font-medium"
          >
            View Bookmarks →
          </button>
        </div>
      </div>

      {/* Continue Learning / Recently Opened */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Continue Learning 📖
            </h2>
            <p className="text-xs text-slate-500">
              Materials and lecture videos you recently accessed.
            </p>
          </div>

          {recentViews.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('resources')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Browse all
            </button>
          )}
        </div>

        {recentViews.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-2">
            <p className="text-xs text-slate-500">
              You haven't viewed any resources yet.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('resources')}
              className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start Exploring
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentViews.slice(0, 3).map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                onOpenResource={onOpenResource}
                onToggleBookmark={onToggleBookmark}
                isBookmarked={bookmarkedIds.has(res.id)}
                isCompleted={completedIds.has(res.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Subject Syllabus Progress */}
      {subjectProgress.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Subject Progress
            </h2>
            <p className="text-xs text-slate-500">
              Progress calculated from materials you mark as read or completed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectProgress.map((sub) => {
              const pct = sub.percentage || 0;
              return (
                <div
                  key={sub.subject}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {sub.subject}
                    </h4>
                    <span className="text-xs font-extrabold text-blue-600">
                      {pct}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {sub.completed} of {sub.total} completed
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('subjects', { subject: sub.subject })}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      View Subject →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recommended for You (Real top rated) */}
      {recommended.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Top Rated by Students ⭐
            </h2>
            <p className="text-xs text-slate-500">
              Materials with highest verified student ratings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommended.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                onOpenResource={onOpenResource}
                onToggleBookmark={onToggleBookmark}
                isBookmarked={bookmarkedIds.has(res.id)}
                isCompleted={completedIds.has(res.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
