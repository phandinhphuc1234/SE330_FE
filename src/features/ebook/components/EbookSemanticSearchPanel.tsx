"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/types/api.type";

import { askEbookQuestion, semanticSearchEbook } from "../services/ebookService";
import {
  EbookAnswerCitation,
  EbookAnswerResponse,
  EbookSemanticSearchCitation,
  EbookSemanticSearchResponse,
  StoredReaderSession,
} from "../types/ebook.type";

type EbookSemanticSearchPanelProps = {
  bookId: number;
  session: StoredReaderSession | null;
  accessToken: string | null;
  refreshAccessToken: () => Promise<string | null>;
  totalPages: number;
  onNavigateToPage: (page: number) => void;
  onSessionExpired: () => void;
  onClose: () => void;
};

type AiMode = "ask" | "search";
type RequestStatus = "idle" | "loading" | "success" | "error";

type RequestState<T> = {
  status: RequestStatus;
  result: T | null;
  error: string;
};

const MAX_QUERY_LENGTH = 4096;
const EMPTY_STATE = { status: "idle", result: null, error: "" } as const;
const ASK_SUGGESTIONS = [
  "What is the main idea of this book?",
  "Explain the central problem using evidence from the book",
  "What conclusion does the author reach?",
];
const SEARCH_SUGGESTIONS = [
  "Find the passage that introduces the main idea",
  "Where is the central conflict or problem discussed?",
  "Find the conclusion or final takeaway",
];

