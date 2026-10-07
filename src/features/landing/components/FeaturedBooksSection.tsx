"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bookmark, LibraryBig, RefreshCw } from "lucide-react";
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

const FALLBACK_COVER_STYLES = [
  {
    backgroundImage: "radial-gradient(circle at 82% 36%, rgba(180, 108, 78, 0.72) 0 12%, transparent 12.5%), linear-gradient(145deg, #F7F1EA 0%, #E2CEBB 100%)",
    color: "#26211D",
  },
  {
    backgroundImage: "radial-gradient(circle at 85% 86%, rgba(228, 235, 236, 0.92) 0 28%, transparent 28.5%), radial-gradient(circle at 46% 76%, rgba(156, 180, 194, 0.88) 0 43%, transparent 43.5%), linear-gradient(145deg, #E9EFF1 0%, #A9BBC6 100%)",
    color: "#102E49",
  },
  {
    backgroundImage: "linear-gradient(122deg, transparent 0 58%, rgba(174, 126, 86, 0.2) 58.5% 73%, transparent 73.5%), linear-gradient(155deg, #F7F3EC 0%, #DEC8B4 100%)",
    color: "#2A2521",
  },
  {
    backgroundImage: "linear-gradient(158deg, transparent 0 60%, rgba(92, 130, 145, 0.34) 60.5% 70%, rgba(42, 72, 84, 0.74) 70.5%), linear-gradient(145deg, #EEF2F3 0%, #E6E1D9 100%)",
    color: "#102E49",
  },
] as const;

const CATEGORY_PILL_COLORS = ["#DFE8DB", "#F2DFDC", "#DEE8EF", "#EEE3D6"] as const;

