import React from 'react';
import { Icons } from './Icons.js';
import { RatingStars } from './RatingStars.js';

/**
 * ResourceCard Component
 * ======================
 * Renders study material cards with real view count, real ratings,
 * subject tags, bookmark toggle, and Read/Watch buttons.
 */
export function ResourceCard({
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
