// ============================================================================
// StudySphere - Combined React Application Bundle
// Auto-assembled from modular components in src/
// ============================================================================

const { useState, useEffect, useRef, useMemo } = React;


// ==========================================
// File: src/api.js
// ==========================================

/**
 * StudySphere - API Client Helper
 * =================================
 * Communicates with the backend REST API at /api/*
 * Handles session tokens, JSON serialization, and error parsing.
 */

const API_BASE = '/api';

// Token and Session Storage
const AuthStorage = {
  getToken: () => localStorage.getItem('studysphere_token') || '',
  setToken: (token) => localStorage.setItem('studysphere_token', token),
  clearToken: () => localStorage.removeItem('studysphere_token'),

  getUser: () => {
    try {
      const u = localStorage.getItem('studysphere_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('studysphere_user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('studysphere_user'),

  logout: () => {
    AuthStorage.clearToken();
    AuthStorage.clearUser();
  }
};

// Generic Fetch Wrapper
async function request(endpoint, options = {}) {
  const token = AuthStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || `HTTP error ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// API Methods
const api = {
  // Auth
  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      AuthStorage.setToken(data.token);
      AuthStorage.setUser(data.user);
    }
    return data;
  },

  async register(name, email, password) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    if (data.token) {
      AuthStorage.setToken(data.token);
      AuthStorage.setUser(data.user);
    }
    return data;
  },

  async getMe() {
    return request('/auth/me');
  },

  // Resources
  async getResources(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.subject && params.subject !== 'All') query.set('subject', params.subject);
    if (params.type && params.type !== 'All') query.set('type', params.type);
    if (params.sort) query.set('sort', params.sort);
    if (params.minRating) query.set('minRating', params.minRating);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/resources${qs}`);
  },

  async getResource(id) {
    return request(`/resources/${id}`);
  },

  // Ratings
  async rateResource(resourceId, rating) {
    return request('/ratings', {
      method: 'POST',
      body: JSON.stringify({ resourceId, rating })
    });
  },

  // Bookmarks
  async getBookmarks() {
    return request('/bookmarks');
  },

  async toggleBookmark(resourceId) {
    return request('/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({ resourceId })
    });
  },

  // Activity & Progress
  async recordView(resourceId) {
    return request('/activity/view', {
      method: 'POST',
      body: JSON.stringify({ resourceId })
    });
  },

  async toggleComplete(resourceId, completed = true) {
    return request('/activity/complete', {
      method: 'POST',
      body: JSON.stringify({ resourceId, completed })
    });
  },

  async getDashboard() {
    return request('/dashboard');
  },

  // StudySphere AI Chat (with resource context)
  async askAI(messages, context = null) {
    return request('/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, context })
    });
  },

  // Admin Operations
  async adminGetStats() {
    return request('/admin/stats');
  },

  async adminGetLoginHistory() {
    return request('/admin/login-history');
  },

  async adminGetUsers() {
    return request('/admin/users');
  },

  async adminCreateResource(resourceData) {
    return request('/resources', {
      method: 'POST',
      body: JSON.stringify(resourceData)
    });
  },

  async adminUpdateResource(id, resourceData) {
    return request(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resourceData)
    });
  },

  async adminDeleteResource(id) {
    return request(`/resources/${id}`, {
      method: 'DELETE'
    });
  },

  async adminUploadPdf(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          const res = await request('/upload', {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              data: base64Data
            })
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsDataURL(file);
    });
  }
};


// ==========================================
// File: src/components/Icons.jsx
// ==========================================

/**
 * StudySphere - Clean SVG Icons
 * =============================
 * Self-contained SVG icons matching Lucide / Feather icon design.
 */
const Icons = {
  BookOpen: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),

  Video: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),

  FileText: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),

  Star: ({ className = "w-5 h-5", filled = false }) => (
    <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),

  Bookmark: ({ className = "w-5 h-5", filled = false }) => (
    <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  ),

  Search: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),

  CheckCircle: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),

  Eye: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),

  Bot: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),

  Sparkles: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
    </svg>
  ),

  Shield: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),

  User: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),

  LogOut: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),

  ArrowRight: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),

  Plus: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  ),

  Trash: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),

  Edit: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),

  X: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),

  Menu: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),

  Download: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),

  ExternalLink: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),

  Send: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),

  GraduationCap: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  )
};


// ==========================================
// File: src/components/RatingStars.jsx
// ==========================================



/**
 * RatingStars Component
 * =====================
 * Supports both display mode (read-only with real average score)
 * and interactive rating mode (1-5 clickable stars).
 * Shows "Not rated yet" when count === 0.
 */
function RatingStars({
  rating = 0,
  count = 0,
  interactive = false,
  userRating = 0,
  onRate = null,
  size = "w-4 h-4",
  showCount = true
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const hasRatings = Number(count) > 0;
  const numRating = Number(rating || 0);

  const handleStarClick = async (starValue) => {
    if (!interactive || !onRate || submitting) return;
    setSubmitting(true);
    try {
      await onRate(starValue);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center space-x-1.5 flex-wrap">
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive
            ? star <= (hoverRating || userRating)
            : hasRatings && star <= Math.round(numRating);

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive || submitting}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${
                interactive
                  ? 'cursor-pointer hover:scale-125 transition-transform p-0.5'
                  : 'cursor-default'
              } focus:outline-none`}
              title={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : hasRatings ? `${numRating.toFixed(1)} out of 5 stars` : 'No ratings yet'}
            >
              <Icons.Star
                className={`${size} ${isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                filled={isFilled}
              />
            </button>
          );
        })}
      </div>

      {/* Rating Text Label */}
      <span className="text-xs font-semibold text-slate-700">
        {interactive ? (
          userRating > 0 ? (
            <span className="text-emerald-700 font-medium">Your rating: {userRating}★</span>
          ) : (
            <span className="text-slate-500 font-normal">Click to rate</span>
          )
        ) : hasRatings ? (
          numRating.toFixed(1)
        ) : (
          <span className="text-slate-400 font-normal text-[11px]">Not rated yet</span>
        )}
      </span>

      {!interactive && showCount && hasRatings && (
        <span className="text-xs text-slate-500">
          ({count} {count === 1 ? 'rating' : 'ratings'})
        </span>
      )}
    </div>
  );
}


// ==========================================
// File: src/components/ResourceCard.jsx
// ==========================================




/**
 * ResourceCard Component
 * ======================
 * Renders study material cards with real view count, real ratings,
 * subject tags, bookmark toggle, and Read/Watch buttons.
 */
