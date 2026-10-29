"use client";

import { useState, type ComponentProps } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  NotebookPen,
  Plus,
  Search,
  X,
} from "lucide-react";
import { EbookSemanticSearchPanel } from "./EbookSemanticSearchPanel";

export type CompanionTab = "ask" | "notes" | "search";
type SearchProps = {
  totalPages: number;
  pdfMatches: { current: number; total: number };
  pdfSearchPending: boolean;
  onSearchPdf: (query: string, previous?: boolean, again?: boolean) => void;
};
type Props = ComponentProps<typeof EbookSemanticSearchPanel> &
  SearchProps & {
    currentPage: number;
    tab: CompanionTab;
    onTabChange: (tab: CompanionTab) => void;
  };

export function ReaderCompanion({
  tab,
  onTabChange,
  currentPage,
  pdfMatches,
  pdfSearchPending,
  onSearchPdf,
  ...aiProps
}: Props) {
  const [searchKind, setSearchKind] = useState<"pdf" | "semantic">("pdf");
  const showAi =
    tab === "ask" || (tab === "search" && searchKind === "semantic");
  const showPdfSearch = tab === "search" && searchKind === "pdf";
  return (
    <div id="ebook-ai-reader-panel" className="flex min-h-0 w-full flex-col">
      <header
        className="flex shrink-0 items-center gap-1 border-b border-[#E5DCD0] px-3 pt-2"
        aria-label="Reading companion tabs"
      >
        {(["ask", "notes", "search"] as const).map((name) => (
          <button
            type="button"
            key={name}
            aria-pressed={tab === name}
            onClick={() => onTabChange(name)}
            className={`min-h-12 border-b-2 px-4 font-serif text-sm capitalize transition-colors ${tab === name ? "border-[#7A263A] font-semibold text-[#7A263A]" : "border-transparent text-[#6F675E] hover:text-[#7A263A]"}`}
          >
            {name}
          </button>
        ))}
        <button
          type="button"
          onClick={aiProps.onClose}
          aria-label="Close AI reading assistant"
          className="ml-auto grid h-11 w-10 place-items-center rounded-lg text-[#6F675E] hover:bg-[#F3E5E8]"
        >
          <X size={18} />
        </button>
      </header>
      {tab === "search" ? (
        <div className="flex shrink-0 gap-1 border-b border-[#E5DCD0] p-3">
          {(["pdf", "semantic"] as const).map((kind) => (
            <button
              type="button"
              key={kind}
              aria-pressed={searchKind === kind}
              onClick={() => setSearchKind(kind)}
              className={`min-h-10 flex-1 rounded-lg px-2 text-xs font-semibold ${searchKind === kind ? "bg-[#F3E5E8] text-[#7A263A]" : "text-[#6F675E] hover:bg-[#F1EADF]"}`}
            >
              {kind === "pdf" ? "Text in PDF" : "Find passages · AI"}
            </button>
          ))}
        </div>
      ) : null}
      <div
        className={showAi ? "flex min-h-0 flex-1" : "hidden"}
        aria-hidden={!showAi}
        inert={!showAi}
      >
        <EbookSemanticSearchPanel
          {...aiProps}
          embedded
          requestedMode={tab === "ask" ? "ask" : "search"}
        />
      </div>
      <div
        className={showPdfSearch ? "flex min-h-0 flex-1" : "hidden"}
        aria-hidden={!showPdfSearch}
        inert={!showPdfSearch}
      >
        <PdfTextSearch
          totalPages={aiProps.totalPages}
          pdfMatches={pdfMatches}
          pdfSearchPending={pdfSearchPending}
          onSearchPdf={onSearchPdf}
        />
      </div>
      <div
        className={tab === "notes" ? "flex min-h-0 flex-1" : "hidden"}
        aria-hidden={tab !== "notes"}
        inert={tab !== "notes"}
      >
        <ReaderNotes
          currentPage={currentPage}
          onNavigate={aiProps.onNavigateToPage}
        />
      </div>
    </div>
  );
}

