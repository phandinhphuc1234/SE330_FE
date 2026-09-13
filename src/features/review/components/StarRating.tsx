"use client";

import { useState, useId } from "react";

type StarRatingProps = {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
};

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function StarRating({ rating, maxStars = 5, size = "md", interactive = false, onChange }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const uniqueId = useId();
  const safeRating = rating || 0;
  const displayRating = hoverRating || safeRating;
  const px = sizeMap[size];

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => interactive && setHoverRating(0)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${safeRating} out of ${maxStars} stars`}
    >
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const fillPercent = Math.min(Math.max(displayRating - i, 0), 1) * 100;

        return (
          <button
            key={starIndex}
            type="button"
            disabled={!interactive}
            className={`relative shrink-0 border-none bg-transparent p-0 outline-none ${
              interactive
                ? "cursor-pointer transition-transform duration-150 hover:scale-110 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:rounded-sm"
                : "cursor-default"
            }`}
            style={{ width: px, height: px }}
            onClick={() => interactive && onChange?.(starIndex)}
            onMouseEnter={() => interactive && setHoverRating(starIndex)}
            aria-label={`${starIndex} star${starIndex > 1 ? "s" : ""}`}
          >
            <svg
              viewBox="0 0 24 24"
              width={px}
              height={px}
              className="block"
              aria-hidden="true"
            >
              <defs>
                <clipPath id={`star-clip-${uniqueId}-${starIndex}`}>
                  <rect x="0" y="0" width={(fillPercent / 100) * 24} height="24" />
                </clipPath>
              </defs>

              {/* Empty star background */}
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Filled star */}
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="#f59e0b"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                clipPath={`url(#star-clip-${uniqueId}-${starIndex})`}
                className="transition-all duration-200"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