function ResourceCard({
  resource,
  onOpenResource,
  onToggleBookmark = null,
  isBookmarked = false,
  isCompleted = false
}) {
  const isPdf = resource.type === 'pdf';

  const formattedDate = resource.created_at
    ? new Date(resource.created_at.replace(' ', 'T')).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Recently Added';

  const viewCount = resource.view_count || 0;

  return (
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      <div className="p-5">
        {/* Header: Subject & Resource Type Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              {resource.subject}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isPdf
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isPdf ? (
                <>
                  <Icons.FileText className="w-3.5 h-3.5" />
                  Notes
                </>
              ) : (
                <>
                  <Icons.Video className="w-3.5 h-3.5" />
                  Lecture
                </>
              )}
            </span>
          </div>

          {/* Quick Bookmark Toggle */}
          {onToggleBookmark && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(resource.id);
              }}
              className={`p-1.5 rounded-lg border transition-colors ${
                isBookmarked
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Save to Bookmarks'}
            >
              <Icons.Bookmark className="w-4 h-4" filled={isBookmarked} />
            </button>
          )}
        </div>

        {/* Unit / Topic Subtitle */}
        {resource.unit && (
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {resource.unit}
          </p>
        )}

        {/* Title */}
        <h3
          onClick={() => onOpenResource(resource)}
          className="text-base font-semibold text-slate-900 group-hover:text-blue-600 cursor-pointer transition-colors line-clamp-2 mb-2"
        >
          {resource.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {resource.description}
        </p>

        {/* Tags */}
        {resource.tags && (
          <div className="flex flex-wrap gap-1 mb-4">
            {resource.tags.split(',').slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Metadata and Action Button */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <RatingStars
            rating={resource.average_rating}
            count={resource.rating_count}
            size="w-3.5 h-3.5"
          />
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              <Icons.Eye className="w-3 h-3" />
              {viewCount} {viewCount === 1 ? 'view' : 'views'}
            </span>
            {isCompleted && (
              <>
                <span>•</span>
                <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                  <Icons.CheckCircle className="w-3 h-3" /> Done
                </span>
              </>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={() => onOpenResource(resource)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${
            isPdf
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white'
          }`}
        >
          {isPdf ? (
            <>
              <Icons.BookOpen className="w-3.5 h-3.5" />
              Read Notes
            </>
          ) : (
            <>
              <Icons.Video className="w-3.5 h-3.5" />
              Watch Lecture
            </>
          )}
        </button>
      </div>
    </div>
  );
}


// ==========================================
// File: src/components/SubjectCard.jsx
// ==========================================



/**
 * SubjectCard Component
 * =====================
 * Displays a subject tile with color-coded theme,
 * resource statistics, and direct navigation.
 */
