"use client";

import { ApiError, ApiResponse } from "@/types/api.type";
import {
  ConfirmPaymentRequest,
  CreatePaymentRequest,
  PaymentOrder,
} from "../types/payment.type";

const REQUEST_TIMEOUT_MS = 30000;
type AccessTokenRefresher = () => Promise<string | null>;

/**
 * Base URL of the payment service (separate microservice/backend from the
 * main library API). Falls back to localhost:8081 in development.
 */
export const PAYMENT_API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL ?? "http://localhost:8081";

async function paymentFetch<T>(path: string, init?: RequestInit, accessToken?: string | null): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = new Headers(init?.headers);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    const response = await fetch(`${PAYMENT_API_URL}${path}`, {
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
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function paymentFetchWithRetry<T>(
  path: string,
  init: RequestInit | undefined,
  accessToken?: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<T> {
  try {
    return await paymentFetch<T>(path, init, accessToken);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403) && refreshAccessToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return paymentFetch<T>(path, init, refreshed);
    }
    throw error;
  }
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/** Tạo phiên thanh toán mới (ví dụ: gia hạn ebook, phí mượn ebook, tiền phạt) */
export function createPaymentOrder(
  payload: CreatePaymentRequest,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<PaymentOrder> {
  return paymentFetchWithRetry<PaymentOrder>(
    "/api/payments",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    accessToken,
    refreshAccessToken,
  );
}

/** Lấy thông tin 1 phiên thanh toán */
export function getPaymentOrder(
  paymentId: string,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<PaymentOrder> {
  return paymentFetchWithRetry<PaymentOrder>(
    `/api/payments/${paymentId}`,
    { method: "GET" },
    accessToken,
    refreshAccessToken,
  );
}

/** Xác nhận và xử lý thanh toán */
export function confirmPaymentOrder(
  paymentId: string,
  payload: ConfirmPaymentRequest,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<PaymentOrder> {
  return paymentFetchWithRetry<PaymentOrder>(
    `/api/payments/${paymentId}/confirm`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    accessToken,
    refreshAccessToken,
  );
}

/** Hủy phiên thanh toán đang chờ */
export function cancelPaymentOrder(
  paymentId: string,
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<PaymentOrder> {
  return paymentFetchWithRetry<PaymentOrder>(
    `/api/payments/${paymentId}/cancel`,
    { method: "POST" },
    accessToken,
    refreshAccessToken,
  );
}

/** Lấy lịch sử thanh toán của người dùng hiện tại */
export function listPaymentOrders(
  accessToken: string | null,
  refreshAccessToken?: AccessTokenRefresher,
): Promise<PaymentOrder[]> {
  return paymentFetchWithRetry<PaymentOrder[]>(
    "/api/payments",
    { method: "GET" },
    accessToken,
    refreshAccessToken,
  );
}