const featuredCopy = {
  en: {
    eyebrow: "Fresh arrivals",
    title: "New Books",
    titleLead: "New",
    titleAccent: "Books",
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
    titleLead: "Sách",
    titleAccent: "mới",
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
    <section id="new-books" aria-labelledby="new-books-title" className="relative isolate flex min-h-[calc(100svh-9.2rem)] snap-start items-center overflow-hidden bg-[#E9E3DA] px-4 py-10 text-[#24211E] sm:min-h-[calc(100svh-7.05rem)] sm:px-6 sm:py-12 lg:snap-always lg:px-8 xl:min-h-[calc(100svh-4.3rem)]">
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[url('/new-books-library-bg.png')] bg-cover bg-center [filter:saturate(.9)_brightness(.82)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(22,17,13,0.68)_0%,rgba(22,17,13,0.38)_24%,rgba(22,17,13,0.08)_48%,rgba(10,8,6,0.12)_100%)]" />
      <div className="mx-auto grid w-full max-w-[106rem] gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center lg:gap-12 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-14">
        <div>
          <p className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#F0D39C] sm:text-sm">
            <span aria-hidden="true" className="h-px w-9 bg-[#E1B570]" />{copy.eyebrow}
          </p>
          <h2 id="new-books-title" className="mt-7 text-6xl font-black leading-[0.88] tracking-[-0.055em] sm:text-7xl xl:text-[5.7rem]">
            <span className="block text-[#FFFDF8]">{copy.titleLead}</span>
            <span className="block text-[#E1B570]">{copy.titleAccent}</span>
          </h2>
          <p className="mt-7 max-w-sm text-base leading-8 text-[#E7DED2] sm:text-lg">{copy.description}</p>
          <Link href="/books" className="mt-7 inline-flex min-h-14 items-center gap-8 rounded-xl bg-[#222222] px-7 text-base font-semibold text-white shadow-[0_12px_26px_rgba(0,0,0,0.16)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#080808] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A263A]">
            {copy.viewAll}<ArrowRight size={18} aria-hidden="true" />
          </Link>
          <div className="mt-10 flex items-center gap-3">
            <button type="button" onClick={() => rotate(-1)} disabled={books.length < 2} aria-label={copy.previous} className="grid h-14 w-14 place-items-center rounded-full border border-white/90 bg-white/85 text-[#27231F] shadow-[0_10px_24px_rgba(49,39,31,0.12)] backdrop-blur-sm transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A263A] disabled:opacity-40">
              <ArrowLeft size={19} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => rotate(1)} disabled={books.length < 2} aria-label={copy.next} className="grid h-14 w-14 place-items-center rounded-full border border-white/90 bg-white/85 text-[#27231F] shadow-[0_10px_24px_rgba(49,39,31,0.12)] backdrop-blur-sm transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A263A] disabled:opacity-40">
              <ArrowRight size={19} aria-hidden="true" />
            </button>
            <span aria-hidden="true" className="ml-2 h-0.5 w-12 bg-[#E1B570]" />
            <span aria-live="polite" className="ml-1 text-sm font-medium tabular-nums text-[#F2E9DE]">
              {String(books.length ? activeIndex + 1 : 0).padStart(2, "0")} / {String(books.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        {isLoading ? (
          <FeaturedBooksSkeleton label={copy.loading} />
        ) : orderedBooks.length ? (
          <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-roledescription="carousel" aria-label={copy.title}>
            <div className="grid min-w-[1000px] grid-cols-5 gap-4 2xl:min-w-0 2xl:gap-5">
              {orderedBooks.map((book, index) => (
                <FeaturedBookCard key={bookIdOf(book) || book.isbn || `${book.title}-${index}`} book={book} index={index} unknownAuthor={copy.unknownAuthor} />
              ))}
            </div>
          </div>
        ) : (
          <div role={hasError ? "alert" : "status"} className="flex min-h-[22rem] flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/82 px-8 py-12 text-center shadow-[0_18px_45px_rgba(49,39,31,0.12)] backdrop-blur-md">
            <LibraryBig aria-hidden="true" size={40} strokeWidth={1.3} className="text-[#9F754B]" />
            <h3 className={`${editorialSerif.className} mt-6 text-3xl`}>{hasError ? copy.errorTitle : copy.emptyTitle}</h3>
            <p className="mt-3 max-w-xl text-base leading-7 text-[#625E58]">{hasError ? copy.error : copy.empty}</p>
            {hasError ? (
              <button type="button" onClick={retry} className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#222222] px-6 text-base text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A263A]">
                <RefreshCw size={18} aria-hidden="true" />{copy.retry}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedBookCard({ book, index, unknownAuthor }: { book: Book; index: number; unknownAuthor: string }) {
  const coverUrl = bookCoverUrl(book, "detail") || bookCoverUrl(book, "thumbnail");
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const bookId = bookIdOf(book);
  const authors = book.authors?.map(authorLabel).join(", ") || unknownAuthor;
  const coverStyle = FALLBACK_COVER_STYLES[index % FALLBACK_COVER_STYLES.length];
  const categoryPillColor = CATEGORY_PILL_COLORS[index % CATEGORY_PILL_COLORS.length];

  return (
    <Link href={bookId ? `/books/${bookId}` : "/books"} className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/90 bg-[#FBFAF7]/95 p-3.5 text-[#24211E] shadow-[0_18px_40px_rgba(50,39,31,0.12)] backdrop-blur-md transition-[transform,box-shadow] hover:-translate-y-1.5 hover:shadow-[0_26px_55px_rgba(50,39,31,0.2)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A263A] xl:p-4">
      <span aria-hidden="true" className="absolute right-2.5 top-2.5 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/85 bg-white/92 text-[#24211E] shadow-[0_8px_18px_rgba(0,0,0,0.12)] backdrop-blur-sm xl:right-3 xl:top-3 xl:h-12 xl:w-12">
        <Bookmark size={20} strokeWidth={1.7} />
      </span>

      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-[#D9D2C8]/70 bg-[#EFEAE3] shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
        {coverUrl && coverUrl !== failedCoverUrl ? (
          <Image src={coverUrl} alt={bookCoverAlt(book)} fill unoptimized sizes="(min-width: 1536px) 240px, 190px" className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" onError={() => setFailedCoverUrl(coverUrl)} />
        ) : (
          <div className="flex h-full w-full flex-col justify-between overflow-hidden p-5" style={coverStyle}>
            <span className="line-clamp-5 text-xl font-medium leading-[1.08] tracking-[-0.025em] xl:text-2xl">{book.title}</span>
            <span className="line-clamp-3 text-xs leading-4 opacity-80 xl:text-sm xl:leading-5">{authors}</span>
          </div>
        )}
      </div>
      <p className="mt-4 inline-flex w-fit max-w-full truncate rounded-full px-3 py-1.5 text-[11px] font-medium text-[#554E47] xl:text-xs" style={{ backgroundColor: categoryPillColor }}>
        {book.category ? categoryLabel(book.category) : "The Athenaeum"}
      </p>
      <h3 className="mt-3 line-clamp-2 min-h-12 text-lg font-bold leading-6 tracking-[-0.02em] text-[#24211E] transition-colors group-hover:text-[#7A263A] xl:text-xl xl:leading-7">{book.title}</h3>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#8A847E]">{authors}</p>
    </Link>
  );
}

function FeaturedBooksSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="-mx-4 overflow-hidden px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="grid min-w-[1000px] grid-cols-5 gap-4 2xl:min-w-0 2xl:gap-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-[1.35rem] border border-white/90 bg-[#FBFAF7]/92 p-3.5 shadow-[0_18px_40px_rgba(50,39,31,0.1)] xl:p-4">
            <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-[#E8E3DC]" />
            <Skeleton width="58%" height={24} className="mt-4 rounded-full" style={{ backgroundColor: "#E9E2D9" }} />
            <Skeleton width="100%" height={44} className="mt-3" style={{ backgroundColor: "#E4DFD8" }} />
            <Skeleton width="76%" height={28} className="mt-2" style={{ backgroundColor: "#ECE8E2" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