function SubjectCard({
  subject,
  notesCount = 0,
  lecturesCount = 0,
  iconType = 'book',
  onClick
}) {
  const getSubjectColor = (name) => {
    switch (name) {
      case 'Engineering Physics':
        return {
          bg: 'bg-indigo-50 hover:bg-indigo-100/80',
          border: 'border-indigo-200',
          badge: 'bg-indigo-600 text-white',
          text: 'text-indigo-950'
        };
      case 'Engineering Mathematics':
        return {
          bg: 'bg-blue-50 hover:bg-blue-100/80',
          border: 'border-blue-200',
          badge: 'bg-blue-600 text-white',
          text: 'text-blue-950'
        };
      case 'Programming / C':
        return {
          bg: 'bg-emerald-50 hover:bg-emerald-100/80',
          border: 'border-emerald-200',
          badge: 'bg-emerald-600 text-white',
          text: 'text-emerald-950'
        };
      case 'Electrical Engineering':
        return {
          bg: 'bg-amber-50 hover:bg-amber-100/80',
          border: 'border-amber-200',
          badge: 'bg-amber-600 text-white',
          text: 'text-amber-950'
        };
      case 'Engineering Chemistry':
        return {
          bg: 'bg-purple-50 hover:bg-purple-100/80',
          border: 'border-purple-200',
          badge: 'bg-purple-600 text-white',
          text: 'text-purple-950'
        };
      default:
        return {
          bg: 'bg-slate-50 hover:bg-slate-100/80',
          border: 'border-slate-200',
          badge: 'bg-slate-600 text-white',
          text: 'text-slate-950'
        };
    }
  };

  const style = getSubjectColor(subject);

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border ${style.border} ${style.bg} cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg ${style.badge} flex items-center justify-center shadow-sm`}>
            <Icons.GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-white/80 px-2.5 py-1 rounded-full border border-slate-200">
            {notesCount + lecturesCount} Resources
          </span>
        </div>

        <h3 className={`text-base font-bold ${style.text} mb-1.5`}>
          {subject}
        </h3>
        <p className="text-xs text-slate-600 line-clamp-2">
          First-year foundational curriculum modules, exam formulas & video masterclasses.
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-700">
            <Icons.FileText className="w-3.5 h-3.5 text-blue-600" />
            {notesCount} Notes
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <Icons.Video className="w-3.5 h-3.5 text-rose-600" />
            {lecturesCount} Lectures
          </span>
        </div>
        <Icons.ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}


// ==========================================
// File: src/components/PdfViewerModal.jsx
// ==========================================




/**
 * PdfViewerModal Component
 * ========================
 * In-browser PDF reader modal. Displays PDF in iframe, provides download,
 * allows real 1-5 star rating, tracks "Mark as Read",
 * and features a direct "Ask StudySphere AI about this Note" action.
 */
function PdfViewerModal({
  resource,
  isOpen,
  onClose,
  onRate,
  onToggleBookmark,
  onToggleComplete,
  onAskAI,
  userRating = 0,
  isBookmarked = false,
  isCompleted = false,
  isLoggedIn = false
}) {
  const [readState, setReadState] = useState(isCompleted);

  if (!isOpen || !resource) return null;

  const pdfUrl = resource.file_url || '';

  const handleToggleRead = async () => {
    const nextState = !readState;
    setReadState(nextState);
    if (onToggleComplete) {
      await onToggleComplete(resource.id, nextState);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Icons.FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                  {resource.subject}
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  {resource.unit}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {resource.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Ask AI Contextual Action */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onAskAI) onAskAI(resource);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
              title="Ask AI questions about this note"
            >
              <Icons.Bot className="w-3.5 h-3.5" />
              <span>Ask StudySphere AI</span>
            </button>

            {/* Download Button */}
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
                title="Download PDF"
              >
                <Icons.Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              title="Close viewer"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Reader Frame or fallback viewer */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              title={resource.title}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
              <Icons.FileText className="w-12 h-12 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">No PDF file attached to this note.</p>
              <p className="text-xs text-slate-500 max-w-sm">{resource.description}</p>
            </div>
          )}
        </div>

        {/* Bottom Interactive Toolbar (Rating + Progress + Bookmarks) */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          {/* Rating Section */}
          <div className="flex items-center gap-4">
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                Resource Rating
              </span>
              <RatingStars
                rating={resource.average_rating}
                count={resource.rating_count}
                interactive={isLoggedIn}
                userRating={userRating}
                onRate={(val) => onRate && onRate(resource.id, val)}
                size="w-4 h-4"
              />
            </div>
            {!isLoggedIn && (
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                Log in to submit your rating
              </span>
            )}
          </div>

          {/* Action Buttons: Mark as Read & Bookmark */}
          <div className="flex items-center gap-2.5">
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={handleToggleRead}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    readState
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icons.CheckCircle className={`w-4 h-4 ${readState ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {readState ? 'Marked as Read' : 'Mark as Read'}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleBookmark && onToggleBookmark(resource.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    isBookmarked
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icons.Bookmark className={`w-4 h-4 ${isBookmarked ? 'text-blue-600' : 'text-slate-400'}`} filled={isBookmarked} />
                  {isBookmarked ? 'Saved' : 'Bookmark'}
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Sign in to rate materials, save bookmarks, and track reading progress.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// File: src/components/VideoPlayerModal.jsx
// ==========================================




/**
 * VideoPlayerModal Component
 * ==========================
 * Responsive video lecture player modal with real 1-5 rating,
 * "Mark as Completed", and "Ask StudySphere AI about this Lecture" contextual button.
 */
function VideoPlayerModal({
  resource,
  isOpen,
  onClose,
  onRate,
  onToggleBookmark,
  onToggleComplete,
  onOpenRelatedResource,
  onAskAI,
  userRating = 0,
  isBookmarked = false,
  isCompleted = false,
  isLoggedIn = false
}) {
  const [completedState, setCompletedState] = useState(isCompleted);

  if (!isOpen || !resource) return null;

  const handleToggleComplete = async () => {
    const nextState = !completedState;
    setCompletedState(nextState);
    if (onToggleComplete) {
      await onToggleComplete(resource.id, nextState);
    }
  };

  // Convert youtube watch links if needed
  let embedUrl = resource.video_url || '';
  if (embedUrl.includes('watch?v=')) {
    const vId = embedUrl.split('watch?v=')[1]?.split('&')[0];
    if (vId) embedUrl = `https://www.youtube.com/embed/${vId}`;
  } else if (embedUrl.includes('youtu.be/')) {
    const vId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
    if (vId) embedUrl = `https://www.youtube.com/embed/${vId}`;
  }

  const formattedDate = resource.created_at
    ? new Date(resource.created_at.replace(' ', 'T')).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Recent';

  const viewCount = resource.view_count || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <Icons.Video className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
                  {resource.subject}
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  {resource.unit}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {resource.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onAskAI) onAskAI(resource);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
              title="Ask AI questions about this lecture"
            >
              <Icons.Bot className="w-3.5 h-3.5" />
              <span>Ask StudySphere AI</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              title="Close lecture"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video & Information Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Responsive 16:9 Video Player */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg border border-slate-800">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={resource.title}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                No video stream available.
              </div>
            )}
          </div>

          {/* Interactive Controls & Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="space-y-1">
              <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Rate this Lecture
              </span>
              <RatingStars
                rating={resource.average_rating}
                count={resource.rating_count}
                interactive={isLoggedIn}
                userRating={userRating}
                onRate={(val) => onRate && onRate(resource.id, val)}
                size="w-4 h-4"
              />
            </div>

            {/* Actions: Mark Completed & Bookmark */}
            <div className="flex items-center gap-2.5">
              {isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={handleToggleComplete}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      completedState
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icons.CheckCircle
                      className={`w-4 h-4 ${completedState ? 'text-emerald-600' : 'text-slate-400'}`}
                    />
                    {completedState ? 'Lecture Completed' : 'Mark as Completed'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleBookmark && onToggleBookmark(resource.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      isBookmarked
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icons.Bookmark
                      className={`w-4 h-4 ${isBookmarked ? 'text-blue-600' : 'text-slate-400'}`}
                      filled={isBookmarked}
                    />
                    {isBookmarked ? 'Bookmarked' : 'Save Lecture'}
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                  Sign in to track progress and submit ratings.
                </span>
              )}
            </div>
          </div>

          {/* Description & Overview */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Uploaded: {formattedDate}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icons.Eye className="w-3.5 h-3.5" />
                {viewCount} {viewCount === 1 ? 'view' : 'views'}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Lecture Overview</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {resource.description}
              </p>
            </div>

            {resource.tags && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {resource.tags.split(',').map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-medium"
                  >
                    #{t.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Related Materials Section */}
          {resource.related && resource.related.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 mb-3">
                Related Notes & Lectures ({resource.subject})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resource.related.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onOpenRelatedResource && onOpenRelatedResource(rel.id)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white cursor-pointer transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        {rel.type === 'pdf' ? '📄 Study Notes' : '🎥 Video Lecture'}
                      </span>
                      <h5 className="text-xs font-semibold text-slate-800 truncate">
                        {rel.title}
                      </h5>
                    </div>
                    <RatingStars rating={rel.average_rating} count={rel.rating_count} size="w-3 h-3" showCount={false} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ==========================================
// File: src/components/Toast.jsx
// ==========================================



/**
 * Toast Component
 * ===============
 * Floating notification banner for responsive user feedback.
 */
function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border text-xs sm:text-sm font-medium transition-all transform translate-y-0 ${
              isSuccess
                ? 'bg-emerald-900 text-white border-emerald-800'
                : isError
                ? 'bg-rose-900 text-white border-rose-800'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5 mr-2">
              {isSuccess && <Icons.CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
              {isError && <Icons.Shield className="w-4 h-4 text-rose-400 shrink-0" />}
              {!isSuccess && !isError && <Icons.Sparkles className="w-4 h-4 text-blue-400 shrink-0" />}
              <span>{toast.message}</span>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}


// ==========================================
// File: src/components/Navbar.jsx
// ==========================================



/**
 * Navbar Component
 * ================
 * Clean, academic navigation bar. Displays logo, tagline, main links,
 * authenticated student status, and Admin Dashboard link when user is admin.
 */
function Navbar({
  user,
  activeTab,
  onNavigate,
  onLogout
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user && user.role === 'admin';

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'resources', label: 'Resources' },
    { id: 'ai', label: 'StudySphere AI', badge: 'AI' },
    ...(user ? [
      { id: 'bookmarks', label: 'Bookmarks' },
      { id: 'dashboard', label: 'Dashboard' }
    ] : [])
  ];

  const handleLinkClick = (tabId) => {
    onNavigate(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Tagline */}
        <div
          onClick={() => handleLinkClick('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 group-hover:bg-blue-700 flex items-center justify-center text-white shadow-sm transition-colors">
            <Icons.BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                StudySphere
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium hidden sm:block">
              Learn. Explore. Grow.
            </p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleLinkClick(link.id)}
                className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Dashboard Button (Only visible for admin accounts) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleLinkClick('admin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Icons.Shield className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </button>
          )}
        </nav>

        {/* User Auth Buttons / Profile Menu */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div
                onClick={() => handleLinkClick('dashboard')}
                className="cursor-pointer flex items-center gap-2"
                title="Go to Dashboard"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-slate-900 leading-tight">
                    {user.name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-slate-600 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <Icons.LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleLinkClick('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleLinkClick('register')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <Icons.X className="w-5 h-5" /> : <Icons.Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleLinkClick(link.id)}
              className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between ${
                activeTab === link.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded-full">
                  {link.badge}
                </span>
              )}
            </button>
          ))}

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleLinkClick('admin')}
              className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 flex items-center gap-2"
            >
              <Icons.Shield className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>
          )}

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-600">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleLinkClick('login')}
                  className="w-full py-2 text-xs font-semibold text-center border border-slate-300 rounded-lg text-slate-700"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleLinkClick('register')}
                  className="w-full py-2 text-xs font-semibold text-center bg-blue-600 text-white rounded-lg"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


// ==========================================
// File: src/components/Footer.jsx
// ==========================================



/**
 * Footer Component
 * ================
 * Clean student hackathon project footer.
 */
function Footer({ onNavigate }) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Icons.BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">StudySphere</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              "Learn. Explore. Grow." A peer-curated open study platform designed for first-year engineering students to discover syllabus notes, video lectures, and clear conceptual explanations.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="px-2 py-0.5 bg-slate-800 text-blue-400 rounded font-mono">
                First-Year Hackathon 2026
              </span>
              <span>•</span>
              <span>Open Academic Resource Hub</span>
            </div>
          </div>

          {/* Quick Subjects */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Core Subjects
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('subjects')}
                  className="hover:text-white transition-colors"
                >
                  Engineering Physics
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('subjects')}
                  className="hover:text-white transition-colors"
                >
                  Engineering Mathematics
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('subjects')}
                  className="hover:text-white transition-colors"
                >
                  Programming / C
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('subjects')}
                  className="hover:text-white transition-colors"
                >
                  Electrical Engineering
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('subjects')}
                  className="hover:text-white transition-colors"
                >
                  Engineering Chemistry
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Features */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Platform Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('ai')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Icons.Bot className="w-3.5 h-3.5 text-blue-400" />
                  StudySphere AI
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('resources')}
                  className="hover:text-white transition-colors"
                >
                  Lecture Catalog
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('resources')}
                  className="hover:text-white transition-colors"
                >
                  Verified PDF Notes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-white transition-colors"
                >
                  Progress Tracker
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 StudySphere. Designed & developed by a student hackathon team.</p>
          <p className="flex items-center gap-1 text-[11px]">
            <span>Clean code</span> • <span>Modular React</span> • <span>Fast SQLite backend</span>
          </p>
        </div>
      </div>
    </footer>
  );
}


