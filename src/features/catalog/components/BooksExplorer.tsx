"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { StarRating } from "@/features/review/components/StarRating";
import { getBooks, getCategories } from "../services/catalogService";
import { Book, BookSearchParams, Category } from "../types/catalog.type";
import { authorLabel, bookCoverAlt, bookCoverUrl, bookIdOf, categoryLabel, entityIdOf } from "./catalogHelpers";
import { Notice } from "./CatalogShell";

const BOOKS_PER_PAGE = "20";
const DEFAULT_SORT = "title,asc";

const copyKeys = [
  "eyebrow", "title", "description", "heroQuote", "searchLabel", "searchPlaceholder", "search", "all",
  "availableNow", "newArrivals", "sortAz", "sortZa", "trendingTopics", "trendingDescription", "refineSearch",
  "resetAll", "category", "allCategories", "showMore", "showLess", "availability", "availableOnly", "author",
  "authorPlaceholder", "language", "languagePlaceholder", "sortBy", "relevance", "newest", "titlesFound",
  "oneTitleFound", "filters", "hideFilters", "activeFilters", "clearFilters", "searchFilter", "authorFilter",
  "categoryFilter", "languageFilter", "viewDetails", "unknownAuthor", "copiesAvailable", "unavailable", "previous",
  "next", "showing", "of", "titles", "noBooksTitle", "noBooksDescription",
] as const;

type CopyKey = (typeof copyKeys)[number];
type BooksExplorerCopy = Record<CopyKey, string>;

function createCopy(values: string): BooksExplorerCopy {
  const entries = values.trim().split("\n").map((value) => value.trim());
  return Object.fromEntries(copyKeys.map((key, index) => [key, entries[index] ?? key])) as BooksExplorerCopy;
}

const booksExplorerCopy = {
  en: createCopy(`
Library catalog
Find your next source
Search public book records, explore curated collections, and check availability before you visit the library.
A more curious world awaits.
Search books
Search by title, author, subject, or ISBN...
Search
All
Available now
New arrivals
A–Z
Z–A
Trending topics
Explore popular subjects at The Athenaeum.
Refine your search
Reset all
Category
All categories
Show more
Show less
Availability
Available now
Author
Filter by author
Language
English, Vietnamese...
Sort by
Title A–Z
Newest
titles found
title found
Filters
Hide filters
Active filters
Clear all filters
Search
Author
Category
Language
View details
Unknown author
copies available
Currently unavailable
Previous
Next
Showing
of
titles
No books found
We couldn't find any books matching your search. Try adjusting the filters or using another keyword.`),
  vi: createCopy(`
Danh mục thư viện
Tìm nguồn tài liệu tiếp theo
Tìm kiếm sách, khám phá các bộ sưu tập chọn lọc và kiểm tra tình trạng trước khi đến thư viện.
Một thế giới tò mò hơn đang chờ bạn.
Tìm sách
Tìm theo tên sách, tác giả, chủ đề hoặc ISBN...
Tìm kiếm
Tất cả
Có sẵn
Sách mới
A–Z
Z–A
Chủ đề nổi bật
Khám phá các chủ đề được quan tâm tại The Athenaeum.
Tinh chỉnh tìm kiếm
Đặt lại
Danh mục
Tất cả danh mục
Xem thêm
Thu gọn
Tình trạng
Đang có sẵn
Tác giả
Lọc theo tác giả
Ngôn ngữ
Tiếng Việt, English...
Sắp xếp
Tên A–Z
Mới nhất
đầu sách được tìm thấy
đầu sách được tìm thấy
Bộ lọc
Ẩn bộ lọc
Bộ lọc đang dùng
Xóa tất cả bộ lọc
Tìm kiếm
Tác giả
Danh mục
Ngôn ngữ
Xem chi tiết
Chưa rõ tác giả
bản có sẵn
Hiện chưa có sẵn
Trước
Sau
Đang hiển thị
trong
đầu sách
Không tìm thấy sách
Không có sách nào khớp với tìm kiếm. Hãy thử đổi bộ lọc hoặc dùng từ khóa khác.`),
};

