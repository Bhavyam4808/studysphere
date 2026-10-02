import React, { useState } from 'react';
import { Icons } from './Icons.js';
import { RatingStars } from './RatingStars.js';

/**
 * PdfViewerModal Component
 * ========================
 * In-browser PDF reader modal. Displays PDF in iframe, provides download,
 * allows real 1-5 star rating, tracks "Mark as Read",
 * and features a direct "Ask StudySphere AI about this Note" action.
 */
export function PdfViewerModal({
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
