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
    <Link href={bookId ? `/books/${bookId}` : "/books"} className="group flex min-w-0 flex-col rounded-xl border border-[#E5DCD0] bg-[#FFFCF5] p-4 text-[#2B2723] shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-[border-color,box-shadow] hover:border-[#E1C38B] hover:shadow-[0_14px_30px_rgba(0,0,0,0.2)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B] xl:p-5">
      <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-lg bg-[#EFE6D6] p-3 xl:h-52">
        {coverUrl && coverUrl !== failedCoverUrl ? (
          <Image src={coverUrl} alt={bookCoverAlt(book)} fill unoptimized sizes="180px" className="object-contain p-2" onError={() => setFailedCoverUrl(coverUrl)} />
        ) : (
          <div className="flex h-full w-full flex-col justify-between border-l-4 border-[#7A263A]/35 p-3 text-[#5A1C2B]">
            <BookOpen size={20} strokeWidth={1.4} aria-hidden="true" />
            <span className={`${editorialSerif.className} line-clamp-3 text-base font-medium leading-snug`}>{book.title}</span>
          </div>
        )}
      </div>
      <p className="mt-4 truncate text-xs font-medium uppercase tracking-[0.08em] text-[#8B775F]">
        {book.category ? categoryLabel(book.category) : "The Athenaeum"}
      </p>
      <h3 className={`${editorialSerif.className} mt-2 line-clamp-2 text-lg font-medium leading-6 transition-colors group-hover:text-[#7A263A] xl:text-xl`}>{book.title}</h3>
      <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#6F675E]">{authors}</p>
    </Link>
  );
}

function FeaturedBooksSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="-mx-4 overflow-hidden px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="grid min-w-[960px] grid-cols-5 gap-4 xl:min-w-0 xl:gap-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-[#FFFCF5] p-4 xl:p-5">
            <Skeleton width="100%" height={208} style={{ backgroundColor: "#EFE6D6" }} />
            <Skeleton width="42%" height={10} className="mt-3" style={{ backgroundColor: "#EFE6D6" }} />
            <Skeleton width="100%" height={38} className="mt-2" style={{ backgroundColor: "#EFE6D6" }} />
            <Skeleton width="70%" height={12} className="mt-2" style={{ backgroundColor: "#EFE6D6" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
