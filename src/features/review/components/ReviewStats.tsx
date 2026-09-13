"use client";

import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { BookReviewStats } from "../types/review.type";
import { StarRating } from "./StarRating";

const copy = {
  en: {
    reviews: "reviews",
    outOf: "out of 5",
  },
  vi: {
    reviews: "đánh giá",
    outOf: "trên 5",
  },
};

export function ReviewStats({ stats }: { stats: BookReviewStats }) {
  const { locale } = useLanguage();
  const text = copy[locale];
  const maxCount = Math.max(...Object.values(stats.ratingDistribution), 1);

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-[#E1E6F0] bg-[#F8FAFC] p-6 sm:flex-row sm:items-start sm:gap-10">
      {/* Left: Big average */}
      <div className="flex shrink-0 flex-col items-center text-center sm:min-w-[140px]">
        <span className="text-5xl font-black leading-none text-[#111827]">
          {stats.averageRating.toFixed(1)}
        </span>
        <div className="mt-2">
          <StarRating rating={stats.averageRating} size="md" />
        </div>
        <p className="mt-1.5 text-sm font-medium text-[#6B7280]">
          {stats.totalReviews} {text.reviews}
        </p>
        <p className="text-xs text-[#9CA3AF]">{text.outOf}</p>
      </div>

      {/* Right: Distribution bars */}
      <div className="flex flex-1 flex-col gap-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.ratingDistribution[star] ?? 0;
          const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-3">
              <span className="w-8 shrink-0 text-right text-sm font-bold text-[#374151]">
                {star}★
              </span>
              <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-semibold text-[#6B7280]">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
