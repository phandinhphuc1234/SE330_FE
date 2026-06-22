"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/types/api.type";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogShell, Notice } from "@/features/catalog/components/CatalogShell";

import {
  closeReadingSession,
  createReadingSession,
  getSignedContent,
  refreshReadingSession,
} from "../services/ebookService";
import { StoredReaderSession } from "../types/ebook.type";

type ReaderStage =
  | "creating"
  | "loading-content"
  | "rendering"
  | "refreshing"
  | "expired"
  | "loan-expired"
  | "access-required"
  | "content-error"
  | "closing";

const HEARTBEAT_MS = 60_000;
const EXPIRY_SKEW_MS = 30_000;

export function EbookReaderPage() {
  const params = useParams<{ bookId: string }>();
  const router = useRouter();
  const { accessToken, isAuthenticated, isInitializing, refresh } = useAuth();
  const numericBookId = Number(params.bookId);
  const hasValidBookId = Number.isInteger(numericBookId) && numericBookId > 0;
  const bookHref = hasValidBookId ? `/books/${encodeURIComponent(String(numericBookId))}` : "/books";
  const storageKey = useMemo(() => readerStorageKey(numericBookId), [numericBookId]);
  const [session, setSession] = useState<StoredReaderSession | null>(null);
  const sessionRef = useRef<StoredReaderSession | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  const [stage, setStage] = useState<ReaderStage>("creating");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (readerContainerRef.current?.requestFullscreen) {
        void readerContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        void document.exitFullscreen();
      }
    }
  }, []);

  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  const setReaderSession = useCallback(
    (nextSession: StoredReaderSession | null) => {
      sessionRef.current = nextSession;
      setSession(nextSession);

      if (typeof window === "undefined") return;

      try {
        if (nextSession) {
          window.sessionStorage.setItem(storageKey, JSON.stringify(nextSession));
        } else {
          window.sessionStorage.removeItem(storageKey);
        }
      } catch {
        // Reading can continue without the reload recovery cache.
      }
    },
    [storageKey],
  );

  const clearPdfState = useCallback(() => {
    setPdfDoc(null);
    setTotalPages(0);
    setPage(1);
  }, []);

  const invalidateSession = useCallback(() => {
    setReaderSession(null);
    clearPdfState();
  }, [clearPdfState, setReaderSession]);

  const loadSignedPdf = useCallback(
    async (activeSession: StoredReaderSession) => {
      setStage("loading-content");
      const content = await getSignedContent(numericBookId, activeSession.sessionToken, accessToken, refreshAccessToken);
      const response = await fetch(content.signedUrl);

      if (!response.ok) {
        throw new ApiError(`Could not load PDF content. Status ${response.status}.`, response.status);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      // Dynamically import pdfjs-dist to avoid SSR DOMMatrix error
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const doc = await loadingTask.promise;

      clearPdfState();
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setStage("rendering");
      setError("");
    },
    [accessToken, clearPdfState, numericBookId, refreshAccessToken],
  );

  const openReader = useCallback(
    async (forceNewSession = false) => {
      if (!hasValidBookId) {
        setStage("content-error");
        setError("Invalid book id.");
        return;
      }

      if (!isAuthenticated && !accessToken) {
        setStage("access-required");
        setError("Please sign in to read this ebook.");
        return;
      }

      setError("");
      setStage("creating");

      try {
        let activeSession = !forceNewSession ? readStoredSession(storageKey, numericBookId) : null;

        if (!activeSession || isExpired(activeSession.sessionExpiresAt)) {
          const created = await createReadingSession(numericBookId, accessToken, refreshAccessToken);
          activeSession = {
            sessionId: created.sessionId,
            sessionToken: created.sessionToken,
            bookId: created.bookId,
            bookEbookId: created.bookEbookId,
            loanId: created.loanId,
            loanExpiresAt: created.loanExpiresAt,
            sessionExpiresAt: created.sessionExpiresAt,
          };
        }

        setReaderSession(activeSession);
        await loadSignedPdf(activeSession);
      } catch (readerError) {
        const shouldRecover = handleReaderError(readerError, invalidateSession, setStage, setError);
        if (shouldRecover) {
          setStage("expired");
          setError("Your reading session expired. Reopen the reader to continue.");
        }
      }
    },
    [accessToken, hasValidBookId, invalidateSession, isAuthenticated, loadSignedPdf, numericBookId, refreshAccessToken, setReaderSession, storageKey],
  );

  const refreshSession = useCallback(async () => {
    const activeSession = sessionRef.current;
    if (!activeSession) return;

    try {
      setStage((current) => (current === "rendering" ? "refreshing" : current));
      const refreshed = await refreshReadingSession(
        activeSession.sessionId,
        activeSession.sessionToken,
        accessToken,
        refreshAccessToken,
      );
      const nextSession = {
        ...activeSession,
        loanExpiresAt: refreshed.loanExpiresAt,
        sessionExpiresAt: refreshed.sessionExpiresAt,
      };

      setReaderSession(nextSession);
      setStage("rendering");
      setError("");
    } catch (refreshError) {
      const isExpiredError = handleReaderError(refreshError, invalidateSession, setStage, setError);
      if (isExpiredError) {
        // Auto-recover session if it expired
        void openReader(true);
      }
    }
  }, [accessToken, invalidateSession, refreshAccessToken, setReaderSession, openReader]);

  const closeReader = useCallback(async () => {
    const activeSession = sessionRef.current;
    setStage("closing");
    setError("");

    try {
      if (activeSession) {
        await closeReadingSession(activeSession.sessionId, activeSession.sessionToken, accessToken, refreshAccessToken);
      }
    } catch {
      // Backend TTL will clean abandoned sessions if close is interrupted.
    } finally {
      invalidateSession();
      router.push(bookHref);
    }
  }, [accessToken, bookHref, invalidateSession, refreshAccessToken, router]);

  useEffect(() => {
    if (isInitializing || hasStartedRef.current) return;
    hasStartedRef.current = true;
    void openReader(false);
  }, [isInitializing, openReader]);

  useEffect(() => {
    if (!session) return undefined;

    const heartbeatId = window.setInterval(() => {
      void refreshSession();
    }, HEARTBEAT_MS);

    return () => window.clearInterval(heartbeatId);
  }, [refreshSession, session]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      const activeSession = sessionRef.current;

      if (!activeSession) return;

      if (isExpired(activeSession.sessionExpiresAt)) {
        void refreshSession();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refreshSession]);

  const accessTokenRef = useRef(accessToken);
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    return () => {
      const activeSession = sessionRef.current;
      clearPdfState();

      if (activeSession) {
        void closeReadingSession(activeSession.sessionId, activeSession.sessionToken, accessTokenRef.current, undefined).catch(() => undefined);
      }
    };
  }, [clearPdfState]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    const activePdfDoc = pdfDoc;
    let renderTask: RenderTask | null = null;
    let isCancelled = false;

    async function renderPage() {
      try {
        const pdfPage = await activePdfDoc.getPage(page);
        if (isCancelled) return;

        const viewport = pdfPage.getViewport({ scale: zoom / 100 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Your browser could not initialize the PDF canvas.");
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTask = pdfPage.render({ canvas, canvasContext: context, viewport });
        await renderTask.promise;
      } catch (renderError) {
        if (isCancelled || isPdfRenderCancellation(renderError)) return;
        setStage("content-error");
        setError(renderError instanceof Error ? renderError.message : "This PDF page could not be rendered.");
      }
    }

    void renderPage();

    return () => {
      isCancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, page, zoom]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input (though there aren't any here typically, good practice)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft") {
        setPage((current) => Math.max(1, current - 1));
      } else if (e.key === "ArrowRight") {
        setPage((current) => (totalPages && current < totalPages ? current + 1 : current));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages]);

  const isBusy = stage === "creating" || stage === "loading-content" || stage === "refreshing" || stage === "closing";

  return (
    <CatalogShell
      protectedPage
      wide
      frameless
      eyebrow="Secure reader"
      title="Ebook reader"
      description="Your reading session is temporary and protected. Keep this tab open while reading."
      actions={<ReaderBackButton onClick={() => void closeReader()} disabled={stage === "closing"} />}
    >
      <section className="rounded-[28px] border border-[#D8DEE8] bg-white p-4 shadow-[0_26px_80px_rgba(15,23,42,0.08)] md:p-6">
        <div className="flex flex-col gap-4 border-b border-[#E1E6F0] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FDF0F3] text-[#B30D2D]">
              <Icon name="book-open" size={24} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-[#6B7280]">{stageLabel(stage)}</p>
              <h2 className="truncate font-serif text-2xl font-bold text-[#0B1026]">Book #{numericBookId}</h2>
              <p className="mt-1 text-sm font-semibold text-[#59637A]">
                Session expires {session?.sessionExpiresAt ? formatDateTime(session.sessionExpiresAt) : "after inactivity"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8DEE8] px-3 text-xs font-black text-[#0B1026] transition hover:border-[#B30D2D] hover:text-[#B30D2D] disabled:opacity-50"
            >
              <Icon name="chevron-left" size={16} aria-hidden="true" />
              Prev
            </button>
            <span className="grid h-10 min-w-16 place-items-center rounded-xl bg-[#F8FAFC] px-3 text-xs font-black text-[#0B1026]">
              {page} / {totalPages || "-"}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => (totalPages && current < totalPages ? current + 1 : current))}
              disabled={totalPages > 0 && page >= totalPages}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8DEE8] px-3 text-xs font-black text-[#0B1026] transition hover:border-[#B30D2D] hover:text-[#B30D2D] disabled:opacity-50"
            >
              Next
              <Icon name="chevron-right" size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((current) => Math.max(60, current - 10))}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#D8DEE8] text-sm font-black text-[#0B1026] transition hover:border-[#B30D2D] hover:text-[#B30D2D]"
              aria-label="Zoom out"
            >
              -
            </button>
            <span className="grid h-10 min-w-16 place-items-center rounded-xl bg-[#F8FAFC] px-3 text-xs font-black text-[#0B1026]">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((current) => Math.min(200, current + 10))}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#D8DEE8] text-sm font-black text-[#0B1026] transition hover:border-[#B30D2D] hover:text-[#B30D2D]"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#D8DEE8] text-sm font-black text-[#0B1026] transition hover:border-[#B30D2D] hover:text-[#B30D2D]"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Icon name={isFullscreen ? "minimize-2" : "maximize-2"} size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => void closeReader()}
              disabled={stage === "closing"}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="x" size={16} aria-hidden="true" />
              Close
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4">
            <Notice tone={stage === "access-required" ? "info" : "error"} message={error} />
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void openReader(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#B30D2D] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#910A24]"
              >
                <Icon name="clock" size={17} aria-hidden="true" />
                Reopen reader
              </button>
              <Link
                href={bookHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D8DEE8] px-4 text-sm font-black text-[#0B1026] transition hover:border-[#B30D2D] hover:text-[#B30D2D]"
              >
                <Icon name="arrow-left" size={17} aria-hidden="true" />
                Back to book
              </Link>
            </div>
          </div>
        ) : null}

        <div
          ref={readerContainerRef}
          className={`relative mt-4 overflow-y-auto bg-neutral-900 shadow-inner ${
            isFullscreen ? "h-screen w-screen rounded-none p-0" : "h-[calc(100vh-280px)] min-h-[560px] rounded-2xl p-6"
          }`}
        >
          {isFullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="fixed top-4 right-6 z-50 grid h-12 w-12 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/80"
              title="Exit Fullscreen"
              aria-label="Exit fullscreen"
            >
              <Icon name="minimize-2" size={24} aria-hidden="true" />
            </button>
          )}
          <div className="mx-auto flex min-h-full w-full justify-center">
            {pdfDoc ? (
              <canvas
                ref={canvasRef}
                className="h-auto max-w-full block bg-white shadow-2xl rounded-lg"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white">
                <div className="text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-[#B30D2D] shadow-sm">
                    <Icon name={isBusy ? "clock" : "alert-circle"} size={30} animate={isBusy ? "pulse" : "none"} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-serif text-3xl font-bold">{stageLabel(stage)}</h3>
                  <p className="mt-2 text-sm font-semibold text-white/60">
                    {stageDescription(stage)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </CatalogShell>
  );
}

function readerStorageKey(bookId: number) {
  return `ebook-reader-session:${bookId}`;
}

function readStoredSession(storageKey: string, bookId: number) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    const stored = raw ? (JSON.parse(raw) as StoredReaderSession) : null;

    if (!stored || stored.bookId !== bookId || !stored.sessionToken || !stored.sessionId) {
      return null;
    }

    return stored;
  } catch {
    return null;
  }
}