function PdfTextSearch({
  totalPages,
  pdfMatches,
  pdfSearchPending,
  onSearchPdf,
}: SearchProps) {
  const [term, setTerm] = useState("");
  const [searched, setSearched] = useState("");
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
      <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-[#F3E5E8] text-[#7A263A]">
        <Search size={21} />
      </span>
      <h2 className="mt-4 font-serif text-xl font-semibold">
        Find a word, find an idea.
      </h2>
      <p className="mt-2 text-xs leading-6 text-[#6F675E]">
        Search the original text in this PDF. Matches are highlighted on the
        page. No AI request is used.
      </p>
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          setSearched(term.trim());
          onSearchPdf(term.trim());
        }}
      >
        <label htmlFor="reader-pdf-search" className="text-xs font-semibold">
          Word or phrase
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#DED5C8] bg-white p-2">
          <input
            id="reader-pdf-search"
            value={term}
            maxLength={256}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search this PDF…"
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!term.trim() || !totalPages}
            aria-label="Find text in PDF"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#7A263A] text-white disabled:opacity-40"
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
      {searched ? (
        <>
          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-[#F1EADF] p-3">
            <p
              className="text-xs"
              aria-live="polite"
              aria-busy={pdfSearchPending}
            >
              {pdfSearchPending
                ? "Searching PDF…"
                : pdfMatches.total
                  ? `${pdfMatches.current} of ${pdfMatches.total} matches`
                  : "No matches found"}
            </p>
            <div className="flex">
              <button
                type="button"
                aria-label="Previous text match"
                disabled={!pdfMatches.total}
                onClick={() => onSearchPdf(searched, true, true)}
                className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                type="button"
                aria-label="Next text match"
                disabled={!pdfMatches.total}
                onClick={() => onSearchPdf(searched, false, true)}
                className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setTerm("");
              setSearched("");
              onSearchPdf("");
            }}
            className="mt-3 min-h-11 text-xs font-semibold text-[#7A263A]"
          >
            Clear PDF search
          </button>
        </>
      ) : null}
      <p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-[#6F675E]">
        <BookOpen size={16} className="mt-0.5 shrink-0" />
        Scanned pages without a text layer may not be searchable.
      </p>
    </div>
  );
}

function ReaderNotes({
  currentPage,
  onNavigate,
}: {
  currentPage: number;
  onNavigate: (page: number) => void;
}) {
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<
    { id: number; page: number; text: string }[]
  >([]);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
        <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-[#F3E5E8] text-[#7A263A]">
          <NotebookPen size={21} />
        </span>
        <h2 className="mt-4 font-serif text-xl font-semibold">
          Make the margins yours.
        </h2>
        <p className="mt-2 text-xs leading-6 text-[#6F675E]">
          Notes stay in this open reader only. Closing or reloading clears them;
          they are not synced to your account.
        </p>
        <div className="mt-5 space-y-3">
          {notes.map((note) => (
            <article
              key={note.id}
              className="rounded-xl border border-[#E5DCD0] bg-white p-4"
            >
              <button
                type="button"
                onClick={() => onNavigate(note.page)}
                className="text-xs font-semibold text-[#7A263A]"
              >
                Page {note.page} ↗
              </button>
              <p className="mt-2 whitespace-pre-wrap break-words font-serif text-sm leading-6 text-[#2B2723]">
                {note.text}
              </p>
            </article>
          ))}
          {!notes.length ? (
            <p className="rounded-xl border border-dashed border-[#DED5C8] p-5 text-xs leading-6 text-[#6F675E]">
              A thought worth keeping? Add your first note for page{" "}
              {currentPage}.
            </p>
          ) : null}
        </div>
      </div>
      <form
        className="shrink-0 border-t border-[#E5DCD0] p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          setNotes((current) => [
            ...current,
            { id: Date.now(), page: currentPage, text: draft.trim() },
          ]);
          setDraft("");
        }}
      >
        <label htmlFor="reader-note" className="text-xs font-semibold">
          New note · page {currentPage}
        </label>
        <textarea
          id="reader-note"
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={4000}
          placeholder="Write a note about this page…"
          className="mt-2 w-full resize-none rounded-xl border border-[#DED5C8] bg-white p-3 text-sm leading-6 outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7A263A] text-sm font-semibold text-white disabled:opacity-40"
        >
          <Plus size={16} />
          Save note in this tab
        </button>
      </form>
    </div>
  );
}
