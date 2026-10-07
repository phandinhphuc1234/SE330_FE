"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { TableSkeleton } from "@/components/ui/TableRowSkeleton";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Book, BookSearchParams, Category } from "../types/catalog.type";
import { deleteBook, getBooks, getCategories } from "../services/catalogService";
import {
  authorLabel,
  availabilityLabel,
  bookCoverAlt,
  bookCoverUrl,
  bookIdOf,
  categoryLabel,
  entityIdOf,
} from "./catalogHelpers";
import { CatalogShell, Notice } from "./CatalogShell";
import { compareText, downloadCsv, SortDirection } from "./tableUtilities";

type BookSortKey = "title" | "isbn" | "authors" | "category" | "language" | "copies";

type StaffBooksPageProps = {
  mode?: "staff" | "admin";
  initialQuery?: string;
};

const STAFF_BOOKS_PER_PAGE = "12";

function createStaffBookFilters(query = ""): BookSearchParams {
  return {
    q: query.trim(),
    page: "0",
    size: STAFF_BOOKS_PER_PAGE,
    sort: "title,asc",
  };
}

export function StaffBooksPage({ mode = "staff", initialQuery = "" }: StaffBooksPageProps) {
  const { accessToken } = useAuth();
  const normalizedInitialQuery = initialQuery.trim();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<BookSearchParams>(() => createStaffBookFilters(normalizedInitialQuery));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pageInfo, setPageInfo] = useState({ page: 0, totalElements: 0, totalPages: 1 });
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [tableSort, setTableSort] = useState<{ key: BookSortKey; direction: SortDirection }>({
    key: "title",
    direction: "asc",
  });
  const filterFormRef = useRef<HTMLFormElement | null>(null);
  const filterTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getBooks(filters), getCategories().catch(() => [])])
      .then(([bookPage, categoryList]) => {
        if (!isMounted) return;

        setBooks(bookPage.items);
        setPageInfo({
          page: bookPage.page ?? Number(filters.page ?? 0),
          totalElements: bookPage.totalElements ?? bookPage.items.length,
          totalPages: bookPage.totalPages ?? 1,
        });
        setCategories(categoryList);
        setSelectedBookIds((selectedIds) =>
          selectedIds.filter((id) => bookPage.items.some((book) => bookIdOf(book) === id)),
        );
        setError("");
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Could not load books.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filters, message]);

  useEffect(() => {
    return () => {
      if (filterTimerRef.current) {
        window.clearTimeout(filterTimerRef.current);
      }
    };
  }, []);

  function buildFilters(form: HTMLFormElement): BookSearchParams {
    const formData = new FormData(form);

    return {
      q: String(formData.get("q") ?? ""),
      author: String(formData.get("author") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      availableOnly: formData.get("availableOnly") ? "true" : "",
      language: String(formData.get("language") ?? ""),
      page: "0",
      size: STAFF_BOOKS_PER_PAGE,
      sort: String(formData.get("sort") ?? "title,asc"),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (filterTimerRef.current) {
      window.clearTimeout(filterTimerRef.current);
      filterTimerRef.current = null;
    }

    setIsLoading(true);
    setFilters(buildFilters(event.currentTarget));
  }

  function handleFilterChange() {
    const form = filterFormRef.current;
    if (!form) return;

    if (filterTimerRef.current) {
      window.clearTimeout(filterTimerRef.current);
    }

    filterTimerRef.current = window.setTimeout(() => {
      setIsLoading(true);
      setFilters(buildFilters(form));
      filterTimerRef.current = null;
    }, 350);
  }

  function handleResetFilters() {
    if (filterTimerRef.current) {
      window.clearTimeout(filterTimerRef.current);
      filterTimerRef.current = null;
    }

    filterFormRef.current?.reset();
    setShowAdvancedFilters(false);
    setIsLoading(true);
    setFilters(createStaffBookFilters());
  }

  function handlePageChange(nextPage: number) {
    const page = Math.max(0, Math.min(nextPage, Math.max(pageInfo.totalPages - 1, 0)));

    if (filterTimerRef.current) {
      window.clearTimeout(filterTimerRef.current);
      filterTimerRef.current = null;
    }

    setIsLoading(true);
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: String(page),
      size: STAFF_BOOKS_PER_PAGE,
    }));
  }

  async function handleDelete(book: Book) {
    const id = bookIdOf(book);
    if (!id || !window.confirm(`Delete "${book.title}"? Backend will reject this if active copies are borrowed or reserved.`)) return;

    try {
      await deleteBook(id, accessToken);
      setMessage(`Deleted ${book.title}.`);
      setError("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete book.");
    }
  }

  const isAdmin = mode === "admin";

  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      const valueOf = (book: Book) => {
        switch (tableSort.key) {
          case "authors":
            return (book.authors ?? []).map(authorLabel).join(", ");
          case "category":
            return categoryLabel(book.category);
          case "copies":
            return book.availableCopies ?? 0;
          default:
            return book[tableSort.key] ?? "";
        }
      };

      return compareText(valueOf(a), valueOf(b), tableSort.direction);
    });
  }, [books, tableSort]);

  const selectedBooks = sortedBooks.filter((book) => selectedBookIds.includes(bookIdOf(book)));
  const allVisibleSelected = sortedBooks.length > 0 && sortedBooks.every((book) => selectedBookIds.includes(bookIdOf(book)));
  const currentPage = Number(filters.page ?? pageInfo.page ?? 0);
  const totalPages = Math.max(pageInfo.totalPages || 1, 1);
  const paginationPages = buildPaginationPages(currentPage, totalPages);

  const activeFilters = [
    filters.q ? `Search: ${filters.q}` : "",
    filters.author ? `Author: ${filters.author}` : "",
    filters.categoryId
      ? `Category: ${categories.find((category) => entityIdOf(category) === filters.categoryId)?.name ?? filters.categoryId}`
      : "",
    filters.availableOnly ? "Available only" : "",
    filters.language ? `Language: ${filters.language}` : "",
  ].filter(Boolean);

  const hasAdvancedFilters = Boolean(filters.author);

  function updateSort(key: BookSortKey) {
    setTableSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function toggleBookSelection(bookId: string) {
    setSelectedBookIds((current) => (current.includes(bookId) ? current.filter((id) => id !== bookId) : [...current, bookId]));
  }

  function toggleVisibleSelection() {
    setSelectedBookIds(allVisibleSelected ? [] : sortedBooks.map(bookIdOf).filter(Boolean));
  }

  function exportBooks(target: Book[]) {
    downloadCsv(
      `${isAdmin ? "admin" : "staff"}-books.csv`,
      ["Title", "ISBN", "Authors", "Category", "Language", "Copies"],
      target.map((book) => [
        book.title,
        book.isbn,
        (book.authors ?? []).map(authorLabel).join(", "),
        categoryLabel(book.category),
        book.language || "",
        availabilityLabel(book),
      ]),
    );
  }

  async function handleBulkDelete() {
    if (!isAdmin || !selectedBooks.length) return;
    if (!window.confirm(`Delete ${selectedBooks.length} selected book records? Backend will reject records with active borrowed or reserved copies.`)) return;

    try {
      await Promise.all(selectedBooks.map((book) => deleteBook(bookIdOf(book), accessToken)));
      setMessage(`Deleted ${selectedBooks.length} selected book records.`);
      setSelectedBookIds([]);
      setError("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete selected books.");
    }
  }

  return (
    <CatalogShell
      protectedPage
      wide
      catalogPanel
      compactPanelHeader
      eyebrow={isAdmin ? "Admin catalog" : "Staff catalog"}
      title={isAdmin ? "Book Administration" : "Book Management"}
      description="Search, review, and manage book records, copies, authors, and catalog availability."
      actions={<StaffHeaderActions isAdmin={isAdmin} />}
    >
      <form
        ref={filterFormRef}
        onSubmit={handleSubmit}
        onChange={handleFilterChange}
        className="mt-6 rounded-3xl border border-[#E5E8F0] bg-white/92 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-md"
      >
        <div className="flex w-full flex-wrap gap-3 xl:flex-nowrap xl:items-center">
          <label className="relative min-w-0 basis-full xl:flex-1 xl:basis-0">
            <span className="sr-only">Search title, ISBN, or author</span>
            <Icon name="search" size={21} aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#5F6B85]" />
            <input
              name="q"
              defaultValue={normalizedInitialQuery}
              placeholder="Search by title, ISBN, author..."
              className="h-14 w-full rounded-2xl border border-[#D5DBE8] bg-white pl-14 pr-5 text-base text-[#2B2723] outline-none transition placeholder:text-[#7B8498] focus:border-[#2B2723] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]"
            />
          </label>

          <label className="relative min-w-0 basis-full xl:w-40 xl:flex-none xl:basis-auto">
            <span className="sr-only">Filter by category</span>
            <select
              name="categoryId"
              className="h-14 w-full appearance-none rounded-2xl border border-[#D5DBE8] bg-white px-5 pr-11 text-sm font-bold text-[#2B2723] outline-none transition focus:border-[#2B2723] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={entityIdOf(category)} value={entityIdOf(category)}>
                  {category.name}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={18} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#2B2723]" />
          </label>

          <label className="relative min-w-0 basis-full xl:w-40 xl:flex-none xl:basis-auto">
            <span className="sr-only">Filter by language</span>
            <select
              name="language"
              className="h-14 w-full appearance-none rounded-2xl border border-[#D5DBE8] bg-white px-5 pr-11 text-sm font-bold text-[#2B2723] outline-none transition focus:border-[#2B2723] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]"
            >
              <option value="">All languages</option>
              <option value="en">English</option>
              <option value="vi">Vietnamese</option>
            </select>
            <Icon name="chevron-down" size={18} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#2B2723]" />
          </label>

          <label className="relative min-w-0 basis-full xl:w-36 xl:flex-none xl:basis-auto">
            <span className="sr-only">Sort catalog</span>
            <select
              name="sort"
              defaultValue="title,asc"
              className="h-14 w-full appearance-none rounded-2xl border border-[#D5DBE8] bg-white px-5 pr-11 text-sm font-bold text-[#2B2723] outline-none transition focus:border-[#2B2723] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]"
            >
              <option value="title,asc">Sort: A-Z</option>
              <option value="publishedDate,desc">Newest first</option>
            </select>
            <Icon name="chevron-down" size={18} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#2B2723]" />
          </label>

          <label className="relative min-w-0 basis-full xl:w-44 xl:flex-none xl:basis-auto">
            <span className="sr-only">Filter by availability</span>
            <select
              name="availableOnly"
              className="h-14 w-full appearance-none rounded-2xl border border-[#D5DBE8] bg-white px-5 pr-11 text-sm font-bold text-[#2B2723] outline-none transition focus:border-[#2B2723] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]"
            >
              <option value="">Availability: All</option>
              <option value="true">Available only</option>
            </select>
            <Icon name="chevron-down" size={18} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#2B2723]" />
          </label>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters((current) => !current)}
            aria-pressed={showAdvancedFilters || hasAdvancedFilters}
            className="inline-flex h-14 min-w-0 basis-full items-center justify-center gap-2 rounded-2xl border border-[#D5DBE8] bg-white px-4 text-sm font-bold text-[#2B2723] transition hover:border-[#2B2723] hover:bg-[#FBF8F1] xl:w-32 xl:flex-none xl:basis-auto"
          >
            <Icon name="filter" size={20} aria-hidden="true" />
            Filters
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex h-14 min-w-0 basis-full items-center justify-center gap-2 rounded-2xl bg-[#050816] px-4 text-sm font-bold text-white shadow-[0_14px_28px_rgba(5,8,22,0.24)] transition hover:-translate-y-0.5 hover:bg-black xl:w-28 xl:flex-none xl:basis-auto"
          >
            <Icon name="arrow-left" size={18} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className={`${showAdvancedFilters || hasAdvancedFilters ? "mt-4 grid gap-3 rounded-2xl border border-[#E5E8F0] bg-[#FBF8F1] p-4 md:grid-cols-2" : "hidden"}`}>
          <label className="min-w-0">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-[#647089]">Author</span>
            <input
              name="author"
              placeholder="Find author..."
              className="h-12 w-full rounded-xl border border-[#D5DBE8] bg-white px-4 text-sm outline-none transition focus:border-[#2B2723] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]"
            />
          </label>

          <label className="min-w-0">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-[#647089]">ISBN</span>
            <input
              name="isbn"
              disabled
              placeholder="Use the main search for ISBN"
              className="h-12 w-full rounded-xl border border-[#D5DBE8] bg-white px-4 text-sm text-[#647089] outline-none disabled:bg-white/70"
            />
          </label>
        </div>

        {activeFilters.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#E5E8F0] pt-4" aria-label="Active filters">
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span key={filter} className="rounded-full border border-[#D5DBE8] bg-[#FBF8F1] px-3 py-1.5 text-xs font-bold text-[#2B2723]">
                  {filter}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-[#7A263A] transition hover:bg-[#7A263A]/8"
            >
              <Icon name="x" size={14} aria-hidden="true" />
              Clear all
            </button>
          </div>
        ) : null}
      </form>

      <div className="mt-5 grid gap-3">
        {message && <Notice tone="success" message={message} />}
        {error && <Notice tone="error" message={error} />}
      </div>

      {!isLoading && books.length ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EEF3FF] text-[#3454D1]">
              <Icon name="file" size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#61708F]">Catalog result</p>
              <p className="text-lg font-black text-[#171412]">{pageInfo.totalElements || books.length} books found</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              defaultValue=""
              onChange={(event) => {
                if (event.currentTarget.value === "export-selected" && selectedBooks.length) {
                  exportBooks(selectedBooks);
                }

                if (event.currentTarget.value === "delete-selected") {
                  void handleBulkDelete();
                }

                event.currentTarget.value = "";
              }}
              className="h-11 rounded-2xl border border-[#D5DBE8] bg-white px-5 text-sm font-bold text-[#2B2723] outline-none transition hover:border-[#2B2723]"
            >
              <option value="">Bulk actions</option>
              <option value="export-selected" disabled={!selectedBooks.length}>
                Export selected
              </option>
              {isAdmin ? (
                <option value="delete-selected" disabled={!selectedBooks.length}>
                  Delete selected
                </option>
              ) : null}
            </select>

            <button
              type="button"
              onClick={() => exportBooks(sortedBooks)}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#D5DBE8] bg-white px-5 text-sm font-bold text-[#2B2723] transition hover:border-[#2B2723]"
            >
              <Icon name="download" size={18} aria-hidden="true" />
              Export visible
            </button>

            {isAdmin ? (
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={!selectedBooks.length}
                className="h-11 rounded-2xl border border-rose-200 px-5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete selected
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-6">
          <TableSkeleton rows={8} columns={8} />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#E5E8F0] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <table className="w-full min-w-[1180px] border-collapse bg-white text-left text-sm">
            <thead className="bg-[#F6F8FC] text-[#171412]">
              <tr>
                <th className="w-12 px-5 py-4">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleVisibleSelection}
                    aria-label="Select all visible books"
                    className="h-4 w-4 rounded border-[#C8D0DF] accent-[#7A263A]"
                  />
                </th>
                <th className="px-5 py-4">
                  <StaffSortableHeader active={tableSort.key === "title"} direction={tableSort.direction} onClick={() => updateSort("title")}>
                    Book
                  </StaffSortableHeader>
                </th>
                <th className="px-5 py-4">
                  <StaffSortableHeader active={tableSort.key === "isbn"} direction={tableSort.direction} onClick={() => updateSort("isbn")}>
                    ISBN
                  </StaffSortableHeader>
                </th>
                <th className="px-5 py-4">
                  <StaffSortableHeader active={tableSort.key === "category"} direction={tableSort.direction} onClick={() => updateSort("category")}>
                    Category
                  </StaffSortableHeader>
                </th>
                <th className="px-5 py-4">
                  <StaffSortableHeader active={tableSort.key === "language"} direction={tableSort.direction} onClick={() => updateSort("language")}>
                    Language
                  </StaffSortableHeader>
                </th>
                <th className="px-5 py-4">
                  <StaffSortableHeader active={tableSort.key === "copies"} direction={tableSort.direction} onClick={() => updateSort("copies")}>
                    Copies
                  </StaffSortableHeader>
                </th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="min-w-[250px] px-5 py-4 font-bold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedBooks.map((book) => {
                const id = bookIdOf(book);
                const available = book.availableCopies ?? 0;
                const total = book.totalCopies ?? 0;

                return (
                  <tr key={id || book.isbn} className="border-t border-[#E5E8F0] align-middle transition hover:bg-[#FAFBFE]">
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedBookIds.includes(id)}
                        disabled={!id}
                        onChange={() => toggleBookSelection(id)}
                        aria-label={`Select ${book.title}`}
                        className="h-4 w-4 rounded border-[#C8D0DF] accent-[#7A263A]"
                      />
                    </td>

                    <td className="px-5 py-3">
                      <StaffBookIdentity book={book} href={id ? `/staff/books/${id}/edit` : undefined} />
                    </td>

                    <td className="px-5 py-3 font-medium text-[#171412]">{book.isbn}</td>
                    <td className="px-5 py-3">
                      <CategoryPill label={categoryLabel(book.category)} />
                    </td>
                    <td className="px-5 py-3 font-medium text-[#171412]">{book.language || "N/A"}</td>
                    <td className="px-5 py-3">
                      <CopiesMeter available={available} total={total} />
                    </td>
                    <td className="px-5 py-3">
                      <AvailabilityPill available={available > 0} />
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                        <Link
                          href={`/staff/books/${id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#E0E5EF] px-3 py-2 font-bold text-[#171412] transition hover:border-[#2B2723]"
                        >
                          <Icon name="edit" size={16} aria-hidden="true" />
                          Edit
                        </Link>

                        <Link
                          href={isAdmin ? `/admin/books/${id}/copies` : `/staff/books/${id}/copies`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#E0E5EF] px-3 py-2 font-bold text-[#171412] transition hover:border-[#2B2723]"
                        >
                          <Icon name="book" size={16} aria-hidden="true" />
                          Copies
                        </Link>

                        <button
                          type="button"
                          onClick={() => exportBooks([book])}
                          className="grid h-9 w-9 place-items-center rounded-full text-[#171412] transition hover:bg-[#F1F4F9]"
                          aria-label={`Export ${book.title}`}
                        >
                          <Icon name="download" size={17} aria-hidden="true" />
                        </button>

                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(book)}
                            className="grid h-9 w-9 place-items-center rounded-full text-rose-700 transition hover:bg-rose-50"
                            aria-label={`Delete ${book.title}`}
                          >
                            <Icon name="trash" size={17} aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !books.length && (
        <div className="mt-6">
          <Notice message="No catalog records found." />
        </div>
      )}

      {!isLoading && books.length ? (
        <PaginationBar
          currentPage={currentPage}
          pages={paginationPages}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      ) : null}
    </CatalogShell>
  );
}

function StaffHeaderActions({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-wrap gap-4">
      <Link
        href="/staff/books/new"
        className="inline-flex h-14 items-center gap-3 rounded-2xl bg-[#7A263A] px-7 text-sm font-black text-white shadow-[0_18px_34px_rgba(230,0,40,0.24)] transition hover:-translate-y-0.5 hover:bg-[#5A1C2B]"
      >
        <Icon name="plus" size={21} aria-hidden="true" />
        Create Book
      </Link>

      <Link
        href="/staff/books/import"
        className="inline-flex h-14 items-center gap-3 rounded-2xl border border-[#D5DBE8] bg-white px-7 text-sm font-black text-[#2B2723] transition hover:-translate-y-0.5 hover:border-[#2B2723]"
      >
        <Icon name="upload" size={21} aria-hidden="true" />
        Import CSV
      </Link>

      <Link
        href={isAdmin ? "/admin/categories" : "/staff/authors"}
        className="inline-flex h-14 items-center gap-3 rounded-2xl border border-[#D5DBE8] bg-white px-7 text-sm font-black text-[#2B2723] transition hover:-translate-y-0.5 hover:border-[#2B2723]"
      >
        <Icon name="users" size={21} aria-hidden="true" />
        {isAdmin ? "Categories" : "Authors"}
      </Link>
    </div>
  );
}

function StaffBookIdentity({ book, href }: { book: Book; href?: string }) {
  const coverUrl = bookCoverUrl(book, "thumbnail");

  const content = (
    <>
      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-[#EEF1F6] ring-1 ring-black/5">
        {coverUrl ? (
          <Image src={coverUrl} alt={bookCoverAlt(book)} fill unoptimized sizes="44px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#2B2723] text-white">
            <Icon name="book-open" size={20} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="line-clamp-1 font-black text-[#171412] transition group-hover:text-[#7A263A]">{book.title}</p>
        <p className="mt-1 line-clamp-1 text-sm font-medium text-[#61708F]">
          {(book.authors ?? []).map(authorLabel).join(", ") || "N/A"}
        </p>
      </div>
    </>
  );

  if (!href) {
    return <div className="flex items-center gap-4">{content}</div>;
  }

  return (
    <Link
      href={href}
      aria-label={`Edit ${book.title}`}
      className="group flex items-center gap-4 rounded-xl outline-none transition focus-visible:ring-4 focus-visible:ring-[#7A263A]/20"
    >
      {content}
    </Link>
  );
}

function CategoryPill({ label }: { label: string }) {
  const palette = categoryPalette(label);

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${palette}`}>{label}</span>;
}

function AvailabilityPill({ available }: { available: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${available ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
        }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-emerald-500" : "bg-rose-500"}`} />
      {available ? "Available" : "Unavailable"}
    </span>
  );
}

function CopiesMeter({ available, total }: { available: number; total: number }) {
  const progress = total > 0 ? Math.max(0, Math.min(100, (available / total) * 100)) : 0;
  const borrowed = Math.max(total - available, 0);

  return (
    <div className="min-w-32">
      <p className="font-black text-[#171412]">
        {available} / {total}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E5E8F0]">
        <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1 text-xs font-medium text-[#61708F]">{borrowed ? `${borrowed} borrowed` : "All available"}</p>
    </div>
  );
}

function StaffSortableHeader({
  active,
  children,
  direction,
  onClick,
}: {
  active: boolean;
  children: string;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg py-1 text-left font-black text-[#171412] transition hover:text-[#7A263A] focus:outline-none focus:ring-2 focus:ring-[#7A263A]/30"
      aria-label={`Sort by ${children}${active ? `, currently ${direction === "asc" ? "ascending" : "descending"}` : ""}`}
    >
      <span>{children}</span>
      <span aria-hidden="true" className={`text-xs transition ${active ? "opacity-100" : "opacity-45"}`}>
        {active && direction === "desc" ? "↓" : "↑"}
      </span>
    </button>
  );
}

function categoryPalette(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("physics") || normalized.includes("science")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized.includes("fantasy")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (normalized.includes("history") || normalized.includes("historical")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized.includes("literature") || normalized.includes("classic")) {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (normalized.includes("dev") || normalized.includes("agile") || normalized.includes("tech")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function buildPaginationPages(currentPage: number, totalPages: number) {
  const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
  const end = Math.min(totalPages, start + 5);

  return Array.from({ length: end - start }, (_, index) => start + index);
}

function PaginationBar({
  currentPage,
  pages,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  pages: number[];
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav className="mt-8 flex justify-center rounded-2xl border border-[#DED5C8] bg-white px-5 py-4 shadow-sm" aria-label="Books pagination">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 0}
          className="rounded-full border border-[#D8CCBC] px-4 py-2 text-sm font-bold text-[#2B2723] transition hover:border-[#7A263A] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Previous
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition ${page === currentPage
                ? "bg-[#7A263A] text-white shadow-lg shadow-[#7A263A]/20"
                : "border border-[#D8CCBC] text-[#2B2723] hover:border-[#7A263A]"
              }`}
          >
            {page + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="rounded-full border border-[#D8CCBC] px-4 py-2 text-sm font-bold text-[#2B2723] transition hover:border-[#7A263A] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
        </button>
      </div>
    </nav>
  );
}