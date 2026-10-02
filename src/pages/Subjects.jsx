import React, { useState, useMemo } from 'react';
import { Icons } from '../components/Icons.js';
import { ResourceCard } from '../components/ResourceCard.js';

/**
 * Subjects Page Component
 * =======================
 * Dedicated subject hub. Allows switching between core subjects,
 * filtering between Notes and Lectures, and searching within the selected subject.
 */
export function Subjects({
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
