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

function isApiResponse<T>(body: unknown): body is ApiResponse<T> {
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

export function getMyBorrowHistory(params: { page?: number; size?: number } | null = {}, accessToken: string | null, refreshAccessToken?: AccessTokenRefresher) {
  const { page = 0, size = 20 } = params || {};
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

export type BookImportEventName =
  | "book-import-snapshot"
  | "book-import-processing"
  | "book-import-progress"
  | "book-import-completed"
  | "book-import-failed"
  | string;

export type BookImportEventHandlers = {
  onEvent: (eventName: BookImportEventName, job: BookImportJob) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

export function subscribeImportJobEvents(
  jobId: string,
  accessToken: string | null,
  refreshAccessToken: AccessTokenRefresher | undefined,
  handlers: BookImportEventHandlers,
) {
  const controller = new AbortController();
  let isActive = true;

  void connectImportJobEvents(jobId, accessToken, refreshAccessToken, handlers, controller, () => isActive);

  return () => {
    isActive = false;
    controller.abort();
  };
}

async function connectImportJobEvents(
  jobId: string,
  accessToken: string | null,
  refreshAccessToken: AccessTokenRefresher | undefined,
  handlers: BookImportEventHandlers,
  controller: AbortController,
  isActive: () => boolean,
) {
  try {
    const response = await openImportJobEventStream(jobId, accessToken, controller.signal);

    if (shouldRefreshAndRetryResponse(response) && refreshAccessToken) {
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken && isActive()) {
        await readImportJobEventStream(await openImportJobEventStream(jobId, refreshedToken, controller.signal), handlers, isActive);
        return;
      }
    }

    await readImportJobEventStream(response, handlers, isActive);
  } catch (error) {
    if (!isActive() || controller.signal.aborted) return;
    handlers.onError?.(error instanceof Error ? error : new Error("Could not read import job events."));
  }
}

function openImportJobEventStream(jobId: string, accessToken: string | null, signal: AbortSignal) {
  const headers = new Headers({ Accept: "text/event-stream" });

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${API_URL}/api/books/import-csv/${encodeURIComponent(jobId)}/events`, {
    method: "GET",
    headers,
    credentials: "include",
    signal,
  });
}

function shouldRefreshAndRetryResponse(response: Response) {
  return response.status === 401 || response.status === 403;
}

async function readImportJobEventStream(
  response: Response,
  handlers: BookImportEventHandlers,
  isActive: () => boolean,
) {
  if (!response.ok) {
    throw new ApiError(await getResponseErrorMessage(response), response.status);
  }

  if (!response.body) {
    throw new ApiError("Import event stream is not available.", response.status);
  }

  handlers.onOpen?.();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (isActive()) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = processImportEventBuffer(buffer, handlers);
    }

    buffer += decoder.decode();
    processImportEventBuffer(`${buffer}\n\n`, handlers);
    handlers.onClose?.();
  } finally {
    reader.releaseLock();
  }
}

function processImportEventBuffer(buffer: string, handlers: BookImportEventHandlers) {
  const normalizedBuffer = buffer.replace(/\r\n/g, "\n");
  const chunks = normalizedBuffer.split("\n\n");
  const remaining = chunks.pop() ?? "";

  chunks.forEach((chunk) => {
    const parsedEvent = parseImportEventChunk(chunk);

    if (!parsedEvent.data) return;

    const job = parseImportEventPayload(parsedEvent.data);

    if (job) {
      handlers.onEvent(parsedEvent.eventName, job);
    }
  });

  return remaining;
}

function parseImportEventChunk(chunk: string) {
  let eventName: BookImportEventName = "message";
  const dataLines: string[] = [];

  chunk.split("\n").forEach((line) => {
    if (!line || line.startsWith(":")) return;

    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
      return;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  });

  return {
    eventName,
    data: dataLines.join("\n"),
  };
}

function parseImportEventPayload(data: string) {
  if (!data || data === "[DONE]") return null;

  const parsed = tryParseJson(data) as ApiResponse<BookImportJob> | BookImportJob | { data?: BookImportJob } | null;

  if (!parsed) return null;

  if (isApiResponse<BookImportJob>(parsed) || isDataEnvelope(parsed)) {
    return parsed.data ?? null;
  }

  return parsed;
}

function isDataEnvelope(payload: unknown): payload is { data?: BookImportJob } {
  return typeof payload === "object" && payload !== null && "data" in payload;
}

async function getResponseErrorMessage(response: Response) {
  const responseText = await response.text().catch(() => "");
  const body = responseText ? (tryParseJson(responseText) as ApiResponse<unknown> | null) : null;

  return body?.message || responseText || `Request failed with status ${response.status}.`;
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
