"use client";

import { ApiError, ApiResponse } from "@/types/api.type";
import { API_URL } from "@/features/auth/services/authService";
import {
  Author,
  AuthorSearchParams,
  Book,
  BookCoverImage,
  BookEbook,
  BookEbookInfo,
  BookCopy,
  BookCopySearchParams,
  BookPayload,
  BookSearchParams,
  BulkCopyPayload,
  Category,
  CopyPayload,
  ImportCsvResult,
  PageResult,
  UpdateBookEbookPayload,
  UpdateBookPayload,
} from "../types/catalog.type";

const REQUEST_TIMEOUT_MS = 300000;
const DEFAULT_AUTHOR_PAGE = "0";
const DEFAULT_AUTHOR_PAGE_SIZE = "6";

async function catalogFetch<T>(path: string, init?: RequestInit, accessToken?: string | null) {
  const body = await catalogFetchResponse<T>(path, init, accessToken);

  if (isApiResponse<T>(body)) {
    return body.data as T;
  }

  return body as T;
}

async function catalogFetchResponse<T>(path: string, init?: RequestInit, accessToken?: string | null) {
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
      if (response.ok) {
        return undefined as T;
      }

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

export function asPageResult<T>(payload: unknown): PageResult<T> {
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

function asPageMeta(meta: unknown): Omit<PageResult<never>, "items"> {
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

export function getEntityId(entity: { id?: number; bookId?: number; authorId?: number; categoryId?: number | null; copyId?: number }) {
  return entity.id ?? entity.bookId ?? entity.authorId ?? entity.categoryId ?? entity.copyId;
}

export async function getBooks(params: BookSearchParams = {}) {
  const body = await catalogFetchResponse<unknown>(`/api/books${toQuery(params)}`);

  if (isApiResponse<unknown>(body)) {
    const result = asPageResult<Book>(body.data);
    const meta = asPageMeta(body.meta);

    return {
      ...result,
      page: result.page ?? meta.page,
      size: result.size ?? meta.size,
      totalElements: result.totalElements ?? meta.totalElements,
      totalPages: result.totalPages ?? meta.totalPages,
    };
  }

  return asPageResult<Book>(body);
}

export function getBook(bookId: string) {
  return catalogFetch<Book>(`/api/books/${bookId}`);
}

export function getBookEbookInfo(bookId: string) {
  return catalogFetch<BookEbookInfo>(`/api/books/${bookId}/ebook`);
}

export function getBookEbookManagementDetail(bookId: string, bookEbookId: string, accessToken: string | null) {
  return catalogFetch<BookEbook>(`/api/books/${bookId}/ebooks/${bookEbookId}`, undefined, accessToken);
}

export function updateBookEbookMetadata(
  bookId: string,
  bookEbookId: string,
  payload: UpdateBookEbookPayload,
  accessToken: string | null,
) {
  return catalogFetch<BookEbook>(
    `/api/books/${bookId}/ebooks/${bookEbookId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function createBook(payload: BookPayload, accessToken: string | null) {
  return catalogFetch<Book>(
    "/api/books",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function updateBook(bookId: string, payload: UpdateBookPayload, accessToken: string | null) {
  return catalogFetch<Book>(
    `/api/books/${bookId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function updateBookAuthors(bookId: string, authorIds: number[], accessToken: string | null) {
  return catalogFetch<Book>(
    `/api/books/${bookId}/authors`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorIds }),
    },
    accessToken,
  );
}

export function addBookCover(bookId: string, file: File, accessToken: string | null) {
  const formData = new FormData();
  formData.append("file", file);

  return catalogFetch<BookCoverImage>(
    `/api/books/${bookId}/cover`,
    {
      method: "POST",
      body: formData,
    },
    accessToken,
  );
}

export function updateBookCover(bookId: string, file: File, accessToken: string | null) {
  const formData = new FormData();
  formData.append("file", file);

  return catalogFetch<BookCoverImage>(
    `/api/books/${bookId}/cover`,
    {
      method: "PUT",
      body: formData,
    },
    accessToken,
  );
}

export function uploadBookEbook(bookId: string, file: File, accessToken: string | null) {
  const formData = new FormData();
  formData.append("file", file);

  return catalogFetch<BookEbook>(
    `/api/books/${bookId}/ebooks`,
    {
      method: "POST",
      body: formData,
    },
    accessToken,
  );
}

export function deleteBook(bookId: string, accessToken: string | null) {
  return catalogFetch<string>(`/api/books/${bookId}`, { method: "DELETE" }, accessToken);
}

export function getBookCopies(bookId: string, accessToken: string | null, params: BookCopySearchParams = {}) {
  return catalogFetch<BookCopy[]>(`/api/books/${bookId}/copies${toQuery(params)}`, undefined, accessToken);
}

export function createBookCopy(bookId: string, payload: CopyPayload, accessToken: string | null) {
  return catalogFetch<BookCopy>(
    `/api/books/${bookId}/copies`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function createBookCopiesBulk(bookId: string, payload: BulkCopyPayload, accessToken: string | null) {
  return catalogFetch<BookCopy[]>(
    `/api/books/${bookId}/copies/bulk`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function updateBookCopy(copyId: string, payload: Pick<CopyPayload, "condition" | "location">, accessToken: string | null) {
  return catalogFetch<BookCopy>(
    `/api/book-copies/${copyId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function deleteBookCopy(copyId: string, accessToken: string | null) {
  return catalogFetch<string>(`/api/book-copies/${copyId}`, { method: "DELETE" }, accessToken);
}

export async function importBooksCsv(file: File, accessToken: string | null) {
  const formData = new FormData();
  const text = await file.text();
  const normalizedText = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const normalizedFile = new File([normalizedText], file.name, {
    type: file.type || "text/csv",
  });
  formData.append("file", normalizedFile);

  return catalogFetch<ImportCsvResult>(
    "/api/books/import-csv",
    {
      method: "POST",
      body: formData,
    },
    accessToken,
  );
}

export function getAuthors(params: AuthorSearchParams = {}) {
  return catalogFetch<Author[]>(`/api/authors${toQuery({ page: DEFAULT_AUTHOR_PAGE, size: DEFAULT_AUTHOR_PAGE_SIZE, ...params })}`);
}

export function createAuthor(payload: Pick<Author, "name" | "bio">, accessToken: string | null) {
  return catalogFetch<Author>(
    "/api/authors",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function updateAuthor(authorId: string, payload: Pick<Author, "name" | "bio">, accessToken: string | null) {
  return catalogFetch<Author>(
    `/api/authors/${authorId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function updateAuthorImage(authorId: string, file: File, accessToken: string | null) {
  const formData = new FormData();
  formData.append("file", file);

  return catalogFetch<Author>(
    `/api/authors/${authorId}/image`,
    {
      method: "PUT",
      body: formData,
    },
    accessToken,
  );
}

export function getCategories() {
  return catalogFetch<Category[]>("/api/categories");
}

export function createCategory(payload: Pick<Category, "name" | "description">, accessToken: string | null) {
  return catalogFetch<Category>(
    "/api/categories",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function updateCategory(categoryId: string, payload: Pick<Category, "name" | "description">, accessToken: string | null) {
  return catalogFetch<Category>(
    `/api/categories/${categoryId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}
