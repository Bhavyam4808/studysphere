import React, { useState, useMemo } from 'react';
import { Icons } from '../components/Icons.js';
import { ResourceCard } from '../components/ResourceCard.js';

/**
 * Resources Page Component
 * ========================
 * Comprehensive catalog of all available notes and lectures.
 * Features search, subject filter, type filter, rating threshold,
 * and sort options (Bayesian Popular, Highest Rated, Most Viewed, Newest).
 */
export function Resources({
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
