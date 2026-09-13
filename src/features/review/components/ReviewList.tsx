"use client";

import { motion } from "motion/react";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { BookReview } from "../types/review.type";
import { ReviewCard } from "./ReviewCard";

const copy = {
  en: {
    noReviews: "No reviews yet",
    noReviewsBody: "Be the first to share your thoughts about this book.",
    previous: "Previous",
    next: "Next",
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
  },
  vi: {
    noReviews: "Chưa có đánh giá",
    noReviewsBody: "Hãy là người đầu tiên chia sẻ cảm nhận về cuốn sách này.",
    previous: "Trước",
    next: "Sau",
    pageOf: (page: number, total: number) => `Trang ${page} / ${total}`,
  },
};

type ReviewListProps = {
  bookId: string;
  reviews: BookReview[];
  currentUserId?: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEditReview: () => void;
  onDeleteReview: () => void;
};

export function ReviewList({
  reviews,
  currentUserId,
  page,
  totalPages,
  onPageChange,
  onEditReview,
  onDeleteReview,
}: ReviewListProps) {
  const { locale } = useLanguage();
  const text = copy[locale];

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D1D5DB] py-14 text-center">
        <div className="text-4xl">📝</div>
        <p className="mt-3 text-base font-bold text-[#374151]">{text.noReviews}</p>
        <p className="mt-1 text-sm text-[#6B7280]">{text.noReviewsBody}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {reviews.map((review, index) => (
          <motion.div
            key={review.reviewId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
          >
            <ReviewCard
              review={review}
              isOwn={currentUserId !== undefined && review.memberId === currentUserId}
              onEdit={onEditReview}
              onDelete={onDeleteReview}
            />
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => onPageChange(page - 1)}
            className="rounded-full border border-[#D9DCE8] px-5 py-2 text-sm font-bold text-[#111827] transition-all hover:border-[#111827] hover:bg-[#111827] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#D9DCE8] disabled:hover:bg-transparent disabled:hover:text-[#111827]"
          >
            {text.previous}
          </button>

          <span className="text-sm font-medium text-[#6B7280]">
            {text.pageOf(page + 1, totalPages)}
          </span>

          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            className="rounded-full border border-[#D9DCE8] px-5 py-2 text-sm font-bold text-[#111827] transition-all hover:border-[#111827] hover:bg-[#111827] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#D9DCE8] disabled:hover:bg-transparent disabled:hover:text-[#111827]"
          >
            {text.next}
          </button>
        </div>
      )}
    </div>
  );
}