export function EbookSemanticSearchPanel({
  bookId,
  session,
  accessToken,
  refreshAccessToken,
  totalPages,
  onNavigateToPage,
  onSessionExpired,
  onClose,
}: EbookSemanticSearchPanelProps) {
  const [mode, setMode] = useState<AiMode>("ask");
  const [query, setQuery] = useState("");
  const [askState, setAskState] = useState<RequestState<EbookAnswerResponse>>(EMPTY_STATE);
  const [searchState, setSearchState] = useState<RequestState<EbookSemanticSearchResponse>>(EMPTY_STATE);

  const trimmedQuery = query.trim();
  const activeState = mode === "ask" ? askState : searchState;
  const suggestions = mode === "ask" ? ASK_SUGGESTIONS : SEARCH_SUGGESTIONS;
  const canSubmit = Boolean(session && trimmedQuery && activeState.status !== "loading");

  async function submitRequest(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!session || !trimmedQuery || activeState.status === "loading") return;

    if (mode === "ask") {
      setAskState({ status: "loading", result: null, error: "" });
    } else {
      setSearchState({ status: "loading", result: null, error: "" });
    }

    try {
      if (mode === "ask") {
        const response = await askEbookQuestion(
          bookId,
          session.sessionToken,
          { question: trimmedQuery, topK: 6 },
          accessToken,
          refreshAccessToken,
        );
        setAskState({ status: "success", result: response, error: "" });
      } else {
        const response = await semanticSearchEbook(
          bookId,
          session.sessionToken,
          { query: trimmedQuery, topK: 6, scoreThreshold: 0.55 },
          accessToken,
          refreshAccessToken,
        );
        setSearchState({ status: "success", result: response, error: "" });
      }
    } catch (requestError) {
      const message = aiErrorMessage(requestError, mode);
      if (mode === "ask") {
        setAskState({ status: "error", result: null, error: message });
      } else {
        setSearchState({ status: "error", result: null, error: message });
      }

      if (requestError instanceof ApiError && isReadingSessionError(requestError.code)) {
        onSessionExpired();
      }
    }
  }

  function handleQueryKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void submitRequest();
    }
  }

  return (
    <aside
      id="ebook-ai-reader-panel"
      aria-label="AI reading assistant"
      className="order-first flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-[#D8CCBC] bg-[#FFFCF5] shadow-[0_18px_50px_rgba(23,20,18,0.09)] xl:order-last"
    >
      <header className="border-b border-[#E5DCD0] bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F3E5E8] text-[#7A263A]">
              <Icon name="sparkles" size={19} aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-xl font-bold text-[#171412]">AI reading assistant</h2>
                <span className="rounded-full border border-[#D8CCBC] bg-[#FBF8F1] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7A263A]">
                  Current ebook
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[#6F675E]">
                Ask a grounded question or find the original passages behind an idea.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[#6F675E] outline-none transition hover:bg-[#EFE6D6] hover:text-[#7A263A] focus-visible:ring-2 focus-visible:ring-[#7A263A] focus-visible:ring-offset-2"
            aria-label="Close AI reading assistant"
          >
            <Icon name="x" size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 rounded-xl border border-[#DED5C8] bg-[#FBF8F1] p-1" aria-label="AI reader mode">
          <ModeButton active={mode === "ask"} icon="sparkles" label="Ask this book" onClick={() => setMode("ask")} />
          <ModeButton active={mode === "search"} icon="search" label="Find passages" onClick={() => setMode("search")} />
        </div>
      </header>

      <form onSubmit={submitRequest} className="border-b border-[#E5DCD0] px-5 py-5">
        <label htmlFor="ebook-ai-query" className="text-sm font-bold text-[#2B2723]">
          {mode === "ask" ? "What would you like to understand?" : "What do you want to find?"}
        </label>
        <div className="mt-2 rounded-xl border border-[#DED5C8] bg-white p-3 shadow-sm transition focus-within:border-[#7A263A] focus-within:ring-3 focus-within:ring-[#7A263A]/15">
          <textarea
            id="ebook-ai-query"
            value={query}
            onChange={(event) => setQuery(event.target.value.slice(0, MAX_QUERY_LENGTH))}
            onKeyDown={handleQueryKeyDown}
            rows={3}
            maxLength={MAX_QUERY_LENGTH}
            placeholder={mode === "ask" ? "Ask a question answered by this ebook..." : "Describe an idea, event, character, or concept..."}
            className="w-full resize-none bg-transparent text-sm leading-6 text-[#171412] outline-none placeholder:text-[#9A9187]"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-medium text-[#7B736B]">
            <span>Ctrl/⌘ + Enter to submit</span>
            <span>{query.length}/{MAX_QUERY_LENGTH}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" aria-label={mode === "ask" ? "Suggested questions" : "Suggested searches"}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="rounded-lg border border-[#DED5C8] bg-white px-3 py-2 text-left text-xs font-semibold leading-4 text-[#4C453F] outline-none transition hover:border-[#CFA9B3] hover:bg-[#F3E5E8] hover:text-[#5A1C2B] focus-visible:ring-2 focus-visible:ring-[#7A263A] focus-visible:ring-offset-2"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7A263A] px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgba(122,38,58,0.18)] outline-none transition hover:bg-[#5A1C2B] focus-visible:ring-2 focus-visible:ring-[#7A263A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Icon
            name={activeState.status === "loading" ? "clock" : mode === "ask" ? "sparkles" : "search"}
            size={17}
            animate={activeState.status === "loading" ? "pulse" : "none"}
            aria-hidden="true"
          />
          {submitLabel(mode, activeState.status)}
        </button>
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5" aria-live="polite" aria-busy={activeState.status === "loading"}>
        {mode === "ask" ? (
          <AskResult
            state={askState}
            sessionAvailable={Boolean(session && trimmedQuery)}
            totalPages={totalPages}
            onNavigateToPage={onNavigateToPage}
            onRetry={() => void submitRequest()}
          />
        ) : (
          <SearchResult
            state={searchState}
            sessionAvailable={Boolean(session && trimmedQuery)}
            totalPages={totalPages}
            onNavigateToPage={onNavigateToPage}
            onRetry={() => void submitRequest()}
          />
        )}
      </div>

      <footer className="border-t border-[#E5DCD0] bg-[#FBF8F1] px-5 py-3 text-[11px] leading-5 text-[#6F675E]">
        {mode === "ask"
          ? "Answers use retrieved evidence from this ebook. Verify important details on the cited page."
          : "Passage results are evidence from the book, not a generated answer."}
      </footer>
    </aside>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: "sparkles" | "search";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#7A263A] focus-visible:ring-offset-1 ${
        active ? "bg-white text-[#7A263A] shadow-sm" : "text-[#6F675E] hover:text-[#2B2723]"
      }`}
    >
      <Icon name={icon} size={15} aria-hidden="true" />
      {label}
    </button>
  );
}

function AskResult({
  state,
  sessionAvailable,
  totalPages,
  onNavigateToPage,
  onRetry,
}: {
  state: RequestState<EbookAnswerResponse>;
  sessionAvailable: boolean;
  totalPages: number;
  onNavigateToPage: (page: number) => void;
  onRetry: () => void;
}) {
  if (state.status === "idle") return <AskIntroduction />;
  if (state.status === "loading") return <AssistantLoading mode="ask" />;
  if (state.status === "error") return <RequestError title="Answer unavailable" message={state.error} onRetry={onRetry} canRetry={sessionAvailable} />;
  if (!state.result) return null;

  if (state.result.abstained) {
    return (
      <div className="rounded-xl border border-[#DFC98F] bg-[#FFF8E8] p-4 text-[#5D491E]">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#F4E8CC] text-[#8A641B]">
            <Icon name="info" size={18} aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-serif text-lg font-bold">Not enough evidence in this ebook</h3>
            <p className="mt-1 text-sm leading-6">{state.result.answer}</p>
            <p className="mt-2 text-xs leading-5 text-[#715C2C]">Try asking about a specific chapter, person, event, or concept that appears in the book.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <article className="rounded-xl border border-[#BFD7CA] bg-[#F2F8F5] p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#2F5D50]">
          <Icon name="check-circle" size={17} aria-hidden="true" />
          Grounded answer
        </div>
        <p className="mt-3 whitespace-pre-wrap font-serif text-[17px] leading-7 text-[#171412]">{state.result.answer}</p>
      </article>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A263A]">
            {state.result.citations.length} {state.result.citations.length === 1 ? "source" : "sources"}
          </p>
          <p className="text-xs text-[#7B736B]">Cited evidence</p>
        </div>
        <ol className="space-y-3">
          {state.result.citations.map((citation, index) => (
            <CitationCard
              key={citation.chunkId || `${citation.documentId}-${citation.chunkIndex}-${index}`}
              index={index}
              score={citation.score}
              excerpt={citation.excerpt}
              citation={citation}
              totalPages={totalPages}
              onNavigateToPage={onNavigateToPage}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}

function SearchResult({
  state,
  sessionAvailable,
  totalPages,
  onNavigateToPage,
  onRetry,
}: {
  state: RequestState<EbookSemanticSearchResponse>;
  sessionAvailable: boolean;
  totalPages: number;
  onNavigateToPage: (page: number) => void;
  onRetry: () => void;
}) {
  if (state.status === "idle") return <SearchIntroduction />;
  if (state.status === "loading") return <AssistantLoading mode="search" />;
  if (state.status === "error") return <RequestError title="Search unavailable" message={state.error} onRetry={onRetry} canRetry={sessionAvailable} />;
  if (!state.result) return null;
  if (state.result.results.length === 0) return <SearchEmpty />;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A263A]">{state.result.resultCount} passages</p>
        <p className="text-xs text-[#7B736B]">Current ebook only</p>
      </div>
      <ol className="space-y-3">
        {state.result.results.map((hit, index) => (
          <CitationCard
            key={hit.chunkId || `${hit.citation.documentId}-${hit.citation.chunkIndex}-${index}`}
            index={index}
            score={hit.score}
            excerpt={hit.text}
            citation={hit.citation}
            totalPages={totalPages}
            onNavigateToPage={onNavigateToPage}
          />
        ))}
      </ol>
    </div>
  );
}

function CitationCard({
  index,
  score,
  excerpt,
  citation,
  totalPages,
  onNavigateToPage,
}: {
  index: number;
  score: number;
  excerpt?: string | null;
  citation: EbookAnswerCitation | EbookSemanticSearchCitation;
  totalPages: number;
  onNavigateToPage: (page: number) => void;
}) {
  const pageStart = citation.pageStart;
  const canNavigate = Boolean(pageStart && pageStart > 0 && (!totalPages || pageStart <= totalPages));

  return (
    <li className="rounded-xl border border-[#E5DCD0] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F3E5E8] text-xs font-black text-[#7A263A]">{index + 1}</span>
        <span className="text-[11px] font-semibold text-[#7B736B]">{formatRelevance(score)} match</span>
      </div>
      <blockquote className="mt-3 border-l-2 border-[#B8872B] pl-3 text-sm leading-6 text-[#2B2723]">
        {excerpt || "This source has no preview text."}
      </blockquote>
      <div className="mt-4 border-t border-[#EFE6D6] pt-3">
        <p className="text-xs font-bold text-[#4C453F]">{citationTitle(citation)}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-[#7B736B]">{pageLabel(citation.pageStart, citation.pageEnd)}</p>
          {canNavigate && pageStart ? (
            <button
              type="button"
              onClick={() => onNavigateToPage(pageStart)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#CBBEAE] px-3 text-xs font-bold text-[#7A263A] outline-none transition hover:bg-[#FBF8F1] focus-visible:ring-2 focus-visible:ring-[#7A263A] focus-visible:ring-offset-2"
            >
              Go to page {pageStart}
              <Icon name="arrow-right" size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function AskIntroduction() {
  return (
    <div className="rounded-xl border border-dashed border-[#CBBEAE] bg-white px-4 py-6 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#F3E5E8] text-[#7A263A]">
        <Icon name="sparkles" size={20} aria-hidden="true" />
      </span>
      <h3 className="mt-3 font-serif text-lg font-bold text-[#171412]">Ask with the book open beside you</h3>
      <p className="mt-2 text-xs leading-5 text-[#6F675E]">
        The assistant answers only when it finds supporting passages in this ebook and cites the pages it used.
      </p>
    </div>
  );
}

function SearchIntroduction() {
  return (
    <div className="rounded-xl border border-dashed border-[#CBBEAE] bg-white px-4 py-6 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#EFE6D6] text-[#7A263A]">
        <Icon name="file-text" size={20} aria-hidden="true" />
      </span>
      <h3 className="mt-3 font-serif text-lg font-bold text-[#171412]">Find evidence without leaving the page</h3>
      <p className="mt-2 text-xs leading-5 text-[#6F675E]">Use natural language. Search remains restricted to the ebook in your active reading session.</p>
    </div>
  );
}

function AssistantLoading({ mode }: { mode: AiMode }) {
  return (
    <div className="space-y-3" aria-label={mode === "ask" ? "Generating grounded answer" : "Searching ebook"}>
      <div className="rounded-xl border border-[#E5DCD0] bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#7A263A]">
          <Icon name="clock" size={16} animate="pulse" aria-hidden="true" />
          {mode === "ask" ? "Reading the most relevant passages..." : "Searching this ebook..."}
        </div>
      </div>
      {[0, 1, 2].map((item) => (
        <div key={item} className="animate-pulse rounded-xl border border-[#E5DCD0] bg-white p-4">
          <div className="h-3 w-20 rounded bg-[#EFE6D6]" />
          <div className="mt-4 h-3 w-full rounded bg-[#EFE6D6]" />
          <div className="mt-2 h-3 w-10/12 rounded bg-[#EFE6D6]" />
          <div className="mt-2 h-3 w-7/12 rounded bg-[#EFE6D6]" />
        </div>
      ))}
    </div>
  );
}

function RequestError({
  title,
  message,
  onRetry,
  canRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  canRetry: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E2B8B2] bg-[#F6E4E1] p-4 text-[#7F2D2D]">
      <div className="flex items-start gap-3">
        <Icon name="alert-circle" size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="mt-1 text-xs leading-5">{message}</p>
        </div>
      </div>
      {canRetry ? (
        <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-lg border border-[#C99089] bg-white px-3 text-xs font-bold outline-none transition hover:bg-[#FFF8F6] focus-visible:ring-2 focus-visible:ring-[#7F2D2D] focus-visible:ring-offset-2">
          Try again
        </button>
      ) : null}
    </div>
  );
}

function SearchEmpty() {
  return (
    <div className="rounded-xl border border-dashed border-[#CBBEAE] bg-white px-4 py-6 text-center">
      <Icon name="search" size={24} className="mx-auto text-[#9A9187]" aria-hidden="true" />
      <h3 className="mt-3 font-serif text-lg font-bold text-[#171412]">No matching passage found</h3>
      <p className="mt-2 text-xs leading-5 text-[#6F675E]">Try a more specific concept, character, event, or phrase from the ebook.</p>
    </div>
  );
}

function submitLabel(mode: AiMode, status: RequestStatus) {
  if (status === "loading") return mode === "ask" ? "Building a grounded answer..." : "Searching this ebook...";
  return mode === "ask" ? "Ask this book" : "Find relevant passages";
}

function aiErrorMessage(error: unknown, mode: AiMode) {
  if (error instanceof ApiError) {
    if (error.code === "EBOOK_AI_NOT_READY") {
      return "AI features are still being prepared for this ebook. You can keep reading and try again shortly.";
    }
    if (isReadingSessionError(error.code)) {
      return "Your secure reading session expired. We are reopening it; please retry in a moment.";
    }
    if (error.code === "EBOOK_LOAN_REQUIRED" || error.code === "EBOOK_LOAN_EXPIRED") {
      return "AI reading features require an active ebook loan for this title.";
    }
    if (error.code === "RAG_SERVICE_ERROR") {
      return "The AI reading service is temporarily unavailable. Your ebook reader is still available.";
    }
    if (error.code === "EBOOK_AI_RATE_LIMIT_EXCEEDED") {
      return "You have reached the AI request limit for this book. Keep reading and try again shortly.";
    }
    if (error.code === "EBOOK_AI_RATE_LIMIT_UNAVAILABLE") {
      return "AI requests are temporarily paused while the protection service recovers. The ebook reader is still available.";
    }
  }
  return mode === "ask"
    ? "The assistant could not complete this answer. Please try again."
    : "AI search could not reach the book index. Please try again.";
}

function isReadingSessionError(code?: string) {
  return code === "READING_SESSION_NOT_ACTIVE"
    || code === "READING_SESSION_REQUIRED"
    || code === "READING_SESSION_NOT_FOUND"
    || code === "READING_SESSION_FORBIDDEN";
}

function formatRelevance(score: number) {
  const normalized = score <= 1 ? score * 100 : score;
  return `${Math.max(0, Math.min(100, Math.round(normalized)))}%`;
}

function citationTitle(citation: EbookAnswerCitation | EbookSemanticSearchCitation) {
  if (citation.chapterTitle) return citation.chapterTitle;
  if (citation.chapterIndex != null) return `Chapter ${citation.chapterIndex + 1}`;
  return "Passage from this ebook";
}

function pageLabel(pageStart?: number | null, pageEnd?: number | null) {
  if (!pageStart) return "Page metadata unavailable";
  if (pageEnd && pageEnd !== pageStart) return `Pages ${pageStart}-${pageEnd}`;
  return `Page ${pageStart}`;
}
