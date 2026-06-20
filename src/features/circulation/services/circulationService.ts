"use client";

import { ApiError, ApiResponse } from "@/types/api.type";
import { API_URL } from "@/features/auth/services/authService";
import {
  BookImportJob,
  BorrowRecord,
  CheckinResponse,
  CheckoutPreviewResponse,
  CheckoutRequest,
  CheckoutResponse,
  FineRecord,
  HoldRecord,
  RenewBorrowResponse,
  StaffDashboardSummary,
  StaffHoldRecord,
  StaffHoldSearchParams,
  StaffLoanRecord,
  StaffLoanSearchParams,
  StaffMemberDetail,
  StaffMemberLoansParams,
  StaffMemberSearchParams,
  StaffMemberSummary,
  StaffPageResult,
  BorrowStatDay,           
  BorrowStatisticsResult,
} from "../types/circulation.type";

const REQUEST_TIMEOUT_MS = 30000;
type AccessTokenRefresher = () => Promise<string | null>;

async function apiFetch<T>(path: string, init?: RequestInit, accessToken?: string | null) {
  const body = await apiFetchEnvelope<T>(path, init, accessToken);

  if (isApiResponse<T>(body)) {
    return body.data as T;
  }

  return body as T;
}

async function apiFetchEnvelope<T>(path: string, init?: RequestInit, accessToken?: string | null) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = new Headers(init?.headers);

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
      signal: controller.signal,
    });
    const responseText = await response.text();
    const body = responseText ? (tryParseJson(responseText) as ApiResponse<T> | T | null) : null;

    if (!body) {
      if (response.ok) return undefined as T;
      throw new ApiError(responseText || `Request failed with status ${response.status}.`, response.status);
    }

    if (isApiResponse<T>(body)) {
      if (!response.ok || !body.success) {
        throw new ApiError(body.message || "Request failed.", response.status, body.code, body.traceId);
      }

      return body;
    }

    if (!response.ok) {
      throw new ApiError("Request failed.", response.status);
    }

    return body as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", 408, "REQUEST_TIMEOUT");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function apiFetchPageWithAuthRetry<T>(
  path: string,
  accessToken?: string | null,
  refreshAccessToken?: AccessTokenRefresher,
) {
  try {
    return await apiFetchPage<T>(path, accessToken);
  } catch (error) {
    if (!shouldRefreshAndRetry(error) || !refreshAccessToken) {
      throw error;
    }

    const refreshedToken = await refreshAccessToken();

    if (!refreshedToken) {
      throw error;
    }

    return apiFetchPage<T>(path, refreshedToken);
  }
}

async function apiFetchPage<T>(path: string, accessToken?: string | null): Promise<StaffPageResult<T>> {
  const body = await apiFetchEnvelope<unknown>(path, undefined, accessToken);

  if (isApiResponse<unknown>(body)) {
    return {
      ...asPageResult<T>(body.data),
      ...asPageMeta(body.meta),
    };
  }

  return asPageResult<T>(body);
}

function asPageResult<T>(payload: unknown): StaffPageResult<T> {
  if (Array.isArray(payload)) {
    return { items: payload as T[] };
  }

  if (!payload || typeof payload !== "object") {
    return { items: [] };
  }

  const source = payload as {
    content?: T[];
    items?: T[];
    data?: T[];
    totalElements?: number;
    totalPages?: number;
    number?: number;
    page?: number;
    size?: number;
  };

  return {
    items: source.content ?? source.items ?? source.data ?? [],
    totalElements: source.totalElements,
    totalPages: source.totalPages,
    page: source.number ?? source.page,
    size: source.size,
  };
}

function asPageMeta(meta: unknown): Omit<StaffPageResult<never>, "items"> {
  if (!meta || typeof meta !== "object") {
    return {};
  }

  const source = meta as {
    page?: number;
    number?: number;
    size?: number;
    total?: number;
    totalItems?: number;
    totalRecords?: number;
    totalElements?: number;
    totalPages?: number;
    pages?: number;
    pagination?: {
      page?: number;
      number?: number;
      size?: number;
      total?: number;
      totalItems?: number;
      totalRecords?: number;
      totalElements?: number;
      totalPages?: number;
      pages?: number;
    };
  };
  const pagination = source.pagination ?? source;

  return {
    page: pagination.number ?? pagination.page,
    size: pagination.size,
    totalElements: pagination.totalElements ?? pagination.totalRecords ?? pagination.totalItems ?? pagination.total,
    totalPages: pagination.totalPages ?? pagination.pages,
  };
}

function toQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

async function apiFetchWithAuthRetry<T>(
  path: string,
  init: RequestInit | undefined,
  accessToken?: string | null,
  refreshAccessToken?: AccessTokenRefresher,
) {
  try {
    return await apiFetch<T>(path, init, accessToken);
  } catch (error) {
    if (!shouldRefreshAndRetry(error) || !refreshAccessToken) {
      throw error;
    }

    const refreshedToken = await refreshAccessToken();

    if (!refreshedToken) {
      throw error;
    }

    return apiFetch<T>(path, init, refreshedToken);
  }
}

async function apiFetchWithIdempotency<T>(
  path: string,
  init: RequestInit,
  accessToken?: string | null,
  refreshAccessToken?: AccessTokenRefresher,
) {
  const idempotencyKey = createIdempotencyKey();
  const request = withIdempotencyKey(init, idempotencyKey);

  try {
    return await apiFetch<T>(path, request, accessToken);
  } catch (error) {
    if (shouldRefreshAndRetry(error) && refreshAccessToken) {
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        return apiFetch<T>(path, request, refreshedToken);
      }
    }

    if (!shouldRetryIdempotentRequest(error)) {
      throw error;
    }

    await wait(1200);
    return apiFetch<T>(path, request, accessToken);
  }
}

