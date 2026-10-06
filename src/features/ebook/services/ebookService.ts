"use client";

import { ApiError, ApiResponse } from "@/types/api.type";
import { API_URL } from "@/features/auth/services/authService";
import {
  BorrowEbookRequest,
  EbookAnswerRequest,
  EbookAnswerResponse,
  EbookLoan,
  EbookPageParams,
  EbookReadingSessionCloseResponse,
  EbookReadingSessionRefreshResponse,
  EbookReadingSessionResponse,
  EbookSemanticSearchRequest,
  EbookSemanticSearchResponse,
  EbookSignedContentResponse,
} from "../types/ebook.type";

const REQUEST_TIMEOUT_MS = 30000;
const AI_ANSWER_TIMEOUT_MS = 45000;
type AccessTokenRefresher = () => Promise<string | null>;

// ─────────────────────────────────────────────
// Fetch helpers (mirror pattern of circulationService)
// ─────────────────────────────────────────────

async function ebookFetch<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string | null,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(init?.headers);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    const text = await response.text();
    const body = text ? tryParseJson(text) : null;

    if (!response.ok) {
      const apiBody = body as ApiResponse<unknown> | null;
      const message = apiBody?.message ?? `Request failed: ${response.status}`;
      const code = apiBody?.code;
      throw new ApiError(message, response.status, code);
    }

    const apiBody = body as ApiResponse<T> | null;
    return (apiBody?.data ?? body) as T;
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new Error("Request timed out.");
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function tryParseJson(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

async function ebookFetchWithRetry<T>(
  path: string,
  init: RequestInit | undefined,
  accessToken?: string | null,
  refreshAccessToken?: AccessTokenRefresher,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  try {
    return await ebookFetch<T>(path, init, accessToken, timeoutMs);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403) && refreshAccessToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return ebookFetch<T>(path, init, refreshed, timeoutMs);
    }
    throw error;
  }
}

export type EbookPageResult = {
  items: EbookLoan[];
  totalElements?: number;
  totalPages?: number;
  page?: number;
  size?: number;
};

async function ebookFetchPage(path: string, accessToken?: string | null): Promise<EbookPageResult> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = new Headers();
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    const response = await fetch(`${API_URL}${path}`, {
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    const text = await response.text();
    const body = text ? tryParseJson(text) : null;

    if (!response.ok) {
      const apiBody = body as ApiResponse<unknown> | null;
      throw new ApiError(apiBody?.message ?? `Request failed: ${response.status}`, response.status, apiBody?.code);
    }

    const apiBody = body as ApiResponse<unknown> | null;
    const data = apiBody?.data as { content?: EbookLoan[]; } | EbookLoan[] | null;
    const meta = apiBody?.meta as {
      page?: number; size?: number; totalElements?: number; totalPages?: number;
    } | null;

    const items = Array.isArray(data) ? data : (data as { content?: EbookLoan[] })?.content ?? [];

    return {
      items,
      totalElements: meta?.totalElements,
      totalPages: meta?.totalPages,
      page: meta?.page,
      size: meta?.size,
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/** Mượn ebook */
export function borrowEbook(
  bookId: number,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<EbookLoan> {
  const body: BorrowEbookRequest = {};

  return ebookFetchWithRetry<EbookLoan>(
    `/api/ebooks/${bookId}/loans`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    accessToken,
    refreshAccessToken,
  );
}

/** Trả sớm ebook */
export function returnEbook(
  loanId: number,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<EbookLoan> {
  return ebookFetchWithRetry<EbookLoan>(
    `/api/ebook-loans/${loanId}/return`,
    { method: "POST" },
    accessToken,
    refreshAccessToken,
  );
}

/** Gia hạn ebook */
export function renewEbook(
  loanId: number,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<EbookLoan> {
  return ebookFetchWithRetry<EbookLoan>(
    `/api/ebook-loans/${loanId}/renew`,
    { method: "POST" },
    accessToken,
    refreshAccessToken,
  );
}

/** Lấy danh sách ebook đang mượn hoặc lịch sử */
export async function getMyEbookLoans(
  params: EbookPageParams,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<EbookPageResult> {
  const { history = false, page = 0, size = 10 } = params;
  const path = `/api/ebook-loans/my?history=${history}&page=${page}&size=${size}`;
  try {
    return await ebookFetchPage(path, accessToken);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403) && refreshAccessToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return ebookFetchPage(path, refreshed);
    }
    throw error;
  }
}

export function createReadingSession(
  bookId: number,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<EbookReadingSessionResponse> {
  return ebookFetchWithRetry<EbookReadingSessionResponse>(
    `/api/ebooks/${bookId}/reading-sessions`,
    { method: "POST" },
    accessToken,
    refreshAccessToken,
  );
}

export function getSignedContent(
  bookId: number,
  sessionToken: string,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<EbookSignedContentResponse> {
  return ebookFetchWithRetry<EbookSignedContentResponse>(
    `/api/ebooks/${bookId}/reader/content`,
    {
      method: "GET",
      headers: {
        "X-Reading-Session": sessionToken,
      },
    },
    accessToken,
    refreshAccessToken,
  );
}

export function refreshReadingSession(
  sessionId: number,
  sessionToken: string,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<EbookReadingSessionRefreshResponse> {
  return ebookFetchWithRetry<EbookReadingSessionRefreshResponse>(
    `/api/ebooks/reading-sessions/${sessionId}/refresh`,
    {
      method: "POST",
      headers: {
        "X-Reading-Session": sessionToken,
      },
    },
    accessToken,
    refreshAccessToken,
  );
}

export function closeReadingSession(
  sessionId: number,
  sessionToken: string,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<EbookReadingSessionCloseResponse> {
  return ebookFetchWithRetry<EbookReadingSessionCloseResponse>(
    `/api/ebooks/reading-sessions/${sessionId}/close`,
    {
      method: "POST",
      headers: {
        "X-Reading-Session": sessionToken,
      },
    },
    accessToken,
    refreshAccessToken,
  );
}

export function semanticSearchEbook(
  bookId: number,
  sessionToken: string,
  request: EbookSemanticSearchRequest,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<EbookSemanticSearchResponse> {
  return ebookFetchWithRetry<EbookSemanticSearchResponse>(
    `/api/ebooks/${bookId}/reader/semantic-search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Reading-Session": sessionToken,
      },
      body: JSON.stringify(request),
    },
    accessToken,
    refreshAccessToken,
  );
}

export function askEbookQuestion(
  bookId: number,
  sessionToken: string,
  request: EbookAnswerRequest,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<EbookAnswerResponse> {
  return ebookFetchWithRetry<EbookAnswerResponse>(
    `/api/ebooks/${bookId}/reader/ask`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Reading-Session": sessionToken,
      },
      body: JSON.stringify(request),
    },
    accessToken,
    refreshAccessToken,
    AI_ANSWER_TIMEOUT_MS,
  );
}