function isExpired(iso: string | undefined, skewMs = EXPIRY_SKEW_MS) {
  if (!iso) return true;
  return new Date(iso).getTime() - skewMs <= Date.now();
}

function isPdfRenderCancellation(error: unknown) {
  return error instanceof Error && error.name === "RenderingCancelledException";
}

function handleReaderError(
  error: unknown,
  invalidateSession: () => void,
  setStage: (stage: ReaderStage) => void,
  setError: (message: string) => void,
): boolean {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403 || error.status === 409 || error.status === 410) {
      invalidateSession();
    }

    switch (error.code) {
      case "EBOOK_LOAN_REQUIRED":
        setStage("access-required");
        setError("You need an active ebook loan before opening the secure reader.");
        return false;
      case "EBOOK_LOAN_EXPIRED":
        setStage("loan-expired");
        setError("Your ebook access has expired.");
        return false;
      case "READING_SESSION_NOT_ACTIVE":
      case "READING_SESSION_REQUIRED":
      case "READING_SESSION_NOT_FOUND":
        return true; // Signal auto-recovery
      case "EBOOK_NOT_FOUND":
        setStage("content-error");
        setError("This ebook could not be found.");
        return false;
      default:
        break;
    }

    if (error.status === 401 || error.status === 403) {
      setStage("access-required");
      setError(error.message || "Please sign in again to continue reading.");
      return false;
    }

    if (error.status === 409 || error.status === 410) {
      return true; // Signal auto-recovery
    }

    setStage("content-error");
    setError(error.message || "Content failed to load.");
    return false;
  }

  setStage("content-error");
  setError(error instanceof Error ? error.message : "Content failed to load.");
  return false;
}

