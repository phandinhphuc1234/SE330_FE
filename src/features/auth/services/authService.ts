import { ApiError, ApiResponse } from "@/types/api.type";
import {
  AuthResponse,
  LoginRequest,
  MyProfile,
  RegisterRequest,
  ResendVerificationRequest,
  UpdateMyProfileRequest,
  VerifyEmailCodeRequest,
} from "../types/auth.type";
// Định nghĩa URL cơ sở cho API, sử dụng biến môi trường nếu có, hoặc mặc định là localhost
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const AUTH_REQUEST_TIMEOUT_MS = 8000;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Authentication request timed out. Please try again.", 408, "REQUEST_TIMEOUT");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!body) {
    throw new ApiError("Server returned an invalid response.", response.status);
  }

  if (!response.ok || !body.success) {
    throw new ApiError(
      body.message || "Request failed.",
      response.status,
      body.code,
      body.traceId,
    );
  }

  return body;
}

export async function registerAccount(payload: RegisterRequest) {
  const response = await fetchWithTimeout(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseResponse<string>(response);
}

export async function login(payload: LoginRequest) {
  const response = await fetchWithTimeout(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseResponse<AuthResponse>(response);
}

export async function refreshToken() {
  const response = await fetchWithTimeout(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  return parseResponse<AuthResponse>(response);
}

export async function getMyProfile(accessToken: string) {
  const response = await fetchWithTimeout(`${API_URL}/api/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  return parseResponse<MyProfile>(response);
}

export async function updateMyProfile(payload: UpdateMyProfileRequest, accessToken: string) {
  const response = await fetchWithTimeout(`${API_URL}/api/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseResponse<MyProfile>(response);
}

export async function logout(accessToken: string) {
  const response = await fetchWithTimeout(`${API_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  return parseResponse<string>(response);
}

export async function verifyEmail(token: string) {
  const response = await fetchWithTimeout(`${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: "GET",
    credentials: "include",
  });

  return parseResponse<string>(response);
}

export async function verifyEmailCode(payload: VerifyEmailCodeRequest) {
  const response = await fetchWithTimeout(`${API_URL}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseResponse<string>(response);
}

export async function resendVerification(payload: ResendVerificationRequest) {
  const response = await fetchWithTimeout(`${API_URL}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseResponse<string>(response);
}
