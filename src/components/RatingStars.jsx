import React, { useState } from 'react';
import { Icons } from './Icons.js';

/**
 * RatingStars Component
 * =====================
 * Supports both display mode (read-only with real average score)
 * and interactive rating mode (1-5 clickable stars).
 * Shows "Not rated yet" when count === 0.
 */
export function RatingStars({
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
