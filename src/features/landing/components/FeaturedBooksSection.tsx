"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, LibraryBig, RefreshCw } from "lucide-react";
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

const FEATURED_BOOKS_LIMIT = "5";

const featuredCopy = {
  en: {
    eyebrow: "Fresh arrivals",
    title: "New Books",
    description: "The latest additions to our shelves. Your next discovery starts here.",
    viewAll: "Browse all books",
    previous: "Previous books",
    next: "Next books",
    loading: "Loading new books",
    emptyTitle: "A new chapter is on its way",
    empty: "New books will appear here when the catalog is updated.",
    errorTitle: "The shelves couldn't be loaded",
    error: "Please try again to see the newest books in the collection.",
    retry: "Try again",
    unknownAuthor: "Unknown author",
  },
  vi: {
    eyebrow: "Vừa cập nhật",
    title: "Sách mới",
    description: "Những đầu sách vừa đến với thư viện. Biết đâu, cuốn sách tiếp theo của bạn ở đây.",
    viewAll: "Duyệt tất cả sách",
    previous: "Nhóm sách trước",
    next: "Nhóm sách tiếp theo",
    loading: "Đang tải sách mới",
    emptyTitle: "Một chương mới sắp mở ra",
    empty: "Sách mới sẽ hiển thị ở đây khi danh mục được cập nhật.",
    errorTitle: "Chưa tải được danh sách sách mới",
    error: "Vui lòng thử lại để xem những đầu sách mới nhất của thư viện.",
    retry: "Thử lại",
    unknownAuthor: "Chưa rõ tác giả",
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

  useEffect(() => {
    let isMounted = true;

    getBooks({ page: "0", size: FEATURED_BOOKS_LIMIT, sort: "createdAt,desc" })
      .then((bookPage) => {
        if (!isMounted) return;
        setBooks(bookPage.items.slice(0, Number(FEATURED_BOOKS_LIMIT)));
        setActiveIndex(0);
      })
      .catch(() => {
        if (!isMounted) return;
        setBooks([]);
        setHasError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [requestVersion]);

  const orderedBooks = useMemo(() => {
    if (!books.length) return [];
    return books.map((_, offset) => books[(activeIndex + offset) % books.length]);
  }, [activeIndex, books]);

  function rotate(direction: number) {
    if (books.length < 2) return;
    setActiveIndex((current) => (current + direction + books.length) % books.length);
  }

  function retry() {
    setIsLoading(true);
    setHasError(false);
    setRequestVersion((version) => version + 1);
  }

  return (
    <section id="new-books" aria-labelledby="new-books-title" className="relative isolate flex min-h-[calc(100svh-9.2rem)] snap-start items-center overflow-hidden bg-[#27211C] px-4 py-10 text-[#FFFCF5] sm:min-h-[calc(100svh-7.05rem)] sm:px-6 sm:py-12 lg:snap-always lg:px-8 xl:min-h-[calc(100svh-4.3rem)]">
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[url('/new-books-library-bg.png')] bg-cover bg-center" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(23,20,18,0.94),rgba(23,20,18,0.76)_48%,rgba(23,20,18,0.64))]" />
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center lg:gap-12 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-16">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#E1C38B] sm:text-sm">
            <span aria-hidden="true" className="h-px w-8 bg-[#E1C38B]" />{copy.eyebrow}
          </p>
          <h2 id="new-books-title" className={`${editorialSerif.className} mt-4 text-5xl font-medium sm:text-6xl xl:text-7xl`}>{copy.title}</h2>
          <p className="mt-5 text-base leading-8 text-[#DFD4C5] sm:text-lg">{copy.description}</p>
          <Link href="/books" className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-lg border border-[#CABBA5]/70 px-6 text-base text-[#FFFCF5] transition-colors hover:border-[#E1C38B] hover:bg-[#FFFCF5]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B]">
            {copy.viewAll}<ArrowRight size={18} aria-hidden="true" />
          </Link>
          <div className="mt-7 flex gap-4">
            <button type="button" onClick={() => rotate(-1)} disabled={books.length < 2} aria-label={copy.previous} className="grid h-12 w-12 place-items-center rounded-full border border-[#CABBA5]/60 transition-colors hover:bg-[#FFFCF5]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B] disabled:opacity-40">
              <ArrowLeft size={19} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => rotate(1)} disabled={books.length < 2} aria-label={copy.next} className="grid h-12 w-12 place-items-center rounded-full border border-[#CABBA5]/60 transition-colors hover:bg-[#FFFCF5]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B] disabled:opacity-40">
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <FeaturedBooksSkeleton label={copy.loading} />
        ) : orderedBooks.length ? (
          <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-roledescription="carousel" aria-label={copy.title}>
            <div className="grid min-w-[960px] grid-cols-5 gap-4 xl:min-w-0 xl:gap-5">
              {orderedBooks.map((book, index) => (
                <FeaturedBookCard key={bookIdOf(book) || book.isbn || `${book.title}-${index}`} book={book} unknownAuthor={copy.unknownAuthor} />
              ))}
            </div>
          </div>
        ) : (
          <div role={hasError ? "alert" : "status"} className="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border border-[#CABBA5]/40 bg-[#211B17]/80 px-8 py-12 text-center">
            <LibraryBig aria-hidden="true" size={40} strokeWidth={1.3} className="text-[#E1C38B]" />
            <h3 className={`${editorialSerif.className} mt-6 text-3xl`}>{hasError ? copy.errorTitle : copy.emptyTitle}</h3>
            <p className="mt-3 max-w-xl text-base leading-7 text-[#DFD4C5]">{hasError ? copy.error : copy.empty}</p>
            {hasError ? (
              <button type="button" onClick={retry} className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-lg border border-[#CABBA5]/60 px-6 text-base transition-colors hover:bg-[#FFFCF5]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B]">
                <RefreshCw size={18} aria-hidden="true" />{copy.retry}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedBookCard({ book, unknownAuthor }: { book: Book; unknownAuthor: string }) {
  const coverUrl = bookCoverUrl(book, "detail") || bookCoverUrl(book, "thumbnail");
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const bookId = bookIdOf(book);
  const authors = book.authors?.map(authorLabel).join(", ") || unknownAuthor;

  return (
    <Link href={bookId ? `/books/${bookId}` : "/books"} className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#D6B779]/60 bg-[linear-gradient(145deg,rgba(62,48,37,0.9),rgba(34,27,22,0.94))] p-3.5 text-[#FFFCF5] shadow-[0_18px_45px_rgba(0,0,0,0.3)] backdrop-blur-md transition-[transform,border-color,box-shadow] hover:-translate-y-1 hover:border-[#E9C77F] hover:shadow-[0_24px_55px_rgba(0,0,0,0.4)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B] xl:p-4">
      <span aria-hidden="true" className="absolute right-2.5 top-2.5 z-10 grid h-11 w-11 place-items-center rounded-full border border-[#E1C38B] bg-[#2B211A]/90 text-[#F0CD88] shadow-[0_8px_18px_rgba(0,0,0,0.3)] backdrop-blur-sm xl:right-3 xl:top-3 xl:h-12 xl:w-12">
        <Bookmark size={20} strokeWidth={1.7} />
      </span>

      <div className="relative aspect-[5/7] w-full overflow-hidden rounded-lg border border-[#D6B779]/45 bg-[#EFE6D6] shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
        {coverUrl && coverUrl !== failedCoverUrl ? (
          <Image src={coverUrl} alt={bookCoverAlt(book)} fill unoptimized sizes="(min-width: 1280px) 210px, 180px" className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" onError={() => setFailedCoverUrl(coverUrl)} />
        ) : (
          <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F8F0DF_0%,#E7D7B8_62%,#C8A978_100%)] p-5 text-[#5A1C2B]">
            <div aria-hidden="true" className="absolute -bottom-10 -right-8 h-36 w-36 rounded-full border-[22px] border-[#7A263A]/10" />
            <div aria-hidden="true" className="absolute bottom-12 left-0 h-px w-3/4 rotate-[-18deg] bg-[#7A263A]/25" />
            <BookOpen size={24} strokeWidth={1.3} aria-hidden="true" className="relative" />
            <span className={`${editorialSerif.className} relative line-clamp-4 text-xl font-medium leading-tight xl:text-2xl`}>{book.title}</span>
          </div>
        )}
      </div>
      <p className="mt-5 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E1C38B] xl:text-xs">
        {book.category ? categoryLabel(book.category) : "The Athenaeum"}
      </p>
      <span aria-hidden="true" className="mt-2 h-px w-7 bg-[#E1C38B] transition-all duration-300 group-hover:w-12" />
      <h3 className={`${editorialSerif.className} mt-3 line-clamp-2 min-h-12 text-xl font-medium leading-6 text-[#FFFCF5] transition-colors group-hover:text-[#F0CD88] xl:text-[1.35rem] xl:leading-7`}>{book.title}</h3>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-[#D8CBB9]">{authors}</p>
    </Link>
  );
}

function FeaturedBooksSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="-mx-4 overflow-hidden px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="grid min-w-[960px] grid-cols-5 gap-4 xl:min-w-0 xl:gap-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-[#D6B779]/45 bg-[linear-gradient(145deg,rgba(62,48,37,0.88),rgba(34,27,22,0.92))] p-3.5 xl:p-4">
            <div className="aspect-[5/7] w-full animate-pulse rounded-lg bg-[#E7D7B8]/35" />
            <Skeleton width="52%" height={10} className="mt-5" style={{ backgroundColor: "rgba(225,195,139,0.3)" }} />
            <Skeleton width="100%" height={44} className="mt-3" style={{ backgroundColor: "rgba(255,252,245,0.16)" }} />
            <Skeleton width="76%" height={28} className="mt-3" style={{ backgroundColor: "rgba(216,203,185,0.16)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
