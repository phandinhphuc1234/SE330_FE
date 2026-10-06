"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, LibraryBig, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { editorialSerif } from "@/components/layout/editorialFont";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  authorLabel,
  bookCoverAlt,
  bookCoverUrl,
  bookIdOf,
  categoryLabel,
} from "@/features/catalog/components/catalogHelpers";
import { getBooks } from "@/features/catalog/services/catalogService";
import { Book } from "@/features/catalog/types/catalog.type";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { StarRating } from "@/features/review/components/StarRating";

const FEATURED_BOOKS_LIMIT = "5";

const featuredCopy = {
  en: {
    eyebrow: "Fresh arrivals",
    title: "New Books",
    description: "The latest additions to our shelves. Your next discovery starts here.",
    viewAll: "Browse all books",
    viewDetails: "View details",
    by: "by",
    unknownAuthor: "Unknown author",
    newest: "From the collection",
    featured: "In the spotlight",
    cardDescription: "Explore this new arrival, check its availability and find your next read.",
    previous: "Previous book",
    next: "Next book",
    select: "Select book",
    position: "Book",
    of: "of",
    loading: "Loading new books",
    emptyTitle: "A new chapter is on its way",
    empty: "New books will appear here when the catalog is updated.",
    errorTitle: "The shelves couldn't be loaded",
    error: "Please try again to see the newest books in the collection.",
    retry: "Try again",
    noReviews: "No reviews yet",
  },
  vi: {
    eyebrow: "Vừa cập nhật",
    title: "Sách mới",
    description: "Những đầu sách vừa đến với thư viện. Biết đâu, cuốn sách tiếp theo của bạn ở đây.",
    viewAll: "Duyệt tất cả sách",
    viewDetails: "Xem chi tiết",
    by: "bởi",
    unknownAuthor: "Chưa rõ tác giả",
    newest: "Từ bộ sưu tập",
    featured: "Tiêu điểm",
    cardDescription: "Khám phá đầu sách mới, xem tình trạng sẵn có và chọn cuốn sách cho lần đọc tiếp theo.",
    previous: "Sách trước",
    next: "Sách tiếp theo",
    select: "Chọn sách",
    position: "Sách",
    of: "trên",
    loading: "Đang tải sách mới",
    emptyTitle: "Một chương mới sắp mở ra",
    empty: "Sách mới sẽ hiển thị ở đây khi danh mục được cập nhật.",
    errorTitle: "Chưa tải được danh sách sách mới",
    error: "Vui lòng thử lại để xem những đầu sách mới nhất của thư viện.",
    retry: "Thử lại",
    noReviews: "Chưa có đánh giá",
  },
};