const topicTones = [
  "from-[#7A263A]/75 via-[#AA6C5B]/45 to-[#E8D5BE]",
  "from-[#294C46]/75 via-[#708B6D]/45 to-[#E6DDC6]",
  "from-[#8A6338]/70 via-[#C2A37A]/45 to-[#F0E3D0]",
  "from-[#4B5267]/70 via-[#8A91A3]/40 to-[#E5DED3]",
  "from-[#6A4935]/70 via-[#A88670]/45 to-[#ECE0D0]",
  "from-[#604252]/70 via-[#A67A8B]/45 to-[#EDDDD9]",
];

type BooksExplorerProps = Readonly<{ initialQuery?: string }>;

function createBaseFilters(query = ""): BookSearchParams {
  return { q: query.trim(), page: "0", size: BOOKS_PER_PAGE, sort: DEFAULT_SORT };
}

function buildActiveFilters(filters: BookSearchParams, categories: Category[], copy: BooksExplorerCopy) {
  const labels: string[] = [];
  if (filters.q) labels.push(`${copy.searchFilter}: ${filters.q}`);
  if (filters.author) labels.push(`${copy.authorFilter}: ${filters.author}`);
  if (filters.categoryId) {
    const categoryName = categories.find((category) => entityIdOf(category) === filters.categoryId)?.name;
    labels.push(`${copy.categoryFilter}: ${categoryName ?? filters.categoryId}`);
  }
  if (filters.availableOnly) labels.push(copy.availableOnly);
  if (filters.language) labels.push(`${copy.languageFilter}: ${filters.language}`);
  return labels;
}

function titlesFoundLabel(totalElements: number, copy: BooksExplorerCopy) {
  return `${totalElements.toLocaleString()} ${totalElements === 1 ? copy.oneTitleFound : copy.titlesFound}`;
}

function useCatalogData(filters: BookSearchParams) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pageInfo, setPageInfo] = useState({ page: 0, totalElements: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const [bookPage, categoryList] = await Promise.all([getBooks(filters), getCategories().catch(() => [])]);
        if (!active) return;
        setBooks(bookPage.items);
        setCategories(categoryList);
        setPageInfo({
          page: bookPage.page ?? Number(filters.page ?? 0),
          totalElements: bookPage.totalElements ?? bookPage.items.length,
          totalPages: bookPage.totalPages ?? 1,
        });
        setError("");
      } catch (fetchError) {
        if (active) setError(fetchError instanceof Error ? fetchError.message : "Could not load books.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadCatalog();
    return () => {
      active = false;
    };
  }, [filters]);

  return {
    books,
    categories,
    error,
    isLoading,
    pageInfo,
    setIsLoading,
  };
}

