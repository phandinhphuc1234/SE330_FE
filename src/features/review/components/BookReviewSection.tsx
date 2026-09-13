"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { BookReview, BookReviewStats } from "../types/review.type";
import {
  getBookReviews,
  getBookReviewStats,
  getMyReview,
  deleteReview,
} from "../services/reviewService";
import { ReviewStats } from "./ReviewStats";
import { ReviewForm } from "./ReviewForm";
import { ReviewList } from "./ReviewList";

const copy = {
  en: {
    sectionTitle: "Ratings & Reviews",
    loading: "Loading reviews...",
    deleteConfirm: "Are you sure you want to delete your review?",
    deleteError: "Could not delete review. Please try again.",
    loginPrompt: "Sign in to leave a review.",
    loginLink: "Sign in",
  },
  vi: {
    sectionTitle: "Đánh giá & Nhận xét",
    loading: "Đang tải đánh giá...",
    deleteConfirm: "Bạn có chắc muốn xoá đánh giá của mình?",
    deleteError: "Không thể xoá đánh giá. Vui lòng thử lại.",
    loginPrompt: "Đăng nhập để viết đánh giá.",
    loginLink: "Đăng nhập",
  },
};

export function BookReviewSection({ bookId }: { bookId: string }) {
  const { accessToken, currentUser, isAuthenticated } = useAuth();
  const { locale } = useLanguage();
  const text = copy[locale];

  const [stats, setStats] = useState<BookReviewStats | null>(null);
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [myReview, setMyReview] = useState<BookReview | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchAll = useCallback(
    async (targetPage: number = 0) => {
      setIsLoading(true);

      try {
        const [statsData, reviewsData] = await Promise.all([
          getBookReviewStats(bookId).catch(() => null),
          getBookReviews(bookId, targetPage, 5).catch(() => ({
            items: [],
            totalElements: 0,
            totalPages: 1,
            page: 0,
            size: 5,
          })),
        ]);

        setStats(statsData ?? null);
        setReviews(reviewsData.items ?? []);
        setTotalPages(reviewsData.totalPages ?? 1);
        setPage(reviewsData.page ?? targetPage);

        if (isAuthenticated && accessToken) {
          try {
            const my = await getMyReview(bookId, accessToken);
            setMyReview(my ?? null);
          } catch {
            setMyReview(null);
          }
        } else {
          setMyReview(null);
        }
      } catch {
        // Silently fail — show empty state
      } finally {
        setIsLoading(false);
      }
    },
    [bookId, isAuthenticated, accessToken],
  );

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      void fetchAll(0);
    }, 0);

    return () => window.clearTimeout(initialLoadTimer);
  }, [fetchAll]);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    fetchAll(newPage);
  }

  function handleReviewSubmitted() {
    setIsEditing(false);
    fetchAll(0);
  }

  function handleEditReview() {
    setIsEditing(true);
  }

  async function handleDeleteReview() {
    if (!window.confirm(text.deleteConfirm)) return;

    try {
      await deleteReview(bookId, accessToken);
      setMyReview(null);
      setIsEditing(false);
      fetchAll(0);
    } catch {
      window.alert(text.deleteError);
    }
  }

  return (
    <motion.div
      className="mt-10 border-t border-[#E1E6F0] pt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {/* Section title */}
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-black text-[#111827]">{text.sectionTitle}</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-[#E1E6F0] to-transparent" />
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-4">
          <Skeleton variant="rectangular" className="h-36 w-full rounded-2xl" />
          <Skeleton variant="rectangular" className="h-24 w-full rounded-xl" />
          <Skeleton variant="rectangular" className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Stats */}
          {stats && stats.totalReviews > 0 && <ReviewStats stats={stats} />}

          {/* Review Form */}
          {isAuthenticated && (!myReview || isEditing) && (
            <ReviewForm
              bookId={bookId}
              existingReview={isEditing ? myReview : undefined}
              onSubmitted={handleReviewSubmitted}
              onCancelled={isEditing ? () => setIsEditing(false) : undefined}
            />
          )}

          {/* Login prompt */}
          {!isAuthenticated && (
            <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-5 py-4 text-center">
              <p className="text-sm text-[#6B7280]">
                {text.loginPrompt}{" "}
                <a
                  href="/login"
                  className="font-bold text-[#E60028] transition-colors hover:text-[#111827]"
                >
                  {text.loginLink}
                </a>
              </p>
            </div>
          )}

          {/* Review list */}
          <ReviewList
            bookId={bookId}
            reviews={reviews}
            currentUserId={currentUser?.id}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
          />
        </div>
      )}
    </motion.div>
  );
}
