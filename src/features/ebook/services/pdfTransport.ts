type ContentDelivery = {
  signedUrl: string;
  requiresAuthorization?: boolean;
};

export class PdfTransportError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "PdfTransportError";
    this.status = status;
    this.code = code;
  }
}

/** Credentials are only sent to a locally constructed API route, never a response-provided URL. */
export async function fetchReaderPdf(
  content: ContentDelivery,
  bookId: number,
  sessionToken: string,
  accessToken: string | null,
  apiUrl: string,
  refreshAccessToken?: () => Promise<string | null>,
  fetcher: typeof fetch = fetch,
): Promise<ArrayBuffer> {
  const protectedPath = `/api/ebooks/${bookId}/reader/file`;
  const authenticated = content.requiresAuthorization === true;
  if (authenticated && content.signedUrl !== protectedPath) {
    throw new PdfTransportError("Invalid protected PDF delivery path.", 502);
  }
  let target: string;
  if (authenticated) {
    target = `${apiUrl.replace(/\/$/, "")}${protectedPath}`;
  } else {
    // Compatibility for legacy Cloudinary rows only. Do not fetch private/intranet
    // storage origins from the browser when connected to an older backend.
    const legacy = new URL(content.signedUrl);
    if (legacy.protocol !== "https:" || legacy.hostname !== "res.cloudinary.com" || legacy.username || legacy.password) {
      throw new PdfTransportError("Private PDF delivery is not available yet. Please try again later.", 502);
    }
    target = legacy.toString();
  }

  const request = async (token: string | null): Promise<ArrayBuffer> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const headers = new Headers();
      if (authenticated) {
        if (token) headers.set("Authorization", `Bearer ${token}`);
        headers.set("X-Reading-Session", sessionToken);
      }
      const response = await fetcher(target, {
        method: "GET",
        headers,
        credentials: authenticated ? "include" : "omit",
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      });
      if (!response.ok) {
        let code: string | undefined;
        if (response.headers.get("content-type")?.includes("application/json")) {
          const body: unknown = await response.json().catch(() => null);
          if (body && typeof body === "object" && "code" in body && typeof body.code === "string") code = body.code;
        }
        throw new PdfTransportError(`Could not load PDF content. Status ${response.status}.`, response.status, code);
      }
      const bytes = await response.arrayBuffer();
      const prefix = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 5));
      if (String.fromCodePoint(...prefix) !== "%PDF-") {
        throw new PdfTransportError("The server did not return a valid PDF file.", 502);
      }
      return bytes;
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    return await request(accessToken);
  } catch (error) {
    if (authenticated && error instanceof PdfTransportError && error.status === 401 && refreshAccessToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return request(refreshed);
    }
    throw error;
  }
}
