"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
    description: "Explore the latest titles handpicked from the Athenaeum collection.",
    viewAll: "Browse all books",
    viewDetails: "View details",
    by: "by",
    unknownAuthor: "Unknown author",
    newest: "Newest in collection",
    featured: "Now featured",
    cardDescription: "A curated new arrival from the Athenaeum catalog, ready for quick discovery and deeper reading.",
    previous: "Previous book",
    next: "Next book",
    empty: "New books will appear here when the catalog is updated.",
  },
  vi: {
    eyebrow: "Vừa cập nhật",
    title: "Sách mới",
    description: "Khám phá những đầu sách mới nhất vừa được thêm vào bộ sưu tập The Athenaeum.",
    viewAll: "Duyệt tất cả sách",
    viewDetails: "Xem chi tiết",
    by: "bởi",
    unknownAuthor: "Chưa rõ tác giả",
    newest: "Mới nhất trong thư viện",
    featured: "Đang nổi bật",
    cardDescription: "Một đầu sách mới được tuyển chọn từ danh mục Athenaeum, sẵn sàng để khám phá và đọc sâu hơn.",
    previous: "Sách trước",
    next: "Sách tiếp theo",
    empty: "Sách mới sẽ hiển thị ở đây khi danh mục được cập nhật.",
  },
};

