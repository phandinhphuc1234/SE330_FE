"use client";

import { useMemo, useState } from "react";
import {
  Bookmark,
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  X,
} from "lucide-react";
import {
  activeReaderSection,
  filterReaderOutline,
  type ReaderOutlineItem,
} from "./readerNavigation";
import styles from "./reader.module.css";

type Props = {
  items: ReaderOutlineItem[];
  page: number;
  totalPages: number;
  bookmarks: number[];
  onNavigate: (page: number) => void;
  onClose: () => void;
};

export function ReaderContents({
  items,
  page,
  totalPages,
  bookmarks,
  onNavigate,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const filtered = useMemo(
    () => filterReaderOutline(items, query),
    [items, query],
  );
  const active = activeReaderSection(items, page)?.id;
  function renderItems(entries: ReaderOutlineItem[], depth = 0) {
    return entries.map((item) => (
      <li key={item.id}>
        <div
          className={`${styles.contentsRow} ${active === item.id ? styles.activeChapter : ""}`}
          style={{ paddingInlineStart: 12 + Math.min(depth, 6) * 14 }}
        >
          {item.items.length ? (
            <button
              type="button"
              aria-label={`Toggle ${item.title}`}
              aria-expanded={query ? true : !collapsed.has(item.id)}
              onClick={() =>
                setCollapsed((current) => {
                  const next = new Set(current);
                  if (next.has(item.id)) next.delete(item.id);
                  else next.add(item.id);
                  return next;
                })
              }
              className={styles.chapterExpand}
            >
              {!collapsed.has(item.id) || query ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          ) : (
            <span className={styles.chapterDot} aria-hidden="true">
              ·
            </span>
          )}
          <button
            type="button"
            disabled={item.page == null}
            onClick={() => item.page != null && onNavigate(item.page)}
            aria-current={active === item.id ? "page" : undefined}
            className={styles.chapterLink}
          >
            <span>{item.title}</span>
            <span className={styles.chapterPage}>{item.page ?? "—"}</span>
          </button>
        </div>
        {item.items.length && (query || !collapsed.has(item.id)) ? (
          <ul>{renderItems(item.items, depth + 1)}</ul>
        ) : null}
      </li>
    ));
  }
  const requestedPage = Number(query.replace(/^page\s*/i, ""));
  const fallbackPages = query.trim()
    ? Number.isInteger(requestedPage) &&
      requestedPage > 0 &&
      requestedPage <= totalPages
      ? [requestedPage]
      : []
    : Array.from(
        { length: Math.min(totalPages, 500) },
        (_, index) => index + 1,
      );
  return (
    <div className={styles.contentsInner}>
      <header className={styles.contentsHeader}>
        <div>
          <p className={styles.railEyebrow}>YOUR READING MAP</p>
          <h2 className="font-serif">Contents</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close contents"
          className={styles.darkIconButton}
        >
          <X size={19} />
        </button>
      </header>
      <label className={styles.contentsSearch}>
        <Search size={16} aria-hidden="true" />
        <input
          aria-label="Search contents"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={items.length ? "Find a chapter…" : "Go to page…"}
        />
      </label>
      <div className={styles.contentsScroll}>
        {items.length ? (
          <ul className={styles.outlineList}>{renderItems(filtered)}</ul>
        ) : (
          <>
            <p className={styles.outlineHint}>
              <FileText size={15} aria-hidden="true" />
              This PDF has no chapter bookmarks. Browse its original pages
              below.
            </p>
            <ul className={styles.outlineList}>
              {fallbackPages.map((number) => (
                <li key={number}>
                  <button
                    type="button"
                    onClick={() => onNavigate(number)}
                    aria-current={number === page ? "page" : undefined}
                    className={`${styles.pageLink} ${number === page ? styles.activeChapter : ""}`}
                  >
                    <span>Page {number}</span>
                    <span>{number}</span>
                  </button>
                </li>
              ))}
            </ul>
            {totalPages > 500 && !query ? (
              <p className={styles.outlineHint}>
                Showing the first 500 pages. Enter any page number above.
              </p>
            ) : null}
          </>
        )}
        {(items.length ? !filtered.length : !fallbackPages.length) &&
        totalPages > 0 ? (
          <p className={styles.outlineHint}>No matching section or page.</p>
        ) : null}
        {bookmarks.length ? (
          <div className={styles.bookmarkList}>
            <p>
              <Bookmark size={14} /> Bookmarks · this tab
            </p>
            {bookmarks.map((number) => (
              <button
                type="button"
                key={number}
                onClick={() => onNavigate(number)}
              >
                Page {number}
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <footer className={styles.contentsFooter}>
        <span>READING PROGRESS</span>
        <strong>
          {totalPages ? Math.round((page / totalPages) * 100) : 0}%
        </strong>
        <div>
          <span
            style={{ width: `${totalPages ? (page / totalPages) * 100 : 0}%` }}
          />
        </div>
        <p>
          Page {page} of {totalPages || "—"}
        </p>
      </footer>
    </div>
  );
}
