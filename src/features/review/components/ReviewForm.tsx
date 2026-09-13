"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { ApiError } from "@/types/api.type";
import { BookReview } from "../types/review.type";
import { createReview, updateReview } from "../services/reviewService";
import { StarRating } from "./StarRating";

const copy = {
  en: {
    writeReview: "Write a Review",
    editReview: "Edit Your Review",
    ratingLabel: "Your rating",
    contentLabel: "Your review (optional)",
    contentPlaceholder: "Share your thoughts about this book...",
    submit: "Submit Review",
    update: "Update Review",
    cancel: "Cancel",
    submitting: "Submitting...",
    ratingRequired: "Please select a star rating.",
    successCreate: "Your review has been submitted!",
    successUpdate: "Your review has been updated!",
    errorGeneric: "Something went wrong. Please try again.",
  },
  vi: {
    writeReview: "Viết đánh giá",
    editReview: "Sửa đánh giá",
    ratingLabel: "Đánh giá của bạn",
    contentLabel: "Nhận xét (không bắt buộc)",
    contentPlaceholder: "Chia sẻ cảm nhận của bạn về cuốn sách...",
    submit: "Gửi đánh giá",
    update: "Cập nhật đánh giá",
    cancel: "Huỷ",
    submitting: "Đang gửi...",
    ratingRequired: "Vui lòng chọn số sao đánh giá.",
    successCreate: "Đánh giá của bạn đã được gửi!",
    successUpdate: "Đánh giá của bạn đã được cập nhật!",
    errorGeneric: "Đã xảy ra lỗi. Vui lòng thử lại.",
  },
};

type ReviewFormProps = {
  bookId: string;
  existingReview?: BookReview | null;
  onSubmitted: () => void;
  onCancelled?: () => void;
};

export function ReviewForm({ bookId, existingReview, onSubmitted, onCancelled }: ReviewFormProps) {
  const { accessToken } = useAuth();
  const { locale } = useLanguage();
  const text = copy[locale];

  const isEditMode = Boolean(existingReview);
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [content, setContent] = useState(existingReview?.content ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (rating === 0) {
      setError(text.ratingRequired);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = { rating, content: content.trim() || undefined };

      if (isEditMode) {
        await updateReview(bookId, payload, accessToken);
        setSuccess(text.successUpdate);
      } else {
        await createReview(bookId, payload, accessToken);
        setSuccess(text.successCreate);
      }

      // Allow user to see the success message briefly
      window.setTimeout(() => {
        onSubmitted();
      }, 600);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : text.errorGeneric);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#E1E6F0] bg-white p-6">
      <h4 className="text-base font-black text-[#111827]">
        {isEditMode ? text.editReview : text.writeReview}
      </h4>

      {/* Star rating picker */}
      <div className="mt-4">
        <label className="mb-2 block text-sm font-bold text-[#374151]">{text.ratingLabel}</label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      {/* Content textarea */}
      <div className="mt-4">
        <TextArea
          label={text.contentLabel}
          placeholder={text.contentPlaceholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          showCharCount
          resize="vertical"
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-3 text-sm font-semibold text-red-600 animate-fade-up">{error}</p>
      )}

      {/* Success message */}
      {success && (
        <p className="mt-3 text-sm font-semibold text-emerald-600 animate-fade-up">{success}</p>
      )}

      {/* Actions */}
      <div className="mt-5 flex items-center gap-3">
        <Button
          variant="primary"
          size="md"
          loading={isSubmitting}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? text.submitting : isEditMode ? text.update : text.submit}
        </Button>

        {onCancelled && (
          <Button variant="ghost" size="md" onClick={onCancelled} disabled={isSubmitting}>
            {text.cancel}
          </Button>
        )}
      </div>
    </div>
  );
}