// ==========================================
// File: src/pages/Home.jsx
// ==========================================





/**
 * Home Page Component
 * ===================
 * Welcomes students, presents clean search, subject cards,
 * and dynamically displays popular, top-rated, and recently added materials
 * strictly calculated from real database records with graceful empty states.
 */
function Home({
  resources = [],
  user,
  onNavigate,
  onOpenResource,
  onToggleBookmark,
  bookmarkedIds = new Set(),
  completedIds = new Set()
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate('resources', { search: searchQuery });
  };

  const subjectsList = [
    'Engineering Physics',
    'Engineering Mathematics',
    'Programming / C',
    'Electrical Engineering',
    'Engineering Chemistry'
  ];

  const getSubjectStats = (subjectName) => {
    const list = resources.filter((r) => r.subject === subjectName);
    return {
      notes: list.filter((r) => r.type === 'pdf').length,
      lectures: list.filter((r) => r.type === 'lecture').length
    };
  };

  // Popular resources (weighted ranking score on real data)
  const popularResources = [...resources]
    .sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0))
    .slice(0, 4);

  // Top-rated resources (only those with at least 1 actual rating)
  const topRatedResources = [...resources]
    .filter((r) => (r.rating_count || 0) > 0)
    .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
    .slice(0, 4);

  // Recently added resources
  const recentResources = [...resources]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white pt-16 pb-20 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
            <Icons.Sparkles className="w-3.5 h-3.5" />
            <span>Undergraduate Study Hub • Learn. Explore. Grow.</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Your study material, <br />
            <span className="text-blue-600">all in one place.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Browse course notes, watch video lectures organized by subject,
            rate materials, and ask questions to StudySphere AI.
          </p>

          {/* Global Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto relative flex items-center shadow-md rounded-2xl bg-white border border-slate-200 p-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"
          >
            <div className="pl-3.5 text-slate-400">
              <Icons.Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lectures, notes, quantum physics, eigenvalues, C pointers..."
              className="w-full px-3 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
            />
            <button
              type="submit"
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('resources')}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow transition-colors"
            >
              <span>Explore Resources</span>
              <Icons.ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('ai')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl shadow-sm transition-colors"
            >
              <Icons.Bot className="w-4 h-4 text-blue-600" />
              <span>Ask StudySphere AI</span>
            </button>
          </div>
        </div>
      </section>

      {/* Subject Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Subject Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Core undergraduate syllabus subjects with notes and video lectures.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('subjects')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Subjects</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjectsList.map((subject) => {
            const stats = getSubjectStats(subject);
            return (
              <SubjectCard
                key={subject}
                subject={subject}
                notesCount={stats.notes}
                lecturesCount={stats.lectures}
                onClick={() => onNavigate('subjects', { subject })}
              />
            );
          })}
        </div>
      </section>

      {/* Popular Resources Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Popular Resources
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Ranked dynamically by student ratings and view activity.
            </p>
          </div>

          {popularResources.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('resources', { sort: 'popular' })}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>See more</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {popularResources.length === 0 ? (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">No resources available yet.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Materials uploaded by course administrators will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {popularResources.map((res) => (
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

      {/* Top-Rated Lectures & Notes */}
      {topRatedResources.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Top-Rated Lectures & Notes ⭐
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Highest rated materials based on verified student reviews.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('resources', { sort: 'highest_rated' })}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>See more</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topRatedResources.map((res) => (
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

      {/* Recently Added Section */}
      {recentResources.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Recently Added Resources
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Latest study materials and lectures published to the platform.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('resources', { sort: 'newest' })}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Browse all</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentResources.map((res) => (
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

      {/* Logged-Out Callout */}
      {!user && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold">
                Join your classmates on StudySphere
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md">
                Create a student profile to save bookmarks, submit ratings, track read progress, and chat with StudySphere AI.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}


// ==========================================
// File: src/pages/Subjects.jsx
// ==========================================




/**
 * Subjects Page Component
 * =======================
 * Dedicated subject hub. Allows switching between core subjects,
 * filtering between Notes and Lectures, and searching within the selected subject.
 */
function Subjects({
  resources = [],
  initialSubject = 'Engineering Physics',
  onOpenResource,
  onToggleBookmark,
  bookmarkedIds = new Set(),
  completedIds = new Set()
}) {
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || 'Engineering Physics');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All', 'pdf', 'lecture'
  const [searchQuery, setSearchQuery] = useState('');

  const subjects = [
    'Engineering Physics',
    'Engineering Mathematics',
    'Programming / C',
    'Electrical Engineering',
    'Engineering Chemistry',
    'Other'
  ];

  // Filter resources based on selected subject, type, and search query
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      // Subject check
      if (selectedSubject !== 'All' && res.subject !== selectedSubject) {
        return false;
      }
      // Type check
      if (typeFilter !== 'All' && res.type !== typeFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = res.title?.toLowerCase().includes(q);
        const matchDesc = res.description?.toLowerCase().includes(q);
        const matchUnit = res.unit?.toLowerCase().includes(q);
        const matchTags = res.tags?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchUnit && !matchTags) return false;
      }
      return true;
    });
  }, [resources, selectedSubject, typeFilter, searchQuery]);

  // Separate into Notes and Lectures for detailed view
  const notesList = filteredResources.filter((r) => r.type === 'pdf');
  const lecturesList = filteredResources.filter((r) => r.type === 'lecture');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Academics</span>
          <span>/</span>
          <span className="text-blue-600 font-medium">{selectedSubject}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Subject Learning Modules
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Browse vetted lecture playlists and downloadable PDF study notes for semester exam readiness.
        </p>
      </div>

      {/* Subject Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {subjects.map((sub) => {
          const isSelected = selectedSubject === sub;
          const count = resources.filter((r) => r.subject === sub).length;

          return (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubject(sub)}
              className={`shrink-0 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{sub}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* In-Subject Search & Type Toggle Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search within subject */}
        <div className="relative w-full sm:w-80">
          <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${selectedSubject}...`}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTypeFilter('All')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              typeFilter === 'All'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({filteredResources.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('pdf')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
              typeFilter === 'pdf'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icons.FileText className="w-3.5 h-3.5" />
            <span>Notes ({notesList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('lecture')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
              typeFilter === 'lecture'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icons.Video className="w-3.5 h-3.5" />
            <span>Lectures ({lecturesList.length})</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Icons.Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No matching resources found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try clearing your search query or switching resource filters to see materials for {selectedSubject}.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('All');
            }}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Section 1: Study Notes (if filtering All or pdf) */}
          {(typeFilter === 'All' || typeFilter === 'pdf') && notesList.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Icons.FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  📚 Study Notes & Formula Sheets ({notesList.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {notesList.map((res) => (
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
            </div>
          )}

          {/* Section 2: Video Lectures (if filtering All or lecture) */}
          {(typeFilter === 'All' || typeFilter === 'lecture') && lecturesList.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Icons.Video className="w-4 h-4 text-rose-600" />
                <h2 className="text-base font-bold text-slate-900">
                  🎥 Video Lectures & Masterclasses ({lecturesList.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {lecturesList.map((res) => (
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ==========================================
// File: src/pages/Resources.jsx
// ==========================================




/**
 * Resources Page Component
 * ========================
 * Comprehensive catalog of all available notes and lectures.
 * Features search, subject filter, type filter, rating threshold,
 * and sort options (Bayesian Popular, Highest Rated, Most Viewed, Newest).
 */
function Resources({
  resources = [],
  initialSearch = '',
  initialSort = 'popular',
  onOpenResource,
  onToggleBookmark,
  bookmarkedIds = new Set(),
  completedIds = new Set()
}) {
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [sortBy, setSortBy] = useState(initialSort || 'popular');

  const subjects = [
    'All',
    'Engineering Physics',
    'Engineering Mathematics',
    'Programming / C',
    'Electrical Engineering',
    'Engineering Chemistry'
  ];

  const filteredAndSortedResources = useMemo(() => {
    // 1. Filter
    let list = resources.filter((res) => {
      // Subject filter
      if (subjectFilter !== 'All' && res.subject !== subjectFilter) return false;

      // Type filter
      if (typeFilter !== 'All' && res.type !== typeFilter) return false;

      // Minimum rating filter
      if (ratingFilter !== 'All') {
        const min = parseFloat(ratingFilter);
        if ((res.average_rating || 0) < min) return false;
      }

      // Search query (title, description, subject, unit, tags)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = res.title?.toLowerCase().includes(q);
        const matchDesc = res.description?.toLowerCase().includes(q);
        const matchSub = res.subject?.toLowerCase().includes(q);
        const matchUnit = res.unit?.toLowerCase().includes(q);
        const matchTags = res.tags?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSub && !matchUnit && !matchTags) return false;
      }

      return true;
    });

    // 2. Sort
    list.sort((a, b) => {
      if (sortBy === 'highest_rated') {
        return (b.average_rating || 0) - (a.average_rating || 0);
      }
      if (sortBy === 'views') {
        return (b.view_count || 0) - (a.view_count || 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      // default: 'popular' using Bayesian ranking score
      return (b.rankingScore || 0) - (a.rankingScore || 0);
    });

    return list;
  }, [resources, searchQuery, subjectFilter, typeFilter, ratingFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSubjectFilter('All');
    setTypeFilter('All');
    setRatingFilter('All');
    setSortBy('popular');
  };

  const hasActiveFilters =
    searchQuery ||
    subjectFilter !== 'All' ||
    typeFilter !== 'All' ||
    ratingFilter !== 'All' ||
    sortBy !== 'popular';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Resource Catalog
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Explore all peer-reviewed study notes, formula sheets, and video lectures.
        </p>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        {/* Top: Search input */}
        <div className="relative">
          <Icons.Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords, topics (e.g. quantum, matrices, pointers, kirchhoff, entropy)..."
            className="w-full pl-11 pr-10 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Subject Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Subject
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Type Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Resource Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Types (Notes & Lectures)</option>
              <option value="pdf">📄 PDF Notes Only</option>
              <option value="lecture">🎥 Video Lectures Only</option>
            </select>
          </div>

          {/* Rating Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Minimum Rating
            </label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">Any Rating</option>
              <option value="4.0">⭐ 4.0 & above</option>
              <option value="4.5">⭐ 4.5 & above</option>
              <option value="4.8">⭐ 4.8 & above</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="popular">🔥 Most Popular (Bayesian Weighted)</option>
              <option value="highest_rated">⭐ Highest Rated</option>
              <option value="views">👁️ Most Viewed</option>
              <option value="newest">🕒 Recently Added</option>
            </select>
          </div>
        </div>

        {/* Status line & Clear filters */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredAndSortedResources.length}</strong> of{' '}
            <strong className="text-slate-800">{resources.length}</strong> resources
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
            >
              <Icons.X className="w-3.5 h-3.5" />
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {filteredAndSortedResources.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Icons.Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No matching resources found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing the rating threshold, or switching subjects.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredAndSortedResources.map((res) => (
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
    </div>
  );
}


// ==========================================
// File: src/pages/Dashboard.jsx
// ==========================================





/**
 * Dashboard Page Component
 * ========================
 * Student dashboard displaying real personalized learning metrics:
 * - Real completion percentages
 * - Real recently viewed resources
 * - Real subject progress bars
 * - Empty states for new students with no fake data.
 */
function Dashboard({
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


// ==========================================
// File: src/pages/Bookmarks.jsx
// ==========================================





/**
 * Bookmarks Page Component
 * ========================
 * "My Bookmarks" repository showing saved notes and lectures.
 */
function Bookmarks({
  onNavigate,
  onOpenResource,
  onToggleBookmark,
  bookmarkedIds = new Set(),
  completedIds = new Set()
}) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const res = await api.getBookmarks();
        setBookmarks(res.bookmarks || []);
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookmarks();
  }, [bookmarkedIds]);

  const handleRemoveBookmark = async (id) => {
    await onToggleBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading your saved bookmarks...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <Icons.Bookmark className="w-4 h-4" filled />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Personal Library
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          My Saved Bookmarks
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Quickly access your pinned PDF revision sheets and video lectures.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Icons.Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No bookmarks saved yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you find a useful lecture or PDF note, click the bookmark icon on its card to save it here for fast revision!
          </p>
          <button
            type="button"
            onClick={() => onNavigate('resources')}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
          >
            Browse Resources Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
            <span>
              You have <strong className="text-slate-800">{bookmarks.length}</strong> saved study materials
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {bookmarks.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                onOpenResource={onOpenResource}
                onToggleBookmark={() => handleRemoveBookmark(res.id)}
                isBookmarked={true}
                isCompleted={completedIds.has(res.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ==========================================
// File: src/pages/StudyAI.jsx
// ==========================================




/**
 * StudySphere AI Page Component
 * ==============================
 * Context-aware study tutor designed to help students understand
 * coursework and uploaded study notes/lectures on StudySphere.
 * Supports resource-based answering, step-by-step breakdowns,
 * conversational session memory, and follow-up clarifications.
 */
function StudyAI({ initialContext = null, onClearContext = null }) {
  const [activeContext, setActiveContext] = useState(initialContext);
  const [messages, setMessages] = useState(() => {
    if (initialContext) {
      return [
        {
          role: 'assistant',
          content:
            `👋 Hello! I am **StudySphere AI**.\n\n` +
            `I see you are currently studying **"${initialContext.title}"** (${initialContext.subject} — ${initialContext.unit}).\n\n` +
            `I have indexed the material from this resource. You can ask me:\n` +
            `- *"Can you explain the main concepts in this material?"*\n` +
            `- *"Break down the equations step-by-step for exam prep."*\n` +
            `- *"What are the key exam takeaways?"*`
        }
      ];
    }
    return [
      {
        role: 'assistant',
        content:
          "👋 Hello! I am **StudySphere AI**.\n\n" +
          "My purpose is to help you understand the study materials available on StudySphere across **Physics**, **Mathematics**, **C Programming**, **Electrical Engineering**, and **Chemistry**.\n\n" +
          "Ask me a conceptual question, a formula breakdown, or open any study note and click **'Ask StudySphere AI'** to chat with resource context!"
      }
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const chatEndRef = useRef(null);

  // Update context when initialContext prop changes
  useEffect(() => {
    if (initialContext && (!activeContext || initialContext.id !== activeContext.id)) {
      setActiveContext(initialContext);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            `📚 **Attached Study Context:** Now focusing on **"${initialContext.title}"** (${initialContext.subject} - ${initialContext.unit}). Ask me questions about this specific material!`
        }
      ]);
    }
  }, [initialContext]);

  // Context-specific or general suggested prompt chips
  const samplePrompts = activeContext
    ? [
        `Explain the core concept in ${activeContext.title.split('—')[0].trim()}`,
        'What are the most important formulas here?',
        'Break down this material step-by-step for exams',
        'Give a practical example of this concept'
      ]
    : [
        'What is the photoelectric effect?',
        'Explain Eigenvalues and Eigenvectors simply',
        'How do pointers and memory work in C?',
        'Explain Kirchhoff\'s Current & Voltage Laws',
        'What is Gibbs Free Energy and Phase Rule?'
      ];

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setErrorMsg('');
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build context payload
      const contextPayload = activeContext
        ? {
            resourceId: activeContext.id,
            title: activeContext.title,
            subject: activeContext.subject,
            unit: activeContext.unit,
            contentText: activeContext.content_text || activeContext.description || ''
          }
        : null;

      // Pass multi-turn conversation messages and active resource context
      const res = await api.askAI(
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        contextPayload
      );

      if (res.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.reply }
        ]);
      } else {
        throw new Error('Empty response from AI assistant.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setErrorMsg('Unable to reach study assistant right now.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "⚠️ *I couldn't process that query right now.* Please verify your server is running and try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          "✨ **New chat session started.** Ask me anything about your engineering syllabus or coursework."
      }
    ]);
    setErrorMsg('');
  };

  const handleDetachContext = () => {
    setActiveContext(null);
    if (onClearContext) onClearContext();
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          "ℹ️ **Switched to General Mode.** StudySphere AI is now answering general engineering coursework questions."
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-4.5rem)] flex flex-col">
      {/* Top Header Bar */}
      <div className="pb-3 mb-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Icons.Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                StudySphere AI
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Course Tutor
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Undergraduate Engineering Concept Tutor & Resource Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5"
            title="Start fresh conversation"
          >
            <Icons.Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Active Resource Context Banner */}
      {activeContext && (
        <div className="mb-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded bg-indigo-200 text-indigo-800 shrink-0">
              <Icons.BookOpen className="w-3.5 h-3.5" />
            </span>
            <div className="truncate">
              <span className="font-semibold text-indigo-900">Studying Resource Context: </span>
              <span className="text-indigo-800 font-medium">"{activeContext.title}"</span>
              <span className="text-indigo-600 ml-1">({activeContext.subject})</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDetachContext}
            className="shrink-0 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 rounded transition-colors"
            title="Detach context and switch to general mode"
          >
            Switch to General
          </button>
        </div>
      )}

      {/* Suggested Prompt Chips */}
      <div className="mb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(prompt)}
              className="shrink-0 px-3 py-1 text-xs bg-white text-slate-700 hover:text-blue-600 hover:border-blue-300 border border-slate-200 rounded-full shadow-2xs transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto bg-slate-50/70 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isUser ? <Icons.User className="w-3.5 h-3.5" /> : <Icons.Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-2xs ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none text-xs sm:text-sm font-medium whitespace-pre-wrap'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Icons.Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-2xs flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-slate-400 pl-2">Analyzing and preparing answer...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} className="p-1">
            <Icons.X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="mt-3 flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            activeContext
              ? `Ask a question about ${activeContext.title.split('—')[0].trim()}...`
              : "Ask a question about physics formulas, linear algebra, C pointers, etc..."
          }
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className={`p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center ${
            inputValue.trim() && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
          title="Send query"
        >
          <Icons.Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}