export function BooksExplorer({ initialQuery = "" }: BooksExplorerProps) {
  const { locale } = useLanguage();
  const copy = booksExplorerCopy[locale];
  const normalizedInitialQuery = initialQuery.trim();
  const [filters, setFilters] = useState<BookSearchParams>(() => createBaseFilters(normalizedInitialQuery));
  const [draftFilters, setDraftFilters] = useState<BookSearchParams>(() => createBaseFilters(normalizedInitialQuery));
  const { books, categories, error, isLoading, pageInfo, setIsLoading } = useCatalogData(filters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setIsLoading(true);
      setFilters({ ...draftFilters, page: "0", size: BOOKS_PER_PAGE });
    }, 350);

    return () => window.clearTimeout(timerId);
  }, [draftFilters, setIsLoading]);

  function updateDraftFilters(patch: Partial<BookSearchParams>) {
    setDraftFilters((current) => ({ ...current, ...patch, page: "0", size: BOOKS_PER_PAGE }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setFilters({ ...draftFilters, page: "0", size: BOOKS_PER_PAGE });
  }

  function handleResetFilters() {
    const resetFilters = createBaseFilters();
    setIsLoading(true);
    setDraftFilters(resetFilters);
    setFilters(resetFilters);
  }

  function handlePageChange(nextPage: number) {
    const page = Math.max(0, Math.min(nextPage, Math.max(pageInfo.totalPages - 1, 0)));
    setIsLoading(true);
    setFilters((current) => ({ ...current, page: String(page), size: BOOKS_PER_PAGE }));
    window.scrollTo({ top: 620, behavior: "smooth" });
  }

  const activeFilters = buildActiveFilters(filters, categories, copy);
  const currentPage = Number(filters.page ?? pageInfo.page ?? 0);
  const totalPages = Math.max(pageInfo.totalPages || 1, 1);
  const paginationPages = buildPaginationPages(currentPage, totalPages);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 6);
  const resultStart = pageInfo.totalElements ? currentPage * Number(BOOKS_PER_PAGE) + 1 : 0;
  const resultEnd = Math.min((currentPage + 1) * Number(BOOKS_PER_PAGE), pageInfo.totalElements);

  return (
    <div className="min-h-dvh bg-[#F7F3EA] text-[#2B2723]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="min-h-[calc(100dvh-4.5rem)] w-full outline-none">
      <section className="relative overflow-hidden border-b border-[#DED5C8] bg-[#F5EFE5]">
        <div className="absolute inset-0 bg-[url('/profile-library-bg.png')] bg-cover bg-[center_34%] opacity-85" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,252,245,0.98)_0%,rgba(255,252,245,0.90)_48%,rgba(255,252,245,0.25)_100%)]" />
        <div className="relative mx-auto flex min-h-[360px] w-full max-w-[90rem] flex-col justify-center px-5 py-12 sm:px-8 lg:px-12">
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="max-w-4xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#7A263A]">{copy.eyebrow}</p>
              <h1 className="mt-4 max-w-3xl font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-[#171412] sm:text-6xl lg:text-7xl">{copy.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#6F675E] sm:text-lg">{copy.description}</p>
            </div>
            <blockquote className="hidden border-l border-[#B8872B] pl-6 font-serif text-2xl italic leading-9 text-[#4D3F35] lg:block">{copy.heroQuote}</blockquote>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 max-w-5xl">
            <label className="flex min-h-16 overflow-hidden rounded-2xl border border-[#D8CCBC] bg-white shadow-[0_18px_50px_rgba(67,48,35,0.13)] focus-within:border-[#7A263A] focus-within:ring-4 focus-within:ring-[#7A263A]/10">
              <span className="sr-only">{copy.searchLabel}</span>
              <span className="grid w-16 shrink-0 place-items-center text-[#7A263A]"><Icon name="search" size={23} aria-hidden="true" /></span>
              <input value={draftFilters.q ?? ""} onChange={(event) => updateDraftFilters({ q: event.target.value })} placeholder={copy.searchPlaceholder} className="min-w-0 flex-1 bg-transparent px-1 text-base text-[#171412] outline-none placeholder:text-[#958A7D]" />
              <button type="submit" className="m-1.5 inline-flex min-w-28 items-center justify-center rounded-xl bg-[#7A263A] px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(122,38,58,0.24)] transition hover:bg-[#5A1C2B] sm:min-w-36">{copy.search}</button>
            </label>
          </form>

          <div className="mt-5 flex flex-wrap gap-2.5" aria-label="Quick filters">
            <QuickFilter active={!activeFilters.length && filters.sort === DEFAULT_SORT} label={copy.all} onClick={handleResetFilters} />
            <QuickFilter active={filters.availableOnly === "true"} label={copy.availableNow} icon="check-circle" onClick={() => updateDraftFilters({ availableOnly: filters.availableOnly === "true" ? "" : "true" })} />
            <QuickFilter active={filters.sort === "publishedDate,desc"} label={copy.newArrivals} icon="sparkles" onClick={() => updateDraftFilters({ sort: "publishedDate,desc" })} />
            <QuickFilter active={filters.sort === DEFAULT_SORT && Boolean(activeFilters.length)} label={copy.sortAz} onClick={() => updateDraftFilters({ sort: DEFAULT_SORT })} />
            <QuickFilter active={filters.sort === "title,desc"} label={copy.sortZa} onClick={() => updateDraftFilters({ sort: "title,desc" })} />
          </div>
        </div>
      </section>

      <section className="border-b border-[#DED5C8] bg-[#FFFCF5]">
        <div className="mx-auto grid w-full max-w-[90rem] gap-5 px-5 py-7 sm:px-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-12">
          <div className="self-center">
            <h2 className="font-serif text-2xl font-semibold text-[#171412]">{copy.trendingTopics}</h2>
            <p className="mt-1.5 text-sm leading-5 text-[#6F675E]">{copy.trendingDescription}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {categories.slice(0, 6).map((category, index) => (
              <TopicCard key={entityIdOf(category)} category={category} imageUrl={findTopicCover(category, books, index)} tone={topicTones[index % topicTones.length]} active={filters.categoryId === entityIdOf(category)} onClick={() => updateDraftFilters({ categoryId: entityIdOf(category) })} />
            ))}
            {!categories.length && Array.from({ length: 6 }).map((_, index) => <TopicSkeleton key={index} />)}
          </div>
        </div>
      </section>

      <section className="bg-[#F7F3EA]">
        <div className="mx-auto w-full max-w-[90rem] px-5 py-9 sm:px-8 lg:px-12 lg:py-12">
          <div className="mb-5 flex items-center justify-between gap-4 lg:hidden">
            <p className="text-sm font-bold text-[#2B2723]">{titlesFoundLabel(pageInfo.totalElements, copy)}</p>
            <button type="button" onClick={() => setShowMobileFilters((current) => !current)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D8CCBC] bg-white px-4 text-sm font-bold text-[#2B2723]">
              <Icon name="filter" size={17} aria-hidden="true" />
              {showMobileFilters ? copy.hideFilters : copy.filters}
            </button>
          </div>

          <div className="grid items-start gap-7 lg:grid-cols-[250px_minmax(0,1fr)]">
            <aside className={`${showMobileFilters ? "block" : "hidden"} rounded-2xl border border-[#DED5C8] bg-[#FFFCF5] p-5 shadow-[0_12px_36px_rgba(43,39,35,0.06)] lg:sticky lg:top-24 lg:block`}>
              <div className="flex items-center justify-between gap-3 border-b border-[#DED5C8] pb-4">
                <h2 className="font-serif text-xl font-semibold text-[#171412]">{copy.refineSearch}</h2>
                <button type="button" onClick={handleResetFilters} className="text-xs font-bold text-[#7A263A] hover:text-[#5A1C2B]">{copy.resetAll}</button>
              </div>

              <FilterSection title={copy.category}>
                <FilterRadio checked={!draftFilters.categoryId} label={copy.allCategories} onChange={() => updateDraftFilters({ categoryId: "" })} />
                {visibleCategories.map((category) => {
                  const categoryId = entityIdOf(category);
                  return <FilterRadio key={categoryId} checked={draftFilters.categoryId === categoryId} label={category.name} onChange={() => updateDraftFilters({ categoryId })} />;
                })}
                {categories.length > 6 ? (
                  <button type="button" onClick={() => setShowAllCategories((current) => !current)} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#7A263A]">
                    {showAllCategories ? copy.showLess : copy.showMore}
                    <Icon name={showAllCategories ? "chevron-up" : "chevron-down"} size={14} aria-hidden="true" />
                  </button>
                ) : null}
              </FilterSection>

              <FilterSection title={copy.availability}>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-[#4D463F]">
                  <input type="checkbox" checked={draftFilters.availableOnly === "true"} onChange={(event) => updateDraftFilters({ availableOnly: event.target.checked ? "true" : "" })} className="h-4 w-4 rounded accent-[#7A263A]" />
                  <span>{copy.availableOnly}</span>
                </label>
              </FilterSection>

              <FilterSection title={copy.author}>
                <input value={draftFilters.author ?? ""} onChange={(event) => updateDraftFilters({ author: event.target.value })} placeholder={copy.authorPlaceholder} className="h-11 w-full rounded-xl border border-[#D8CCBC] bg-white px-3 text-sm outline-none focus:border-[#7A263A] focus:ring-2 focus:ring-[#7A263A]/10" />
              </FilterSection>

              <FilterSection title={copy.language} last>
                <input value={draftFilters.language ?? ""} onChange={(event) => updateDraftFilters({ language: event.target.value })} placeholder={copy.languagePlaceholder} className="h-11 w-full rounded-xl border border-[#D8CCBC] bg-white px-3 text-sm outline-none focus:border-[#7A263A] focus:ring-2 focus:ring-[#7A263A]/10" />
              </FilterSection>
            </aside>

            <div className="min-w-0">
              <div className="flex flex-col gap-4 border-b border-[#DED5C8] pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#171412]">{titlesFoundLabel(pageInfo.totalElements, copy)}</h2>
                  {activeFilters.length ? (
                    <div className="mt-2 flex flex-wrap gap-2" aria-label={copy.activeFilters}>
                      {activeFilters.map((filter) => <span key={filter} className="rounded-full bg-[#EFE6D8] px-3 py-1 text-[11px] font-bold text-[#6A2639]">{filter}</span>)}
                      <button type="button" onClick={handleResetFilters} className="text-[11px] font-bold text-[#7A263A] underline underline-offset-4">{copy.clearFilters}</button>
                    </div>
                  ) : null}
                </div>
                <label className="flex items-center gap-3 text-sm font-semibold text-[#5F574F]">
                  <span>{copy.sortBy}</span>
                  <span className="relative">
                    <select value={draftFilters.sort ?? DEFAULT_SORT} onChange={(event) => updateDraftFilters({ sort: event.target.value })} className="h-11 appearance-none rounded-xl border border-[#D8CCBC] bg-white pl-4 pr-10 text-sm font-semibold text-[#2B2723] outline-none focus:border-[#7A263A]">
                      <option value={DEFAULT_SORT}>{copy.relevance}</option>
                      <option value="title,desc">{copy.sortZa}</option>
                      <option value="publishedDate,desc">{copy.newest}</option>
                    </select>
                    <Icon name="chevron-down" size={15} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </span>
                </label>
              </div>

              {error ? <div className="mt-6"><Notice tone="error" message={error} /></div> : null}

              {isLoading ? (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
                  {Array.from({ length: 20 }).map((_, index) => <CatalogBookSkeleton key={index} />)}
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
                  {books.map((book) => <BookShelfCard key={bookIdOf(book) || book.isbn} book={book} copy={copy} />)}
                </div>
              )}

              {!isLoading && books.length ? (
                <PaginationBar currentPage={currentPage} pages={paginationPages} totalPages={totalPages} onPageChange={handlePageChange} copy={copy} resultStart={resultStart} resultEnd={resultEnd} totalElements={pageInfo.totalElements} />
              ) : null}

              {!isLoading && !books.length && !error ? (
                <div className="mt-6">
                  <EmptyState variant="search" title={copy.noBooksTitle} description={copy.noBooksDescription} action={<button onClick={handleResetFilters} className="rounded-full bg-[#7A263A] px-6 py-3 text-sm font-bold text-white">{copy.clearFilters}</button>} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}

function QuickFilter({ active, label, icon, onClick }: Readonly<{ active: boolean; label: string; icon?: "check-circle" | "sparkles"; onClick: () => void }>) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold shadow-sm transition ${active ? "border-[#7A263A] bg-[#7A263A] text-white" : "border-[#D8CCBC] bg-[#FFFCF5]/90 text-[#3F3933] hover:border-[#7A263A] hover:text-[#7A263A]"}`}>
      {icon ? <Icon name={icon} size={15} aria-hidden="true" /> : null}
      {label}
    </button>
  );
}

function TopicCard({ category, imageUrl, tone, active, onClick }: Readonly<{ category: Category; imageUrl: string; tone: string; active: boolean; onClick: () => void }>) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`group overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-[#7A263A] ring-2 ring-[#7A263A]/15" : "border-[#DED5C8]"}`}>
      <span className={`relative block h-16 overflow-hidden bg-gradient-to-br ${tone}`}>
        {imageUrl ? <Image src={imageUrl} alt="" fill unoptimized sizes="180px" className="object-cover opacity-75 mix-blend-multiply transition duration-300 group-hover:scale-105" /> : null}
        <span className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </span>
      <span className="block truncate px-3 py-2 text-xs font-bold text-[#2B2723]">{category.name}</span>
    </button>
  );
}

function TopicSkeleton() {
  return <div className="h-[100px] animate-pulse rounded-xl border border-[#DED5C8] bg-[#F1EADF]" />;
}

function FilterSection({ title, children, last = false }: Readonly<{ title: string; children: ReactNode; last?: boolean }>) {
  return (
    <section className={`${last ? "pt-5" : "border-b border-[#E6DED2] py-5"}`}>
      <h3 className="mb-3 text-sm font-extrabold text-[#2B2723]">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function FilterRadio({ checked, label, onChange }: Readonly<{ checked: boolean; label: string; onChange: () => void }>) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-[#4D463F]">
      <input type="radio" checked={checked} onChange={onChange} className="h-4 w-4 accent-[#7A263A]" />
      <span className="min-w-0 truncate">{label}</span>
    </label>
  );
}

function findTopicCover(category: Category, books: Book[], index: number) {
  const matchingBook = books.find((book) => categoryLabel(book.category) === category.name) ?? books[index];
  return matchingBook ? bookCoverUrl(matchingBook, "thumbnail") : "";
}

function BookShelfCard({ book, copy }: Readonly<{ book: Book; copy: typeof booksExplorerCopy.en }>) {
  const coverUrl = bookCoverUrl(book, "thumbnail");
  const available = book.availableCopies ?? 0;
  const total = book.totalCopies ?? 0;
  const isAvailable = available > 0;
  const copyCount = total ? `${available} / ${total}` : String(available);
  const availabilityText = isAvailable ? `${copyCount} ${copy.copiesAvailable}` : copy.unavailable;

  return (
    <Link href={`/books/${bookIdOf(book)}`} aria-label={`${copy.viewDetails}: ${book.title}`} className="group block min-w-0 outline-none">
      <article className="h-full overflow-hidden rounded-xl border border-[#DED5C8] bg-[#FFFCF5] p-2.5 shadow-[0_10px_28px_rgba(43,39,35,0.06)] transition duration-300 group-hover:-translate-y-1 group-hover:border-[#C7B6A2] group-hover:shadow-[0_20px_44px_rgba(43,39,35,0.12)] group-focus-visible:ring-4 group-focus-visible:ring-[#7A263A]/20 sm:p-3">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[#EDE5D8] ring-1 ring-black/5">
          {coverUrl ? (
            <Image src={coverUrl} alt={bookCoverAlt(book)} fill unoptimized sizes="(min-width: 1450px) 190px, (min-width: 768px) 28vw, 46vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" loading="lazy" />
          ) : (
            <div className="flex h-full flex-col justify-between bg-[linear-gradient(145deg,#6F2639_0%,#2B2723_60%,#171412_100%)] p-4 text-white">
              <Icon name="book-open" size={24} aria-hidden="true" className="text-[#E1C38B]" />
              <h2 className="line-clamp-4 font-serif text-lg font-semibold leading-tight">{book.title}</h2>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">The Athenaeum</span>
            </div>
          )}
          <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/92 text-[#7A263A] shadow-sm backdrop-blur-sm"><Icon name="bookmark" size={15} aria-hidden="true" /></span>
        </div>
        <div className="px-0.5 pb-1 pt-3">
          <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8B6B4A]">{categoryLabel(book.category)}</p>
          <h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-extrabold leading-5 text-[#171412] transition group-hover:text-[#7A263A] sm:text-[15px]">{book.title}</h2>
          <p className="mt-1 line-clamp-1 text-xs text-[#776D63]">{(book.authors ?? []).map(authorLabel).join(", ") || copy.unknownAuthor}</p>
          <div className="mt-2 flex items-center gap-1.5"><StarRating rating={book.averageRating ?? 0} size="sm" /><span className="text-[10px] font-semibold text-[#8B8177]">({book.totalReviews ?? 0})</span></div>
          <div className={`mt-2.5 flex items-center gap-1.5 text-[11px] font-bold ${isAvailable ? "text-emerald-700" : "text-amber-700"}`}>
            <span className={`h-2 w-2 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="line-clamp-1">{availabilityText}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function CatalogBookSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[#DED5C8] bg-[#FFFCF5] p-2.5 sm:p-3">
      <div className="aspect-[3/4] rounded-lg bg-[#E7DED1]" />
      <div className="mt-3 h-2.5 w-2/3 rounded-full bg-[#E7DED1]" />
      <div className="mt-2 h-4 w-full rounded-full bg-[#E7DED1]" />
      <div className="mt-2 h-4 w-4/5 rounded-full bg-[#E7DED1]" />
      <div className="mt-3 h-3 w-1/2 rounded-full bg-[#E7DED1]" />
    </div>
  );
}

function buildPaginationPages(currentPage: number, totalPages: number) {
  const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
  const end = Math.min(totalPages, start + 5);
  return Array.from({ length: end - start }, (_, index) => start + index);
}

function PaginationBar({ currentPage, pages, totalPages, onPageChange, copy, resultStart, resultEnd, totalElements }: Readonly<{ currentPage: number; pages: number[]; totalPages: number; onPageChange: (page: number) => void; copy: typeof booksExplorerCopy.en; resultStart: number; resultEnd: number; totalElements: number }>) {
  return (
    <div className="mt-9 flex flex-col items-center justify-between gap-4 border-t border-[#DED5C8] pt-6 sm:flex-row">
      <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Books pagination">
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 0} className="min-h-10 rounded-xl border border-[#D8CCBC] bg-white px-4 text-sm font-bold text-[#2B2723] transition hover:border-[#7A263A] disabled:cursor-not-allowed disabled:opacity-40">{copy.previous}</button>
        {pages.map((page) => (
          <button key={page} type="button" onClick={() => onPageChange(page)} aria-current={page === currentPage ? "page" : undefined} className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition ${page === currentPage ? "bg-[#7A263A] text-white shadow-lg shadow-[#7A263A]/20" : "border border-[#D8CCBC] bg-white text-[#2B2723] hover:border-[#7A263A]"}`}>{page + 1}</button>
        ))}
        <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="min-h-10 rounded-xl border border-[#D8CCBC] bg-white px-4 text-sm font-bold text-[#2B2723] transition hover:border-[#7A263A] disabled:cursor-not-allowed disabled:opacity-40">{copy.next}</button>
      </nav>
      <p className="text-xs font-semibold text-[#776D63]">{copy.showing} {resultStart}–{resultEnd} {copy.of} {totalElements.toLocaleString()} {copy.titles}</p>
    </div>
  );
}