export function FeaturedBooksSection() {
  const { locale } = useLanguage();
  const copy = featuredCopy[locale];
  const [books, setBooks] = useState<Book[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const activeBook = books[activeIndex];
  const activeAuthors = activeBook?.authors?.map(authorLabel).join(", ") || copy.unknownAuthor;
  const activeBookId = activeBook ? bookIdOf(activeBook) : "";
  const activePublishedDate = activeBook?.publishedDate ? formatPublishedDate(activeBook.publishedDate, locale) : "";

  useEffect(() => {
    let isMounted = true;

    getBooks({ page: "0", size: FEATURED_BOOKS_LIMIT, sort: "createdAt,desc" })
      .then((bookPage) => {
        if (!isMounted) return;
        setBooks(bookPage.items.slice(0, Number(FEATURED_BOOKS_LIMIT)));
        setActiveIndex(0);
      })
      .catch(() => {
        if (isMounted) {
          setBooks([]);
          setHasError(true);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [requestVersion]);

  const visibleBooks = useMemo(() => {
    return books.map((book, index) => ({
      book,
      index,
      offset: shortestOffset(index, activeIndex, books.length),
    }));
  }, [activeIndex, books]);

  function goToBook(index: number) {
    if (!books.length) return;
    setActiveIndex(wrapIndex(index, books.length));
  }

  function retry() {
    setIsLoading(true);
    setHasError(false);
    setRequestVersion((version) => version + 1);
  }

  return (
    <section id="new-books" aria-labelledby="new-books-title" className="relative isolate scroll-mt-28 overflow-hidden bg-[#27211C] px-4 py-12 text-[#FFFCF5] sm:px-6 sm:py-16 lg:px-8">
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[url('/new-books-library-bg.png')] bg-cover bg-center" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(23,20,18,0.88),rgba(23,20,18,0.74)_55%,rgba(23,20,18,0.6))]" />
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end md:gap-10">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E1C38B]">{copy.eyebrow}</p>
            <h2 id="new-books-title" className={`${editorialSerif.className} mt-3 text-4xl font-medium sm:text-5xl`}>{copy.title}</h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-[#DFD4C5]">{copy.description}</p>
          </div>
          <Link href="/books" className="inline-flex min-h-11 w-fit shrink-0 items-center gap-3 rounded-lg border border-[#CABBA5]/60 px-5 py-3 text-sm text-[#FFFCF5] transition-colors hover:border-[#E1C38B] hover:bg-[#FFFCF5]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B]">
            {copy.viewAll}<ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>

        {isLoading ? (
          <FeaturedBooksSkeleton label={copy.loading} />
        ) : books.length ? (
          <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center xl:grid-cols-[minmax(0,1fr)_370px] xl:gap-12">
            <div className="min-w-0" role="group" aria-roledescription="carousel" aria-label={copy.title}>
              <div className="relative h-[320px] overflow-hidden [--cover-step:104px] [perspective:1400px] sm:h-[370px] sm:[--cover-step:150px] lg:[--cover-step:136px] xl:[--cover-step:170px]">
                {visibleBooks.map(({ book, index, offset }) => (
                  <FeaturedBookCover
                    key={bookIdOf(book) || book.isbn}
                    book={book}
                    offset={offset}
                    isActive={index === activeIndex}
                    copy={copy}
                    onSelect={() => goToBook(index)}
                  />
                ))}
              </div>
              <div className="mt-5 flex items-center justify-center gap-6">
                <button type="button" onClick={() => goToBook(activeIndex - 1)} disabled={books.length < 2} aria-label={copy.previous} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-[#CABBA5]/60 text-[#FFFCF5] transition-colors hover:bg-[#FFFCF5]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B] disabled:cursor-default disabled:opacity-40">
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <span role="status" className="min-w-16 text-center text-sm tabular-nums text-[#E1C38B]">
                  <span className="sr-only">{copy.position} </span>
                  {String(activeIndex + 1).padStart(2, "0")}
                  <span aria-hidden="true" className="mx-2 text-[#CABBA5]/60">/</span>
                  <span className="sr-only"> {copy.of} </span>
                  <span className="text-[#DFD4C5]">{String(books.length).padStart(2, "0")}</span>
                </span>
                <button type="button" onClick={() => goToBook(activeIndex + 1)} disabled={books.length < 2} aria-label={copy.next} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-[#CABBA5]/60 text-[#FFFCF5] transition-colors hover:bg-[#FFFCF5]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B] disabled:cursor-default disabled:opacity-40">
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            <aside className="flex min-w-0 flex-col rounded-xl border border-[#DED5C8] bg-[#FFFCF5] p-6 text-[#2B2723] shadow-[0_12px_36px_rgba(0,0,0,0.12)] sm:p-8">
              <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A263A]">
                <span aria-hidden="true" className="h-px w-6 bg-[#B8872B]" />{copy.newest}
              </p>
              <h3 className={`${editorialSerif.className} mt-5 line-clamp-3 text-[1.85rem] font-medium leading-tight`}>{activeBook?.title}</h3>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6F675E]">{copy.by} <span className="text-[#2B2723]">{activeAuthors}</span></p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {activeBook?.totalReviews && activeBook.totalReviews > 0 ? (
                  <>
                    <StarRating rating={activeBook.averageRating ?? 0} size="sm" />
                    <span className="text-xs text-[#6F675E]">{activeBook.averageRating?.toFixed(1)} ({activeBook.totalReviews})</span>
                  </>
                ) : <span className="text-xs text-[#6F675E]">{copy.noReviews}</span>}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs leading-5 text-[#6F675E]">
                {activeBook?.category ? <span className="rounded border border-[#DED5C8] px-2.5 py-1 text-[#7A263A]">{categoryLabel(activeBook.category)}</span> : null}
                {activeBook?.edition ? <span>{activeBook.edition}</span> : null}
                {activePublishedDate ? <span>{activePublishedDate}</span> : null}
              </div>
              <p className="mb-6 mt-5 border-t border-[#DED5C8] pt-5 text-[13px] leading-6 text-[#6F675E]">{copy.cardDescription}</p>
              <Link href={activeBookId ? `/books/${activeBookId}` : "/books"} className="mt-auto inline-flex min-h-12 items-center justify-between gap-4 rounded-lg bg-[#7A263A] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5A1C2B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A263A]">
                {copy.viewDetails}<ArrowRight size={17} aria-hidden="true" />
              </Link>
            </aside>
          </div>
        ) : (
          <div role={hasError ? "alert" : "status"} className="mt-8 flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-[#CABBA5]/30 bg-[#211B17]/80 px-6 py-12 text-center">
            <LibraryBig aria-hidden="true" size={34} strokeWidth={1.3} className="text-[#E1C38B]" />
            <h3 className={`${editorialSerif.className} mt-5 text-2xl`}>{hasError ? copy.errorTitle : copy.emptyTitle}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#DFD4C5]">{hasError ? copy.error : copy.empty}</p>
            {hasError ? (
              <button type="button" onClick={retry} className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#CABBA5]/60 px-5 py-2.5 text-sm transition-colors hover:bg-[#FFFCF5]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B]">
                <RefreshCw size={16} aria-hidden="true" />{copy.retry}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedBookCover({
  book, offset, isActive, copy, onSelect,
}: {
  book: Book;
  offset: number;
  isActive: boolean;
  copy: typeof featuredCopy.en;
  onSelect: () => void;
}) {
  const coverUrl = bookCoverUrl(book, "detail") || bookCoverUrl(book, "thumbnail");
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const bookId = bookIdOf(book);
  const absOffset = Math.abs(offset);
  const isVisible = absOffset <= 2;
  const content = (
    <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-sm bg-[#EFE6D6] text-left shadow-[0_16px_30px_rgba(0,0,0,0.35)] ${isActive ? "ring-4 ring-[#EFE6D6]" : "ring-1 ring-[#FFFCF5]/20"}`}>
      {coverUrl && coverUrl !== failedCoverUrl ? (
        <Image src={coverUrl} alt={bookCoverAlt(book)} fill unoptimized sizes="(min-width: 640px) 224px, 184px" className="object-cover" onError={() => setFailedCoverUrl(coverUrl)} />
      ) : (
        <div className="flex h-full flex-col justify-between border-l-[6px] border-[#7A263A]/25 p-5 text-[#5A1C2B]">
          <BookOpen size={24} strokeWidth={1.3} aria-hidden="true" />
          <span className={`${editorialSerif.className} line-clamp-5 text-xl font-medium leading-snug`}>{book.title}</span>
          <span className="border-t border-[#B8872B]/40 pt-3 text-[9px] uppercase tracking-[0.12em]">The Athenaeum</span>
        </div>
      )}
    </div>
  );

  const className = `absolute left-1/2 top-1/2 w-[184px] cursor-pointer rounded-sm transition-[transform,opacity] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#E1C38B] motion-reduce:transition-none sm:w-[224px] ${isVisible ? "" : "pointer-events-none opacity-0"} ${isActive ? "z-30" : absOffset === 1 ? "z-20" : "z-10"}`;
  const style = {
    transform: `translate(-50%, -50%) translateX(calc(var(--cover-step) * ${offset})) translateY(${isActive ? 0 : 12}px) scale(${isActive ? 1 : Math.max(0.65, 0.82 - (absOffset - 1) * 0.14)}) rotateY(${offset * -4}deg)`,
    opacity: isActive ? 1 : 0.8,
  };

  if (isActive) {
    return <Link href={bookId ? `/books/${bookId}` : "/books"} className={className} style={style} aria-label={`${copy.viewDetails}: ${book.title}`}>{content}</Link>;
  }

  return (
    <button type="button" onClick={onSelect} className={className} style={style} aria-label={`${copy.select}: ${book.title}`} tabIndex={isVisible ? 0 : -1} aria-hidden={!isVisible}>
      {content}
    </button>
  );
}

function FeaturedBooksSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px] xl:gap-12">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex h-[385px] items-center justify-center gap-5 overflow-hidden sm:h-[435px]">
        <Skeleton width={140} height={210} style={{ backgroundColor: "#675A4A" }} className="shrink-0 opacity-50" />
        <Skeleton width={224} height={336} style={{ backgroundColor: "#CABBA5" }} className="shrink-0" />
        <Skeleton width={140} height={210} style={{ backgroundColor: "#675A4A" }} className="shrink-0 opacity-50" />
      </div>
      <div aria-hidden="true" className="rounded-xl bg-[#FFFCF5] p-8">
        <Skeleton width="45%" height={12} style={{ backgroundColor: "#EFE6D6" }} />
        <Skeleton width="100%" height={70} className="mt-6" style={{ backgroundColor: "#EFE6D6" }} />
        <Skeleton width="60%" height={16} className="mt-5" style={{ backgroundColor: "#EFE6D6" }} />
        <Skeleton width="100%" height={80} className="mt-8" style={{ backgroundColor: "#EFE6D6" }} />
        <Skeleton width="100%" height={48} className="mt-7" style={{ backgroundColor: "#EFE6D6" }} />
      </div>
    </div>
  );
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function shortestOffset(index: number, activeIndex: number, length: number) {
  if (!length) return 0;
  const raw = index - activeIndex;
  const half = length / 2;
  if (raw > half) return raw - length;
  if (raw < -half) return raw + length;
  return raw;
}

function formatPublishedDate(date: string, locale: "en" | "vi") {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    month: "short", day: "numeric", year: "numeric",
  }).format(parsedDate);
}
