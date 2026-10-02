import React, { useState } from 'react';
import { Icons } from './Icons.js';
import { RatingStars } from './RatingStars.js';

/**
 * VideoPlayerModal Component
 * ==========================
 * Responsive video lecture player modal with real 1-5 rating,
 * "Mark as Completed", and "Ask StudySphere AI about this Lecture" contextual button.
 */
export function VideoPlayerModal({
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