// ==========================================
// File: src/pages/AdminDashboard.jsx
// ==========================================





/**
 * AdminDashboard Page Component
 * ==============================
 * Dedicated administrative workspace for course staff.
 * Gated strictly to users with role === 'admin'.
 * 
 * Sections:
 *   1. Resources:
 *      - [ Upload Notes ]
 *      - [ Upload Lecture ]
 *      - [ Manage Resources ] (Search, filter by subject, edit, delete with confirmation)
 *   2. Users:
 *      - [ Login History ] (Real login events only)
 *      - [ Registered Students ] (Real student profiles without sensitive credentials)
 */
function AdminDashboard({
  user,
  resources = [],
  onRefreshResources,
  onShowToast
}) {
  // Navigation tabs: 'manage', 'upload_notes', 'upload_lecture', 'login_history', 'registered_students'
  const [activeTab, setActiveTab] = useState('manage');

  // Real data state
  const [loginHistory, setLoginHistory] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Search & filter state for Manage Resources
  const [manageSearch, setManageSearch] = useState('');
  const [manageSubjectFilter, setManageSubjectFilter] = useState('All');

  // Form state for Uploading Notes
  const [noteForm, setNoteForm] = useState({
    title: '',
    subject: 'Engineering Physics',
    unit: '',
    description: '',
    tags: '',
    pdfFile: null
  });
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Form state for Uploading Lecture
  const [lectureForm, setLectureForm] = useState({
    title: '',
    subject: 'Engineering Physics',
    unit: '',
    description: '',
    tags: '',
    videoUrl: ''
  });

  // Edit resource modal state
  const [editingResource, setEditingResource] = useState(null);
  const [deleteConfirmResource, setDeleteConfirmResource] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Login History when tab is active
  useEffect(() => {
    if (activeTab === 'login_history') {
      fetchLoginHistory();
    } else if (activeTab === 'registered_students') {
      fetchRegisteredUsers();
    }
  }, [activeTab]);

  const fetchLoginHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.adminGetLoginHistory();
      setLoginHistory(data.loginHistory || []);
    } catch (err) {
      onShowToast(err.message || 'Failed to load login history.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchRegisteredUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.adminGetUsers();
      setRegisteredUsers(data.users || []);
    } catch (err) {
      onShowToast(err.message || 'Failed to load registered students.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Authorization Guard
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Icons.Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-xs text-slate-600">
          This portal is reserved strictly for faculty and course administrators. Your current account does not have administrator privileges.
        </p>
      </div>
    );
  }

  const subjects = [
    'Engineering Physics',
    'Engineering Mathematics',
    'Programming / C',
    'Electrical Engineering',
    'Engineering Chemistry',
    'Other'
  ];

  // Handle Note PDF upload submission
  const handleUploadNotes = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.unit.trim() || !noteForm.description.trim()) {
      onShowToast('Please fill in Title, Subject, Unit, and Description.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let finalFileUrl = '';
      let extractedText = '';

      if (noteForm.pdfFile) {
        setUploadingPdf(true);
        const uploadRes = await api.adminUploadPdf(noteForm.pdfFile);
        finalFileUrl = uploadRes.fileUrl;
        extractedText = uploadRes.extractedText || '';
        setUploadingPdf(false);
      }

      await api.adminCreateResource({
        title: noteForm.title.trim(),
        subject: noteForm.subject,
        unit: noteForm.unit.trim(),
        type: 'pdf',
        description: noteForm.description.trim(),
        fileUrl: finalFileUrl,
        tags: noteForm.tags.trim(),
        contentText: extractedText
      });

      onShowToast('Note uploaded successfully.', 'success');
      setNoteForm({
        title: '',
        subject: 'Engineering Physics',
        unit: '',
        description: '',
        tags: '',
        pdfFile: null
      });
      setActiveTab('manage');
      onRefreshResources();
    } catch (err) {
      onShowToast(err.message || 'Failed to upload note.', 'error');
    } finally {
      setSubmitting(false);
      setUploadingPdf(false);
    }
  };

  // Handle Lecture video submission
  const handleUploadLecture = async (e) => {
    e.preventDefault();
    if (!lectureForm.title.trim() || !lectureForm.unit.trim() || !lectureForm.videoUrl.trim() || !lectureForm.description.trim()) {
      onShowToast('Please fill in Lecture Title, Subject, Unit, Video URL, and Description.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.adminCreateResource({
        title: lectureForm.title.trim(),
        subject: lectureForm.subject,
        unit: lectureForm.unit.trim(),
        type: 'lecture',
        description: lectureForm.description.trim(),
        videoUrl: lectureForm.videoUrl.trim(),
        tags: lectureForm.tags.trim(),
        contentText: `${lectureForm.title}. ${lectureForm.description}`
      });

      onShowToast('Lecture added successfully.', 'success');
      setLectureForm({
        title: '',
        subject: 'Engineering Physics',
        unit: '',
        description: '',
        tags: '',
        videoUrl: ''
      });
      setActiveTab('manage');
      onRefreshResources();
    } catch (err) {
      onShowToast(err.message || 'Failed to publish lecture.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit submission
  const handleUpdateResource = async (e) => {
    e.preventDefault();
    if (!editingResource) return;

    setSubmitting(true);
    try {
      await api.adminUpdateResource(editingResource.id, editingResource);
      onShowToast('Resource information updated successfully.', 'success');
      setEditingResource(null);
      onRefreshResources();
    } catch (err) {
      onShowToast(err.message || 'Failed to update resource.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete confirmation
  const handleDeleteResource = async (id) => {
    setSubmitting(true);
    try {
      await api.adminDeleteResource(id);
      onShowToast('Resource deleted successfully.', 'success');
      setDeleteConfirmResource(null);
      onRefreshResources();
    } catch (err) {
      onShowToast(err.message || 'Failed to delete resource.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered resources for Manage Resources tab
  const filteredManageResources = resources.filter((res) => {
    if (manageSubjectFilter !== 'All' && res.subject !== manageSubjectFilter) return false;
    if (manageSearch.trim()) {
      const q = manageSearch.toLowerCase();
      const matchTitle = res.title?.toLowerCase().includes(q);
      const matchUnit = res.unit?.toLowerCase().includes(q);
      const matchTags = res.tags?.toLowerCase().includes(q);
      if (!matchTitle && !matchUnit && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-100 text-amber-800">
              <Icons.Shield className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Authenticated administrator: <strong>{user.email}</strong>
          </p>
        </div>

        {/* Navigation Sections */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden lg:block">
            Resources:
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'manage'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manage Resources
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload_notes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'upload_notes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            Upload Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload_lecture')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'upload_lecture'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            Upload Lecture
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden lg:block">
            Users:
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('login_history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'login_history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icons.Eye className="w-3.5 h-3.5" />
            Login History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('registered_students')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'registered_students'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icons.User className="w-3.5 h-3.5" />
            Registered Students
          </button>
        </div>
      </div>

      {/* SECTION 1: MANAGE RESOURCES */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Uploaded Resources ({resources.length})
              </h2>
              <p className="text-xs text-slate-500">
                Search, filter by subject, edit details, or remove study materials.
              </p>
            </div>

            {/* Quick Filter & Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Icons.Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                  placeholder="Search resources..."
                  className="pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                />
              </div>

              <select
                value={manageSubjectFilter}
                onChange={(e) => setManageSubjectFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="All">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredManageResources.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Icons.FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No resources found.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {resources.length === 0
                  ? "No materials have been uploaded yet. Click 'Upload Notes' or 'Upload Lecture' to publish your first resource."
                  : "No resources matched your current filter criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Title & Unit</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Ratings</th>
                    <th className="px-4 py-3">Views</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredManageResources.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {res.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {res.unit}
                        </p>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-800">
                        {res.subject}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            res.type === 'pdf'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {res.type === 'pdf' ? '📄 Notes' : '🎥 Lecture'}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <RatingStars rating={res.average_rating} count={res.rating_count} size="w-3.5 h-3.5" />
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap font-semibold text-slate-800">
                        {res.view_count || 0}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingResource({ ...res })}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmResource(res)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: UPLOAD NOTES */}
      {activeTab === 'upload_notes' && (
        <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Upload Study Notes
            </h2>
            <p className="text-xs text-slate-500">
              Attach course syllabus notes in PDF format. Text is automatically indexed for StudySphere AI.
            </p>
          </div>

          <form onSubmit={handleUploadNotes} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                placeholder="e.g. Quantum Physics — Photoelectric Effect Notes"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject *
                </label>
                <select
                  value={noteForm.subject}
                  onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit / Topic *
                </label>
                <input
                  type="text"
                  required
                  value={noteForm.unit}
                  onChange={(e) => setNoteForm({ ...noteForm, unit: e.target.value })}
                  placeholder="e.g. Unit 1: Quantum Mechanics"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PDF File (.pdf)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setNoteForm({ ...noteForm, pdfFile: e.target.files[0] })}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Maximum file size: 10MB.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={noteForm.description}
                onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                placeholder="Summary of formulas, derivations, and exam topics covered..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={noteForm.tags}
                onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                placeholder="e.g. quantum, physics, exam notes"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              >
                {uploadingPdf ? 'Uploading PDF...' : submitting ? 'Saving...' : 'Upload Note'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: UPLOAD LECTURE */}
      {activeTab === 'upload_lecture' && (
        <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Upload Video Lecture
            </h2>
            <p className="text-xs text-slate-500">
              Add curated video lectures or YouTube links for undergraduate subjects.
            </p>
          </div>

          <form onSubmit={handleUploadLecture} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lecture Title *
              </label>
              <input
                type="text"
                required
                value={lectureForm.title}
                onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                placeholder="e.g. Compton Scattering & Wave Hypothesis Masterclass"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject *
                </label>
                <select
                  value={lectureForm.subject}
                  onChange={(e) => setLectureForm({ ...lectureForm, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit / Topic *
                </label>
                <input
                  type="text"
                  required
                  value={lectureForm.unit}
                  onChange={(e) => setLectureForm({ ...lectureForm, unit: e.target.value })}
                  placeholder="e.g. Unit 1: Quantum Mechanics"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Video URL (YouTube or MP4) *
              </label>
              <input
                type="url"
                required
                value={lectureForm.videoUrl}
                onChange={(e) => setLectureForm({ ...lectureForm, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={lectureForm.description}
                onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                placeholder="Overview of lecture topics and concepts..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={lectureForm.tags}
                onChange={(e) => setLectureForm({ ...lectureForm, tags: e.target.value })}
                placeholder="e.g. compton, scattering, wave hypothesis"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
              >
                {submitting ? 'Publishing...' : 'Add Lecture'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 4: LOGIN HISTORY (Real login events) */}
      {activeTab === 'login_history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Login History
              </h2>
              <p className="text-xs text-slate-500">
                Recorded whenever a registered user logs into the website. Real events only.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchLoginHistory}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading login events...</div>
          ) : loginHistory.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">No login history recorded yet.</p>
              <p className="text-xs text-slate-400">Login events will appear here as users sign in.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">User Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Login Date</th>
                    <th className="px-6 py-3">Login Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loginHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-900">
                        {item.user_name}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {item.email}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {item.login_date}
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-500">
                        {item.login_time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: REGISTERED STUDENTS */}
      {activeTab === 'registered_students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Registered Students
              </h2>
              <p className="text-xs text-slate-500">
                Real student accounts created on the platform. Passwords and credentials are never shown.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchRegisteredUsers}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Refresh
            </button>
          </div>

          {loadingUsers ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading student list...</div>
          ) : registeredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">No registered students yet.</p>
              <p className="text-xs text-slate-400">Student accounts will appear here once they sign up.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registeredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-900">
                        {u.name}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {u.email}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {u.joinedFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EDIT RESOURCE MODAL */}
      {editingResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Edit Resource Information
              </h3>
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateResource} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingResource.title}
                  onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={editingResource.subject}
                    onChange={(e) => setEditingResource({ ...editingResource, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={editingResource.unit}
                    onChange={(e) => setEditingResource({ ...editingResource, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editingResource.description}
                  onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={editingResource.tags || ''}
                  onChange={(e) => setEditingResource({ ...editingResource, tags: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Icons.Trash className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Confirm Resource Deletion
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this resource?
            </p>
            <p className="text-xs font-semibold text-slate-900 bg-slate-100 p-2 rounded-lg">
              "{deleteConfirmResource.title}"
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmResource(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteResource(deleteConfirmResource.id)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ==========================================
// File: src/pages/Login.jsx
// ==========================================




/**
 * Login Page Component
 * ====================
 * Normal student & admin authentication form.
 * Zero demo buttons or pre-filled shortcuts.
 * Redirects to Student Dashboard (for students) or Admin Dashboard (for admin).
 */
function Login({ onLoginSuccess, onNavigate, onShowToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      onShowToast(`Welcome back, ${data.user.name}!`, 'success');
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 sm:px-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Icons.BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 pt-2">
            Sign In to StudySphere
          </h1>
          <p className="text-xs text-slate-500">
            Access your course materials, ratings, and syllabus progress.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <Icons.Shield className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@college.edu"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Registration CTA Link */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="text-blue-600 font-semibold hover:underline"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// File: src/pages/Register.jsx
// ==========================================




/**
 * Register Page Component
 * =======================
 * Real student and admin account creation form.
 * Creates profile, securely hashes password, and logs in user session.
 */
function Register({ onRegisterSuccess, onNavigate, onShowToast }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await api.register(name.trim(), email.trim(), password);
      onShowToast(`Account created! Welcome to StudySphere, ${data.user.name}.`, 'success');
      onRegisterSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 sm:px-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Icons.GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 pt-2">
            Create Student Account
          </h1>
          <p className="text-xs text-slate-500">
            Sign up to access course materials, submit ratings, and track study progress.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <Icons.Shield className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@college.edu"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password (min. 6 characters)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Existing Account Link */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// File: src/App.jsx
// ==========================================







// Pages









// API & Storage

/**
 * StudySphere Main Application
 * =============================
 * Core controller managing routing, real user authentication,
 * context-aware StudySphere AI, and resource interactions.
 */
function App() {
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


// ==========================================
// Application Mount Point
// ==========================================
(function mountApp() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  } else {
    console.error('Could not find #root element to mount StudySphere.');
  }
})();