function stageLabel(stage: ReaderStage) {
  switch (stage) {
    case "creating":
      return "Creating session";
    case "loading-content":
      return "Loading content";
    case "rendering":
      return "Rendering PDF";
    case "refreshing":
      return "Refreshing session";
    case "expired":
      return "Session expired";
    case "loan-expired":
      return "Loan expired";
    case "access-required":
      return "Access required";
    case "closing":
      return "Closing session";
    default:
      return "Content failed to load";
  }
}

function stageDescription(stage: ReaderStage) {
  switch (stage) {
    case "access-required":
      return "Open My ebooks after borrowing or paying for this title.";
    case "loan-expired":
      return "Return to the book page to review your access options.";
    case "expired":
      return "Reopen the reader to start a new secure session.";
    case "content-error":
      return "Use the error details above to retry or return to the book page.";
    case "closing":
      return "Closing your secure reading session...";
    default:
      return "Preparing your protected PDF content...";
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReaderBackButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex items-center justify-center gap-2 rounded-full border border-[#D9DCE8] px-5 py-3 text-sm font-bold text-[#000054] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#337AB7] hover:bg-white hover:text-[#E60028] hover:shadow-lg hover:shadow-[#000054]/10 disabled:cursor-not-allowed disabled:opacity-55"
    >
      <Icon name="arrow-left" size={17} aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-1" />
      Back to book
    </button>
  );
}
