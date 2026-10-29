"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Focus,
  List,
  LoaderCircle,
  Maximize,
  Minimize,
  Search,
  Sparkles,
  ScrollText,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ApiError } from "@/types/api.type";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { ProtectedGate } from "@/features/catalog/components/CatalogShell";
import { ReaderCompanion, type CompanionTab } from "./ReaderCompanion";
import {
  PdfReadingSurface,
  type PdfSearchRequest,
  type ReaderScale,
} from "./PdfReadingSurface";
import { ReaderContents } from "./ReaderContents";
import { ReaderRail } from "./ReaderRail";
import {
  activeReaderSection,
  clampReaderPage,
  readReaderOutline,
  type ReaderOutlineItem,
} from "./readerNavigation";
import {
  closeReadingSession,
  createReadingSession,
  loadPdfContent,
  refreshReadingSession,
} from "../services/ebookService";
import type { StoredReaderSession } from "../types/ebook.type";
import styles from "./reader.module.css";

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
const compactQuery = "(max-width: 1279px)";
const subscribeCompact = (callback: () => void) => {
  const media = window.matchMedia(compactQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

export function EbookReaderPage() {
  const params = useParams<{ bookId: string }>();
  const router = useRouter();
  const { accessToken, isAuthenticated, isInitializing, refresh } = useAuth();
  const { locale } = useLanguage();
  const numericBookId = Number(params.bookId);
  const hasValidBookId = Number.isInteger(numericBookId) && numericBookId > 0;
  const bookHref = hasValidBookId
    ? `/books/${encodeURIComponent(String(numericBookId))}`
    : "/books";
  const storageKey = useMemo(
    () => readerStorageKey(numericBookId),
    [numericBookId],
  );
  const [session, setSession] = useState<StoredReaderSession | null>(null);
  const sessionRef = useRef<StoredReaderSession | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [stage, setStage] = useState<ReaderStage>("creating");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState<ReaderScale>("page-width");
  const [effectiveScale, setEffectiveScale] = useState(1);
  const [singlePage, setSinglePage] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [contentsOpen, setContentsOpen] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<
    "contents" | "assistant" | null
  >(null);
  const [companionTab, setCompanionTab] = useState<CompanionTab>("ask");
  const [bookTitle, setBookTitle] = useState("");
  const [outline, setOutline] = useState<ReaderOutlineItem[]>([]);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [search, setSearch] = useState<PdfSearchRequest | null>(null);
  const [matches, setMatches] = useState({ current: 0, total: 0 });
  const [searchPending, setSearchPending] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const compact = useSyncExternalStore(
    subscribeCompact,
    () => window.matchMedia(compactQuery).matches,
    () => false,
  );
  const showContents =
    !focusMode && (compact ? mobilePanel === "contents" : contentsOpen);
  const showAssistant =
    !focusMode && (compact ? mobilePanel === "assistant" : assistantOpen);
  const section = useMemo(
    () => activeReaderSection(outline, page),
    [outline, page],
  );
  const refreshAccessToken = useCallback(
    async () => (await refresh())?.accessToken ?? null,
    [refresh],
  );

  const setReaderSession = useCallback(
    (nextSession: StoredReaderSession | null) => {
      sessionRef.current = nextSession;
      setSession(nextSession);
      try {
        if (nextSession)
          window.sessionStorage.setItem(
            storageKey,
            JSON.stringify(nextSession),
          );
        else window.sessionStorage.removeItem(storageKey);
      } catch {
        /* Reading remains available without reload recovery storage. */
      }
    },
    [storageKey],
  );
  const clearPdfState = useCallback(() => {
    setPdfDoc(null);
    setTotalPages(0);
    setPage(1);
    setOutline([]);
    setBookTitle("");
  }, []);
  const invalidateSession = useCallback(() => {
    setReaderSession(null);
    clearPdfState();
  }, [clearPdfState, setReaderSession]);
  const loadSignedPdf = useCallback(
    async (activeSession: StoredReaderSession) => {
      setStage("loading-content");
      // Keep the existing authenticated private-PDF transport and refresh contract.
      const arrayBuffer = await loadPdfContent(
        numericBookId,
        activeSession.sessionToken,
        accessToken,
        refreshAccessToken,
      );
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker-${pdfjsLib.version}.min.mjs`;
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
        let activeSession = !forceNewSession
          ? readStoredSession(storageKey, numericBookId)
          : null;
        if (!activeSession || isExpired(activeSession.sessionExpiresAt)) {
          const created = await createReadingSession(
            numericBookId,
            accessToken,
            refreshAccessToken,
          );
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
        if (
          handleReaderError(readerError, invalidateSession, setStage, setError)
        ) {
          setStage("expired");
          setError(
            "Your reading session expired. Reopen the reader to continue.",
          );
        }
      }
    },
    [
      accessToken,
      hasValidBookId,
      invalidateSession,
      isAuthenticated,
      loadSignedPdf,
      numericBookId,
      refreshAccessToken,
      setReaderSession,
      storageKey,
    ],
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
      setReaderSession({
        ...activeSession,
        loanExpiresAt: refreshed.loanExpiresAt,
        sessionExpiresAt: refreshed.sessionExpiresAt,
      });
      setStage("rendering");
      setError("");
    } catch (refreshError) {
      if (
        handleReaderError(refreshError, invalidateSession, setStage, setError)
      )
        void openReader(true);
    }
  }, [
    accessToken,
    invalidateSession,
    refreshAccessToken,
    setReaderSession,
    openReader,
  ]);
  const closeReader = useCallback(async () => {
    const activeSession = sessionRef.current;
    setStage("closing");
    setError("");
    try {
      if (activeSession)
        await closeReadingSession(
          activeSession.sessionId,
          activeSession.sessionToken,
          accessToken,
          refreshAccessToken,
        );
    } catch {
      /* Backend TTL cleans abandoned sessions if close is interrupted. */
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
    if (!session) return;
    const id = window.setInterval(() => void refreshSession(), HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [refreshSession, session]);
  useEffect(() => {
    function visible() {
      if (
        document.visibilityState === "visible" &&
        sessionRef.current &&
        isExpired(sessionRef.current.sessionExpiresAt)
      )
        void refreshSession();
    }
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, [refreshSession]);
  const accessTokenRef = useRef(accessToken);
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);
  useEffect(
    () => () => {
      const activeSession = sessionRef.current;
      if (activeSession)
        void closeReadingSession(
          activeSession.sessionId,
          activeSession.sessionToken,
          accessTokenRef.current,
          undefined,
        ).catch(() => undefined);
    },
    [],
  );
  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;
    void readReaderOutline(pdfDoc)
      .then((items) => {
        if (!cancelled) setOutline(items);
      })
      .catch(() => undefined);
    void pdfDoc
      .getMetadata()
      .then(({ info }) => {
        const title = (info as { Title?: unknown }).Title;
        if (!cancelled && typeof title === "string") setBookTitle(title.trim());
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pdfDoc]);
  const navigateToPage = useCallback(
    (next: number) => {
      if (Number.isInteger(next) && next > 0 && next <= totalPages)
        setPage(next);
    },
    [totalPages],
  );
  const navigateToCitationPage = useCallback(
    (next: number) => {
      navigateToPage(next);
      if (compact) setMobilePanel(null);
    },
    [compact, navigateToPage],
  );
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, [contenteditable="true"]',
        )
      )
        return;
      if (compact && mobilePanel) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setPage((current) =>
          clampReaderPage(
            current + (event.key === "ArrowLeft" ? -1 : 1),
            totalPages,
          ),
        );
      }
      if (event.key === "Escape" && focusMode) setFocusMode(false);
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [compact, mobilePanel, focusMode, totalPages]);
  useEffect(() => {
    const changed = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  const closeContents = useCallback(() => {
    if (compact) setMobilePanel(null);
    else setContentsOpen(false);
  }, [compact]);
  const closeAssistant = useCallback(() => {
    if (compact) setMobilePanel(null);
    else setAssistantOpen(false);
  }, [compact]);
  function openPanel(panel: "contents" | "assistant", toggle = true) {
    const visible = panel === "contents" ? showContents : showAssistant;
    const nextOpen = !toggle || !visible;
    setFocusMode(false);
    if (compact)
      setMobilePanel(nextOpen ? panel : null);
    else if (panel === "contents")
      setContentsOpen(nextOpen);
    else setAssistantOpen(nextOpen);
  }
  function searchPdf(query: string, previous = false, again = false) {
    if (!again) setMatches({ current: 0, total: 0 });
    setSearchPending(Boolean(query));
    setSearch((current) => ({
      query,
      previous,
      again,
      serial: (current?.serial ?? 0) + 1,
    }));
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shellRef.current?.requestFullscreen();
    } catch {
      /* Focus mode remains available. */
    }
  }
  const displayTitle = bookTitle || `Book #${numericBookId}`;
  const busy =
    stage === "creating" || stage === "loading-content" || stage === "closing";
  const contentsAction = locale === "vi"
    ? (showContents ? "Ẩn mục lục" : "Mở mục lục")
    : (showContents ? "Hide contents" : "Show contents");
  const assistantAction = locale === "vi"
    ? (showAssistant ? "Ẩn trợ lý AI" : "Mở trợ lý AI")
    : (showAssistant ? "Hide AI assistant" : "Open AI assistant");

  return (
    <ProtectedGate enabled>
      <div
        ref={shellRef}
        className={`${styles.shell} ${focusMode ? styles.focus : ""}`}
      >
        {!focusMode ? (
          <div className={styles.siteHeader}>
            <Navbar />
          </div>
        ) : null}
        <main id="main-content" tabIndex={-1} className={styles.main}>
          <div
            className={styles.toolbar}
            role="toolbar"
            aria-label="Reading controls"
          >
            <div className={styles.bookIdentity}>
              <span className={styles.bookIcon}>
                <BookOpen size={20} aria-hidden="true" />
              </span>
              <div>
                <p>{focusMode ? "FOCUS READING" : `Book #${numericBookId}`}</p>
                <h1 className="font-serif" title={displayTitle}>
                  {displayTitle}
                </h1>
              </div>
            </div>
            <p className={styles.sectionTitle} title={section?.title}>
              {section?.title ||
                "Your space to read, discover, and understand."}
            </p>
            <div className={styles.controls}>
              <ReaderButton
                label="Previous page"
                disabled={page <= 1 || !pdfDoc}
                onClick={() => navigateToPage(page - 1)}
              >
                <ChevronLeft size={17} />
              </ReaderButton>
              <label className={styles.pageControl}>
                <input
                  key={page}
                  aria-label="Current page"
                  type="number"
                  min={1}
                  max={totalPages || 1}
                  defaultValue={page}
                  onBlur={(event) => {
                    const next = clampReaderPage(
                      Number(event.currentTarget.value),
                      totalPages,
                    );
                    event.currentTarget.value = String(next);
                    navigateToPage(next);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      const next = clampReaderPage(
                        Number(event.currentTarget.value),
                        totalPages,
                      );
                      event.currentTarget.value = String(next);
                      navigateToPage(next);
                    }
                  }}
                />
                <span>/ {totalPages || "—"}</span>
              </label>
              <ReaderButton
                label="Next page"
                disabled={!pdfDoc || page >= totalPages}
                onClick={() => navigateToPage(page + 1)}
              >
                <ChevronRight size={17} />
              </ReaderButton>
              <span className={styles.divider} />
              <select
                aria-label="Page zoom"
                className={styles.zoomSelect}
                value={scale}
                onChange={(event) =>
                  setScale(
                    event.target.value === "page-width" ||
                      event.target.value === "page-fit"
                      ? event.target.value
                      : Number(event.target.value),
                  )
                }
              >
                <option value="page-width">Fit width</option>
                <option value="page-fit">Fit page</option>
                {[0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3].map((value) => (
                  <option key={value} value={value}>
                    {value * 100}%
                  </option>
                ))}
                {typeof scale === "number" &&
                ![0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3].includes(scale) ? (
                  <option value={scale}>{Math.round(scale * 100)}%</option>
                ) : null}
              </select>
              <ReaderButton
                label="Zoom out"
                className={styles.secondaryControl}
                disabled={!pdfDoc}
                onClick={() =>
                  setScale(
                    Math.max(
                      0.5,
                      Math.round((effectiveScale - 0.15) * 100) / 100,
                    ),
                  )
                }
              >
                <ZoomOut size={17} />
              </ReaderButton>
              <ReaderButton
                label="Zoom in"
                className={styles.secondaryControl}
                disabled={!pdfDoc}
                onClick={() =>
                  setScale(
                    Math.min(
                      3,
                      Math.round((effectiveScale + 0.15) * 100) / 100,
                    ),
                  )
                }
              >
                <ZoomIn size={17} />
              </ReaderButton>
              <ReaderButton
                label={
                  singlePage
                    ? "Switch to continuous scrolling"
                    : "Switch to single-page mode"
                }
                className={styles.secondaryControl}
                pressed={singlePage}
                onClick={() => setSinglePage((current) => !current)}
              >
                <ScrollText size={18} />
              </ReaderButton>
              <ReaderButton
                label="Bookmark this page (this tab only)"
                className={styles.secondaryControl}
                pressed={bookmarks.includes(page)}
                disabled={!pdfDoc}
                onClick={() =>
                  setBookmarks((current) =>
                    current.includes(page)
                      ? current.filter((value) => value !== page)
                      : [...current, page].sort((a, b) => a - b),
                  )
                }
              >
                <Bookmark
                  size={17}
                  fill={bookmarks.includes(page) ? "currentColor" : "none"}
                />
              </ReaderButton>
              <ReaderButton
                label="Search in PDF"
                onClick={() => {
                  setCompanionTab("search");
                  openPanel("assistant", false);
                }}
              >
                <Search size={18} />
              </ReaderButton>
              <ReaderButton
                label={focusMode ? "Exit focus mode" : "Enter focus mode"}
                pressed={focusMode}
                onClick={() => {
                  setFocusMode((current) => !current);
                  setMobilePanel(null);
                }}
              >
                <Focus size={18} />
              </ReaderButton>
              <ReaderButton
                label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className={styles.secondaryControl}
                onClick={() => void toggleFullscreen()}
              >
                {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
              </ReaderButton>
              <ReaderButton
                label="Exit reader"
                disabled={stage === "closing"}
                onClick={() => void closeReader()}
              >
                <X size={18} />
              </ReaderButton>
              <select
                aria-label="Reading layout"
                className={styles.mobileLayout}
                value={singlePage ? "single" : "continuous"}
                onChange={(event) =>
                  setSinglePage(event.target.value === "single")
                }
              >
                <option value="continuous">Continuous</option>
                <option value="single">Single page</option>
              </select>
            </div>
          </div>
          <div
            className={styles.panelSwitches}
            role="group"
            aria-label={locale === "vi" ? "Bảng hỗ trợ đọc" : "Reading panels"}
          >
            <ReaderButton
              label={contentsAction}
              className={styles.panelToggle}
              expanded={showContents}
              controls="ebook-contents-rail"
              onClick={() => openPanel("contents")}
            >
              <List size={18} aria-hidden="true" />
              <span>{contentsAction}</span>
            </ReaderButton>
            <ReaderButton
              label={assistantAction}
              className={styles.panelToggle}
              expanded={showAssistant}
              controls="ebook-ai-reader-panel"
              onClick={() => openPanel("assistant")}
            >
              <Sparkles size={18} aria-hidden="true" />
              <span>{assistantAction}</span>
            </ReaderButton>
          </div>
          {error ? (
            <div className={styles.errorBar} role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => void openReader(true)}>
                Reopen reader
              </button>
              <Link href={bookHref}>Back to book</Link>
            </div>
          ) : null}
          <div className={styles.workspace}>
            {compact && (showContents || showAssistant) ? (
              <button
                type="button"
                className={styles.scrim}
                onClick={() => setMobilePanel(null)}
                aria-label="Close reading panel"
                tabIndex={-1}
              />
            ) : null}
            <ReaderRail
              open={showContents}
              compact={compact}
              label="Table of contents"
              className={styles.contentsRail}
              onClose={closeContents}
            >
              <div id="ebook-contents-rail" className="flex min-h-0 w-full">
                <ReaderContents
                  items={outline}
                  page={page}
                  totalPages={totalPages}
                  bookmarks={bookmarks}
                  onNavigate={navigateToCitationPage}
                  onClose={closeContents}
                />
              </div>
            </ReaderRail>
            <section
              className={styles.readingColumn}
              aria-label="Book document"
            >
              <div className={styles.readingSurface}>
                {pdfDoc ? (
                  <PdfReadingSurface
                    document={pdfDoc}
                    page={page}
                    scale={scale}
                    singlePage={singlePage}
                    search={search}
                    onPageChange={setPage}
                    onScaleChange={setEffectiveScale}
                    onMatchesChange={setMatches}
                    onSearchPending={setSearchPending}
                    onError={setError}
                  />
                ) : (
                  <div className={styles.stage}>
                    <span className={styles.stageIcon}>
                      {busy ? (
                        <LoaderCircle
                          size={29}
                          className="animate-spin motion-reduce:animate-none"
                        />
                      ) : (
                        <BookOpen size={29} />
                      )}
                    </span>
                    <h2 className="font-serif">{stageLabel(stage)}</h2>
                    <p>{stageDescription(stage)}</p>
                    {!busy ? (
                      <Link
                        href={bookHref}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#7A263A]"
                      >
                        <ArrowLeft size={15} /> Back to book
                      </Link>
                    ) : null}
                  </div>
                )}
              </div>
              <footer className={styles.readingFooter}>
                <span>
                  {focusMode
                    ? "Focus on your next chapter."
                    : "THE ATHENAEUM · SECURE READER"}
                </span>
                <span>
                  {page} / {totalPages || "—"} ·{" "}
                  {singlePage ? "Single page" : "Continuous"}
                </span>
                <span
                  title={
                    session?.sessionExpiresAt
                      ? `Session expires ${formatDateTime(session.sessionExpiresAt)}`
                      : undefined
                  }
                >
                  {stage === "refreshing"
                    ? "Renewing session…"
                    : "Private reading session"}
                </span>
              </footer>
            </section>
            <ReaderRail
              open={showAssistant}
              compact={compact}
              label="Reading companion"
              className={styles.assistantRail}
              onClose={closeAssistant}
            >
              <ReaderCompanion
                bookId={numericBookId}
                session={session}
                accessToken={accessToken}
                refreshAccessToken={refreshAccessToken}
                totalPages={totalPages}
                currentPage={page}
                tab={companionTab}
                onTabChange={setCompanionTab}
                pdfMatches={matches}
                pdfSearchPending={searchPending}
                onSearchPdf={searchPdf}
                onNavigateToPage={navigateToCitationPage}
                onSessionExpired={() => void openReader(true)}
                onClose={closeAssistant}
              />
            </ReaderRail>
          </div>
        </main>
      </div>
    </ProtectedGate>
  );
}
function ReaderButton({
  label,
  onClick,
  children,
  disabled,
  expanded,
  controls,
  pressed,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  expanded?: boolean;
  controls?: string;
  pressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`${styles.iconButton} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-pressed={pressed}
    >
      {children}
    </button>
  );
}
function readerStorageKey(bookId: number) {
  return `ebook-reader-session:${bookId}`;
}
function readStoredSession(storageKey: string, bookId: number) {
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    const stored = raw ? (JSON.parse(raw) as StoredReaderSession) : null;
    return stored &&
      stored.bookId === bookId &&
      stored.sessionToken &&
      stored.sessionId
      ? stored
      : null;
  } catch {
    return null;
  }
}
function isExpired(iso: string | undefined, skewMs = EXPIRY_SKEW_MS) {
  return !iso || new Date(iso).getTime() - skewMs <= Date.now();
}
function handleReaderError(
  error: unknown,
  invalidateSession: () => void,
  setStage: (stage: ReaderStage) => void,
  setError: (message: string) => void,
): boolean {
  if (error instanceof ApiError) {
    if ([401, 403, 409, 410].includes(error.status)) invalidateSession();
    switch (error.code) {
      case "EBOOK_LOAN_REQUIRED":
        setStage("access-required");
        setError(
          "You need an active ebook loan before opening the secure reader.",
        );
        return false;
      case "EBOOK_LOAN_EXPIRED":
        setStage("loan-expired");
        setError("Your ebook access has expired.");
        return false;
      case "READING_SESSION_NOT_ACTIVE":
      case "READING_SESSION_REQUIRED":
      case "READING_SESSION_NOT_FOUND":
        return true;
      case "EBOOK_NOT_FOUND":
        setStage("content-error");
        setError("This ebook could not be found.");
        return false;
    }
    if (error.status === 401 || error.status === 403) {
      setStage("access-required");
      setError(error.message || "Please sign in again to continue reading.");
      return false;
    }
    if (error.status === 409 || error.status === 410) return true;
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
      return "Opening your book";
    case "loading-content":
      return "Preparing your pages";
    case "rendering":
      return "Your book is ready";
    case "refreshing":
      return "Renewing your session";
    case "expired":
      return "Session expired";
    case "loan-expired":
      return "Loan expired";
    case "access-required":
      return "Access required";
    case "closing":
      return "Closing your book";
    default:
      return "Content unavailable";
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
      return "Closing your secure reading session…";
    default:
      return "Loading the original PDF, with its text, tables and illustrations intact.";
  }
}
function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
}
