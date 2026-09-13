"use client";

import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { BookReview } from "../types/review.type";
import { StarRating } from "./StarRating";

const copy = {
  en: {
    edit: "Edit",
    delete: "Delete",
    noContent: "No written review.",
    justNow: "Just now",
    minutesAgo: (n: number) => `${n} minute${n > 1 ? "s" : ""} ago`,
    hoursAgo: (n: number) => `${n} hour${n > 1 ? "s" : ""} ago`,
    daysAgo: (n: number) => `${n} day${n > 1 ? "s" : ""} ago`,
    weeksAgo: (n: number) => `${n} week${n > 1 ? "s" : ""} ago`,
    monthsAgo: (n: number) => `${n} month${n > 1 ? "s" : ""} ago`,
    yearsAgo: (n: number) => `${n} year${n > 1 ? "s" : ""} ago`,
    you: "(You)",
  },
  vi: {
    edit: "Sửa",
    delete: "Xoá",
    noContent: "Không có bài nhận xét.",
    justNow: "Vừa xong",
    minutesAgo: (n: number) => `${n} phút trước`,
    hoursAgo: (n: number) => `${n} giờ trước`,
    daysAgo: (n: number) => `${n} ngày trước`,
    weeksAgo: (n: number) => `${n} tuần trước`,
    monthsAgo: (n: number) => `${n} tháng trước`,
    yearsAgo: (n: number) => `${n} năm trước`,
    you: "(Bạn)",
  },
};

const avatarColors = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function formatRelativeTime(dateString: string, text: typeof copy.en) {
  const now = Date.now();
  const then = new Date(dateString).getTime();

  if (Number.isNaN(then)) return dateString;

  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMinutes < 1) return text.justNow;
  if (diffMinutes < 60) return text.minutesAgo(diffMinutes);
  if (diffHours < 24) return text.hoursAgo(diffHours);
  if (diffDays < 7) return text.daysAgo(diffDays);
  if (diffWeeks < 5) return text.weeksAgo(diffWeeks);
  if (diffMonths < 12) return text.monthsAgo(diffMonths);
  return text.yearsAgo(diffYears);
}

type ReviewCardProps = {
  review: BookReview;
  isOwn?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ReviewCard({ review, isOwn = false, onEdit, onDelete }: ReviewCardProps) {
  const { locale } = useLanguage();
  const text = copy[locale];
  const initial = (review.memberName || "?").charAt(0).toUpperCase();
  const colorClass = getAvatarColor(review.memberName || "");

  return (
    <div className="group rounded-xl border border-[#E1E6F0] bg-white p-5 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${colorClass}`}
        >
          {initial}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-bold text-[#111827]">
              {review.memberName}
              {isOwn && (
                <span className="ml-1.5 text-xs font-semibold text-[#E60028]">{text.you}</span>
              )}
            </span>
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs font-medium text-[#9CA3AF]">
              {formatRelativeTime(review.createdAt, text)}
            </span>
          </div>

          {/* Review content */}
          {review.content ? (
            <p className="mt-2.5 text-sm leading-relaxed text-[#374151]">
              {review.content}
            </p>
          ) : (
            <p className="mt-2.5 text-sm italic text-[#9CA3AF]">{text.noContent}</p>
          )}

          {/* Actions for own review */}
          {isOwn && (
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#111827] transition-colors hover:bg-[#F3F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827]/20"
              >
                {text.edit}
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20"
              >
                {text.delete}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