export function FeaturedBooksSection() {
  const { locale } = useLanguage();
  const copy = featuredCopy[locale];
  const [books, setBooks] = useState<Book[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
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
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  function goPrevious() {
    goToBook(activeIndex - 1);
  }

  function goNext() {
    goToBook(activeIndex + 1);
  }

  return (
    <section
      id="new-books"
      className="relative isolate min-h-[860px] overflow-hidden bg-[#21160f] px-5 py-16 text-white md:min-h-[900px] md:py-24 lg:min-h-[945px] lg:px-8"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage: "url('/new-books-library-bg.png')",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,5,4,0.72)_0%,rgba(23,16,10,0.38)_42%,rgba(12,9,7,0.20)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.34)_100%)]" />

      <div className="mx-auto max-w-[1436px]">
        <div className="relative z-30 flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="max-w-xl pt-8">
            <p className="text-xs font-black uppercase tracking-[0.42em] text-[#ff7777]">{copy.eyebrow}</p>
            <span className="mt-6 block h-0.5 w-12 bg-[#E60028]" />
            <h2 className="mt-7 font-serif text-6xl font-normal leading-[0.95] text-white md:text-[5rem]">
              {copy.title}
            </h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/82">{copy.description}</p>
          </div>
          <Link
            href="/books"
            className="mt-3 inline-flex w-fit items-center gap-4 rounded-full border border-white/85 bg-black/18 px-8 py-4 text-sm font-bold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white hover:text-black md:mt-2"
          >
            <span aria-hidden="true" className="grid h-5 w-5 grid-cols-2 gap-0.5">
              <span className="rounded-sm border border-current" />
              <span className="rounded-sm border border-current" />
              <span className="rounded-sm border border-current" />
              <span className="rounded-sm border border-current" />
            </span>
            {copy.viewAll}
          </Link>
        </div>

        {isLoading ? (
          <FeaturedBooksSkeleton />
        ) : books.length ? (
          <div className="-mt-4 grid gap-12 xl:-mt-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start xl:gap-16">
            <div className="relative min-h-[540px] overflow-visible [perspective:1400px]">
              <div className="absolute left-0 top-24 z-40 hidden flex-col items-center gap-4 text-[#ff7777] md:flex">
                <span className="text-sm font-black tracking-widest">{String(activeIndex + 1).padStart(2, "0")}</span>
                <span className="h-28 w-px bg-white/78" />
                <span className="text-sm font-black tracking-widest">{String(Math.min(books.length, Number(FEATURED_BOOKS_LIMIT))).padStart(2, "0")}</span>
              </div>
              <button
                type="button"
                onClick={goPrevious}
                aria-label={copy.previous}
                className="absolute bottom-6 left-0 z-50 grid h-14 w-14 place-items-center rounded-full border border-white/35 bg-black/18 text-2xl text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white hover:text-black"
              >
                ←
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={copy.next}
                className="absolute bottom-6 left-20 z-50 grid h-14 w-14 place-items-center rounded-full bg-white text-2xl text-black shadow-[0_14px_36px_rgba(0,0,0,0.30)] transition hover:-translate-y-1 hover:bg-[#E60028] hover:text-white"
              >
                →
              </button>

              <div
                className="absolute inset-y-0 left-16 right-0 mx-auto max-w-5xl overflow-visible md:left-24"
                style={{ transform: "translateX(min(7vw, 120px))" }}
              >
                {visibleBooks.map(({ book, index, offset }) => (
                  <FeaturedBookCover
                    key={bookIdOf(book) || book.isbn}
                    book={book}
                    index={index}
                    offset={offset}
                    isActive={index === activeIndex}
                    copy={copy}
                    onFocus={() => goToBook(index)}
                  />
                ))}
              </div>
            </div>

            <aside className="mt-8 flex min-h-[508px] flex-col rounded-2xl border border-white/60 bg-[#fffaf2]/96 p-10 text-[#151515] shadow-[0_32px_90px_rgba(0,0,0,0.30)] backdrop-blur-md xl:mt-0 xl:-translate-y-[72px]">
              <div className="flex items-start justify-between gap-5">
                <p className="text-[11px] font-black uppercase tracking-[0.34em] text-[#A82424]">{copy.newest}</p>
                <span
                  aria-hidden="true"
                  className="h-6 w-5 rounded-t-sm border-2 border-black/35 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]"
                />
              </div>
              <h3 className="mt-7 font-serif text-[2.35rem] font-normal leading-[1.12] text-[#151515]">
                {activeBook?.title}
              </h3>
              <p className="mt-6 text-sm font-medium text-[#333333]">
                {copy.by} <span className="text-[#111827]">{activeAuthors}</span>
              </p>
              {/* Star rating */}
              <div className="mt-3 flex items-center gap-1.5">
                <StarRating rating={activeBook?.averageRating ?? 0} size="sm" />
                {activeBook?.totalReviews && activeBook.totalReviews > 0 ? (
                  <>
                    <span className="text-sm font-bold text-[#f59e0b]">
                      {activeBook.averageRating?.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-[#666666]">
                      ({activeBook.totalReviews})
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-[#888888]">
                    (0)
                  </span>
                )}
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3 text-[11px] text-[#555555]">
                <span className="rounded-full border border-black/12 px-3 py-1 font-semibold">
                  {activeBook ? categoryLabel(activeBook.category) : ""}
                </span>
                {activeBook?.edition ? (
                  <span className="border-l border-black/18 pl-3 font-medium">
                    {activeBook.edition}
                  </span>
                ) : null}
                {activePublishedDate ? (
                  <span className="border-l border-black/18 pl-3 font-medium">
                    {activePublishedDate}
                  </span>
                ) : null}
              </div>
              <p className="mt-9 border-t border-black/12 pt-7 text-sm leading-7 text-[#404040]">
                {copy.cardDescription}
              </p>
              <Link
                href={activeBookId ? `/books/${activeBookId}` : "/books"}
                className="relative top-2 mt-auto inline-flex w-full items-center justify-center gap-5 rounded-full bg-[#C1282D] px-5 py-4 text-sm font-black text-white shadow-[0_18px_36px_rgba(193,40,45,0.28)] transition hover:top-1 hover:bg-black"
              >
                {copy.viewDetails}
                <span aria-hidden="true">→</span>
              </Link>
            </aside>
          </div>
        ) : (
          <div className="mt-10 border border-white/20 bg-white/10 p-8 text-white/75 backdrop-blur">
            {copy.empty}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedBookCover({
  book,
  index,
  offset,
  isActive,
  copy,
  onFocus,
}: {
  book: Book;
  index: number;
  offset: number;
  isActive: boolean;
  copy: typeof featuredCopy.en;
  onFocus: () => void;
}) {
  const coverUrl = bookCoverUrl(book, "detail") || bookCoverUrl(book, "thumbnail");
  const bookId = bookIdOf(book);
  const absOffset = Math.abs(offset);
  const transform = coverTransform(offset);
  const isVisible = absOffset <= 2;
  const content = (
    <>
      <div
        className={`relative aspect-[2/3] w-full overflow-hidden bg-[#F3F4F6] shadow-[0_28px_50px_rgba(0,0,0,0.36)] ${
          isActive ? "border-[10px] border-[#f8efe4]" : "ring-1 ring-white/10"
        }`}
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={bookCoverAlt(book)}
            fill
            unoptimized
            sizes="(min-width: 1280px) 280px, 42vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col justify-between bg-[linear-gradient(135deg,#111827,#000000)] p-5 text-white">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-white/60">{categoryLabel(book.category)}</span>
            <h3 className="text-2xl font-black leading-tight">{book.title}</h3>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">The Athenaeum</span>
          </div>
        )}
      </div>
      {isActive ? (
        <span className="pointer-events-none absolute -bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#fffaf2] px-6 py-2 text-xs font-bold text-[#191919] shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
          {copy.featured}
        </span>
      ) : null}
      <span className="sr-only">{isActive ? copy.viewDetails : `${copy.viewDetails}: ${book.title}`}</span>
    </>
  );

  const className = `absolute left-1/2 w-[152px] -translate-x-1/2 -translate-y-1/2 outline-none transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)] sm:w-[188px] md:w-[230px] xl:w-[280px] ${isVisible ? "pointer-events-auto" : "pointer-events-none opacity-0"
    } ${isActive ? "z-40" : absOffset === 1 ? "z-30" : absOffset === 2 ? "z-20" : "z-10"}`;

  if (isActive) {
    return (
      <Link
        href={bookId ? `/books/${bookId}` : "/books"}
        className={className}
        style={transform}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onFocus}
      className={`${className} cursor-pointer`}
      style={transform}
      aria-label={`${copy.viewDetails}: ${book.title}`}
      data-index={index}
    >
      {content}
    </button>
  );
}

function FeaturedBooksSkeleton() {
  return (
    <div className="mt-12 grid gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-h-[540px] animate-pulse bg-white/10" />
      <div className="h-[508px] animate-pulse rounded-2xl bg-white/70" />
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

function coverTransform(offset: number) {
  const absOffset = Math.abs(offset);
  const direction = offset < 0 ? -1 : 1;
  const translateX = offset === 0 ? 0 : direction * (205 + (absOffset - 1) * 142);
  const translateY = offset === 0 ? -4 : 28 + (absOffset - 1) * 8;
  const scale = offset === 0 ? 1 : Math.max(0.64, 0.78 - (absOffset - 1) * 0.12);
  const rotate = offset === 0 ? 0 : direction * -3;
  const opacity = offset === 0 ? 1 : Math.max(0.86, 0.98 - (absOffset - 1) * 0.06);

  return {
    top: "80%",
    transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotateY(${rotate}deg)`,
    opacity,
  };
}

function formatPublishedDate(date: string, locale: "en" | "vi") {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}
