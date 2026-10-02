import React, { useEffect, useState } from 'react';
import { Icons } from '../components/Icons.js';
import { ResourceCard } from '../components/ResourceCard.js';
import { api } from '../api.js';

/**
 * Bookmarks Page Component
 * ========================
 * "My Bookmarks" repository showing saved notes and lectures.
 */
export function Bookmarks({
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
