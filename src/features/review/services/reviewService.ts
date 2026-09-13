"use client";

import { catalogFetch as reviewFetch } from "@/features/catalog/services/catalogService";
import { BookReview, BookReviewStats, CreateReviewPayload, UpdateReviewPayload } from "../types/review.type";

export async function getBookReviews(bookId: string, page: number = 0, size: number = 5) {
  const query = `?page=${page}&size=${size}`;
  const raw = await reviewFetch<unknown>(`/api/books/${bookId}/reviews${query}`);

  if (Array.isArray(raw)) {
    return { items: raw as BookReview[], totalElements: raw.length, totalPages: 1, page: 0, size };
  }

  if (raw && typeof raw === "object") {
    const source = raw as {
      content?: BookReview[];
      items?: BookReview[];
      data?: BookReview[];
      totalElements?: number;
      totalPages?: number;
      number?: number;
      page?: number;
      size?: number;
    };

    return {
      items: source.content ?? source.items ?? source.data ?? [],
      totalElements: source.totalElements ?? 0,
      totalPages: source.totalPages ?? 1,
      page: source.number ?? source.page ?? 0,
      size: source.size ?? size,
    };
  }

  return { items: [], totalElements: 0, totalPages: 1, page: 0, size };
}

export function getBookReviewStats(bookId: string) {
  return reviewFetch<BookReviewStats>(`/api/books/${bookId}/reviews/stats`);
}

export function getMyReview(bookId: string, accessToken: string | null) {
  return reviewFetch<BookReview | null>(`/api/books/${bookId}/reviews/my`, undefined, accessToken);
}

export function createReview(bookId: string, payload: CreateReviewPayload, accessToken: string | null) {
  return reviewFetch<BookReview>(
    `/api/books/${bookId}/reviews`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function updateReview(bookId: string, payload: UpdateReviewPayload, accessToken: string | null) {
  return reviewFetch<BookReview>(
    `/api/books/${bookId}/reviews/my`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function deleteReview(bookId: string, accessToken: string | null) {
  return reviewFetch<void>(
    `/api/books/${bookId}/reviews/my`,
    { method: "DELETE" },
    accessToken,
  );
}