function shouldRefreshAndRetry(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function withIdempotencyKey(init: RequestInit, idempotencyKey: string): RequestInit {
  const headers = new Headers(init.headers);
  headers.set("Idempotency-Key", idempotencyKey);

  return {
    ...init,
    headers,
  };
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function shouldRetryIdempotentRequest(error: unknown) {
  if (error instanceof ApiError) {
    return error.code === "REQUEST_TIMEOUT" || error.code === "REQUEST_ALREADY_PROCESSING" || error.status === 408;
  }

  return error instanceof TypeError;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isApiResponse<T>(body: ApiResponse<T> | T): body is ApiResponse<T> {
  return typeof body === "object" && body !== null && "success" in body && "timestamp" in body;
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function getMyBorrows(params: { page?: number; size?: number } = {}, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  const { page = 0, size = 20 } = params;
  return apiFetchWithAuthRetry<BorrowRecord[]>(`/api/borrows/my?page=${page}&size=${size}`, undefined, accessToken, refreshAccessToken);
}

export function getMyBorrowHistory(params: { page?: number; size?: number } = {}, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  const { page = 0, size = 20 } = params;
  return apiFetchWithAuthRetry<BorrowRecord[]>(`/api/borrows/my/history?page=${page}&size=${size}`, undefined, accessToken, refreshAccessToken);
}

export function renewMyBorrow(borrowId: string, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  return apiFetchWithIdempotency<RenewBorrowResponse>(`/api/borrows/${borrowId}/extend`, { method: "PUT" }, accessToken, refreshAccessToken);
}

export function staffRenewBorrow(borrowId: string, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  return apiFetchWithIdempotency<RenewBorrowResponse>(`/api/staff/borrows/${borrowId}/extend`, { method: "PUT" }, accessToken, refreshAccessToken);
}

export function getMyHolds(accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  return apiFetchWithAuthRetry<HoldRecord[]>("/api/holds/my", undefined, accessToken, refreshAccessToken);
}

export function createHold(bookId: string, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  return apiFetchWithAuthRetry<HoldRecord>(
    "/api/holds",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: Number(bookId) }),
    },
    accessToken,
    refreshAccessToken,
  );
}

export function cancelHold(holdId: string, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  return apiFetchWithAuthRetry<string>(`/api/holds/${holdId}`, { method: "DELETE" }, accessToken, refreshAccessToken);
}

export function checkoutHold(holdId: string, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  return apiFetchWithIdempotency<CheckoutResponse>(`/api/staff/holds/${holdId}/checkout`, { method: "POST" }, accessToken, refreshAccessToken);
}

export function getMyFines(params: { page?: number; size?: number } = {}, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  const { page = 0, size = 20 } = params;
  return apiFetchWithAuthRetry<FineRecord[]>(`/api/fines/my?page=${page}&size=${size}`, undefined, accessToken, refreshAccessToken);
}

export function previewCheckout(payload: CheckoutRequest, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  return apiFetchWithAuthRetry<CheckoutPreviewResponse>(
    "/api/staff/circulation/checkouts/preview",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
    refreshAccessToken,
  );
}

export function confirmCheckout(payload: CheckoutRequest, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  return apiFetchWithIdempotency<CheckoutResponse>(
    "/api/staff/circulation/checkouts",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
    refreshAccessToken,
  );
}

export function checkinCopy(barcode: string, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  return apiFetchWithIdempotency<CheckinResponse>(
    "/api/staff/circulation/checkins",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode }),
    },
    accessToken,
    refreshAccessToken,
  );
}

export function getImportJob(jobId: string, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  return apiFetchWithAuthRetry<BookImportJob>(`/api/books/import-csv/${jobId}`, undefined, accessToken, refreshAccessToken);
}

export function searchStaffLoans(
  params: StaffLoanSearchParams,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
) {
  return apiFetchPageWithAuthRetry<StaffLoanRecord>(`/api/staff/loans${toQuery(params)}`, accessToken, refreshAccessToken);
}

export function searchStaffMembers(
  params: StaffMemberSearchParams,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
) {
  return apiFetchPageWithAuthRetry<StaffMemberSummary>(`/api/staff/members${toQuery(params)}`, accessToken, refreshAccessToken);
}

export function getStaffMember(memberId: string, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  return apiFetchWithAuthRetry<StaffMemberDetail>(`/api/staff/members/${memberId}`, undefined, accessToken, refreshAccessToken);
}

export function getStaffMemberLoans(
  memberId: string,
  params: StaffMemberLoansParams,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
) {
  return apiFetchPageWithAuthRetry<StaffLoanRecord>(`/api/staff/members/${memberId}/loans${toQuery(params)}`, accessToken, refreshAccessToken);
}

export function searchStaffHolds(
  params: StaffHoldSearchParams,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
) {
  return apiFetchPageWithAuthRetry<StaffHoldRecord>(`/api/staff/holds${toQuery(params)}`, accessToken, refreshAccessToken);
}

export function getStaffDashboardSummary(accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  return apiFetchWithAuthRetry<StaffDashboardSummary>("/api/staff/dashboard/summary", undefined, accessToken, refreshAccessToken);
}

export function getStaffBorrowStatistics(
  params: URLSearchParams,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
) {
  return apiFetchWithAuthRetry<BorrowStatisticsResult>(
    `/api/staff/statistics/borrows?${params.toString()}`,
    undefined,
    accessToken,
    refreshAccessToken,
  );
}