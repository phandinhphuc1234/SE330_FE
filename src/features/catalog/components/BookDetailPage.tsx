"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/context/AuthContext";
import { createHold } from "@/features/circulation/services/circulationService";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { Book } from "../types/catalog.type";
import { getBook, getBooks } from "../services/catalogService";
import {
  authorLabel,
  bookCoverAlt,
  bookCoverUrl,
  bookIdOf,
  categoryIdOf,
  categoryLabel,
  firstAuthorBio,
} from "./catalogHelpers";
import { CatalogShell, Notice } from "./CatalogShell";
import { EbookBorrowButton } from "@/features/ebook/components/EbookBorrowButton";

const copy = {
  en: {
    eyebrow: "Book detail",
    fallbackTitle: "Library record",
    description: "Inspect metadata and availability for this title.",
    back: "Back to books",
    loadError: "Could not load book details.",
    loginFirst: "Please log in before placing a hold.",
    holdPlaced: "Hold was placed. You can track it in My Holds.",
    holdError: "Could not place hold.",
    by: "by",
    unknownAuthor: "Unknown author",
    isbn: "ISBN",
    availability: "Availability",
    copiesAvailable: "copies available",
    availableTitle: "Copies are available on the shelf.",
    availableBody: "Please visit the circulation desk to borrow this title. Holds are opened only when all copies are checked out.",
    unavailableTitle: "All copies are currently checked out.",
    unavailableBody: "Place a hold and we will reserve the next available copy for you.",
    placingHold: "Placing hold...",
    placeHold: "Place Hold",
    myHolds: "My Holds",
    verifying: "Availability is being verified. Please check with the circulation desk for the latest copy status.",
    readThisBook: "Read This Book",
    reserveThisBook: "Reserve This Book",
    bookSummary: "Book Summary",
    aboutAuthor: "About the Author",
    relatedBooks: "Related Books",
    viewAll: "View all",
    original: "The original",
    published: "Published",
    editionLabel: "Edition",
    availableCopies: "Available",
    totalCopies: "Total copies",
    summaryText:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae libero vel lectus facilisis tincidunt. Curabitur non lorem at erat pretium malesuada. Suspendisse potenti. Donec lacinia, nibh a gravida pretium, massa arcu volutpat arcu, vitae convallis justo tortor in mi.",
    authorFallback:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. This author profile is being completed by the library team and will include biographical notes, publication context, and related works.",
    bibliographic: "Bibliographic details",
    fields: {
      publishedDate: "Published date",
      language: "Language",
      edition: "Edition",
      totalCopies: "Total copies",
      availableCopies: "Available copies",
      category: "Category",
    },
    none: "N/A",
  },
  vi: {
    eyebrow: "Chi tiết sách",
    fallbackTitle: "Hồ sơ thư viện",
    description: "Xem thông tin mô tả và tình trạng bản sao của đầu sách này.",
    back: "Quay lại danh sách",
    loadError: "Không thể tải chi tiết sách.",
    loginFirst: "Vui lòng đăng nhập trước khi đặt giữ sách.",
    holdPlaced: "Đã đặt giữ sách. Bạn có thể theo dõi trong Lượt đặt giữ.",
    holdError: "Không thể đặt giữ sách.",
    by: "tác giả",
    unknownAuthor: "Chưa rõ tác giả",
    isbn: "ISBN",
    availability: "Tình trạng",
    copiesAvailable: "bản có sẵn",
    availableTitle: "Sách đang có sẵn trên kệ.",
    availableBody: "Vui lòng đến quầy lưu thông để mượn đầu sách này. Chỉ mở đặt giữ khi tất cả bản sao đang được mượn.",
    unavailableTitle: "Tất cả bản sao hiện đang được mượn.",
    unavailableBody: "Hãy đặt giữ, thư viện sẽ dành bản sao tiếp theo cho bạn khi sách được trả.",
    placingHold: "Đang đặt giữ...",
    placeHold: "Đặt giữ",
    myHolds: "Lượt đặt giữ",
    verifying: "Tình trạng bản sao đang được kiểm tra. Vui lòng hỏi quầy lưu thông để biết thông tin mới nhất.",
    readThisBook: "Mượn sách này",
    reserveThisBook: "Đặt giữ sách này",
    bookSummary: "Tóm tắt sách",
    aboutAuthor: "Về tác giả",
    relatedBooks: "Sách liên quan",
    viewAll: "Xem tất cả",
    original: "Bản gốc",
    published: "Xuất bản",
    editionLabel: "Ấn bản",
    availableCopies: "Có sẵn",
    totalCopies: "Tổng bản",
    summaryText:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae libero vel lectus facilisis tincidunt. Curabitur non lorem at erat pretium malesuada. Suspendisse potenti. Donec lacinia, nibh a gravida pretium, massa arcu volutpat arcu, vitae convallis justo tortor in mi.",
    authorFallback:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Hồ sơ tác giả đang được thư viện hoàn thiện và sẽ bổ sung tiểu sử, bối cảnh xuất bản cùng các tác phẩm liên quan.",
    bibliographic: "Thông tin thư mục",
    fields: {
      publishedDate: "Ngày xuất bản",
      language: "Ngôn ngữ",
      edition: "Ấn bản",
      totalCopies: "Tổng bản sao",
      availableCopies: "Bản có sẵn",
      category: "Danh mục",
    },
    none: "Không có",
  },
};

export function BookDetailPage() {
  const { locale } = useLanguage();
  const text = copy[locale];
  const params = useParams<{ bookId: string }>();
  const { accessToken, isAuthenticated, refresh } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isPlacingHold, setIsPlacingHold] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);
  const hasAvailabilityCount = typeof book?.availableCopies === "number";
  const hasAvailableCopies = hasAvailabilityCount && Number(book?.availableCopies) > 0;
  const canPlaceHold = hasAvailabilityCount && Number(book?.availableCopies) <= 0;

  useEffect(() => {
    let isMounted = true;

    getBook(params.bookId)
      .then((data) => {
        if (!isMounted) return;
        setBook(data);
        setError("");
        const categoryId = categoryIdOf(data);
        if (!categoryId) {
          setRelatedBooks([]);
          return;
        }

        getBooks({ categoryId, size: "8", page: "0", sort: "title,asc" })
          .then((relatedPage) => {
            if (!isMounted) return;
            setRelatedBooks(relatedPage.items.filter((item) => bookIdOf(item) !== bookIdOf(data)).slice(0, 6));
          })
          .catch(() => {
            if (isMounted) setRelatedBooks([]);
          });
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : text.loadError);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [params.bookId, text.loadError]);

  async function handlePlaceHold() {
    if (isPlacingHold) return;

    if (!isAuthenticated) {
      setError(text.loginFirst);
      return;
    }

    try {
      setIsPlacingHold(true);
      await createHold(params.bookId, accessToken, refreshAccessToken);
      setMessage(text.holdPlaced);
      setError("");
    } catch (holdError) {
      setError(holdError instanceof Error ? holdError.message : text.holdError);
    } finally {
      setIsPlacingHold(false);
    }
  }

  return (
    <CatalogShell
      wide
      frameless
      eyebrow={text.eyebrow}
      title={book?.title ?? text.fallbackTitle}
      description={text.description}
      actions={<AnimatedActionLink href="/books">{text.back}</AnimatedActionLink>}
    >
      {message && (
        <div className="mb-5">
          <Notice tone="success" message={message} />
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Notice tone="error" message={error} />
        </div>
      )}

      {isLoading ? (
        <BookDetailSkeleton />
      ) : book ? (
        <BookDetailContent
          book={book}
          relatedBooks={relatedBooks}
          text={text}
          hasAvailableCopies={hasAvailableCopies}
          canPlaceHold={canPlaceHold}
          isPlacingHold={isPlacingHold}
          onPlaceHold={handlePlaceHold}
        />
      ) : null}
    </CatalogShell>
  );
}

function BookDetailContent({
  book,
  relatedBooks,
  text,
  hasAvailableCopies,
  canPlaceHold,
  isPlacingHold,
  onPlaceHold,
}: {
  book: Book;
  relatedBooks: Book[];
  text: typeof copy.en;
  hasAvailableCopies: boolean;
  canPlaceHold: boolean;
  isPlacingHold: boolean;
  onPlaceHold: () => void;
}) {
  const coverUrl = bookCoverUrl(book, "detail");
  const authorNames = (book.authors ?? []).map(authorLabel).join(", ") || text.unknownAuthor;
  const authorBio = firstAuthorBio(book) || text.authorFallback;
  const actionLabel = hasAvailableCopies ? text.readThisBook : text.reserveThisBook;
  const [activeTab, setActiveTab] = useState<"summary" | "author">("summary");

  return (
    <div>
      <section className="bg-white p-6 shadow-[0_22px_70px_rgba(17,24,39,0.10)] ring-1 ring-[#EDEDF2] md:p-8 xl:p-10">
        <div className="grid gap-10 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] 2xl:grid-cols-[420px_1fr]">
          <div className="mx-auto w-full max-w-[260px] lg:max-w-none">
            <div className="relative aspect-[2/3] overflow-hidden rounded-sm bg-[#F3F4F6] shadow-[0_22px_50px_rgba(17,24,39,0.22)] ring-1 ring-black/5">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={bookCoverAlt(book)}
                  fill
                  priority
                  unoptimized
                  sizes="(min-width: 1280px) 320px, (min-width: 1024px) 280px, 260px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col justify-between bg-[linear-gradient(135deg,#111827_0%,#3f3f46_52%,#000000_100%)] p-6 text-white">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">{categoryLabel(book.category)}</span>
                  <h2 className="text-3xl font-black leading-tight text-white">{book.title}</h2>
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/60">The Athenaeum</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/20 to-transparent" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#111827] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {categoryLabel(book.category)}
              </span>
              <span className="rounded-full border border-[#D9DCE8] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                {text.original}
              </span>
            </div>

            <h2 className="mt-5 max-w-4xl text-3xl font-black uppercase leading-tight tracking-tight text-[#111827] md:text-4xl">
              {book.title}
            </h2>
            <p className="mt-3 text-sm font-semibold text-[#6B7280]">
              {text.by}: <span className="text-[#111827]">{authorNames}</span>
              {book.publishedDate ? <span> | {text.published}: {book.publishedDate}</span> : null}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <BookMetaPill label={text.isbn} value={book.isbn} />
              <BookMetaPill label={text.availableCopies} value={String(book.availableCopies ?? 0)} />
              <BookMetaPill label={text.totalCopies} value={String(book.totalCopies ?? 0)} />
              <BookMetaPill label={text.editionLabel} value={book.edition || text.none} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={hasAvailableCopies ? undefined : onPlaceHold}
                disabled={hasAvailableCopies || (!canPlaceHold && !hasAvailableCopies) || isPlacingHold}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#E60028] px-6 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(230,0,40,0.22)] transition hover:-translate-y-0.5 hover:bg-[#c90022] disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:translate-y-0"
              >
                {isPlacingHold ? text.placingHold : actionLabel}
              </button>
              {!hasAvailableCopies && canPlaceHold ? (
                <Link href="/user/holds" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D9DCE8] px-5 py-3 text-sm font-bold text-[#111827] transition hover:border-black hover:bg-[#F8F9FA]">
                  {text.myHolds}
                </Link>
              ) : null}
              {book.ebookUrl && (
                <EbookBorrowButton
                  bookId={bookIdOf(book) ?? 0}
                  bookTitle={book.title}
                  hasEbook={true}
                />
              )}
            </div>
            {book.ebookUrl && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 ring-1 ring-blue-200">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-blue-700">Available to read online</span>
              </div>
            )}

            <div className="mt-7 border-b border-[#EDEDF2]" role="tablist" aria-label="Book information tabs">
              <div className="flex flex-wrap gap-8 text-sm font-black">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "summary"}
                  onClick={() => setActiveTab("summary")}
                  className={`border-b-2 pb-3 transition ${
                    activeTab === "summary"
                      ? "border-[#E60028] text-[#E60028]"
                      : "border-transparent text-[#111827] hover:border-black/25 hover:text-black"
                  }`}
                >
                  {text.bookSummary}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "author"}
                  onClick={() => setActiveTab("author")}
                  className={`border-b-2 pb-3 transition ${
                    activeTab === "author"
                      ? "border-[#E60028] text-[#E60028]"
                      : "border-transparent text-[#111827] hover:border-black/25 hover:text-black"
                  }`}
                >
                  {text.aboutAuthor}
                </button>
              </div>
            </div>

            <div className="mt-5 max-w-5xl text-sm leading-7 text-[#4B5563]">
              {activeTab === "summary" ? (
                <div role="tabpanel">
                  <h3 className="sr-only">{text.bookSummary}</h3>
                  <p>{text.summaryText}</p>
                  <p className="mt-4">{text.summaryText}</p>
                </div>
              ) : (
                <div role="tabpanel" className="rounded-2xl border border-[#EDEDF2] bg-[#F8F9FA] p-5">
                  <h3 className="text-sm font-black uppercase tracking-wide text-[#111827]">{text.aboutAuthor}</h3>
                  <p className="mt-3">{authorBio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {relatedBooks.length ? (
          <div className="mt-10 border-t border-[#EDEDF2] pt-8">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-black text-[#111827]">{text.relatedBooks}</h3>
              <Link href={`/books?categoryId=${categoryIdOf(book)}`} className="text-sm font-black text-[#E60028] transition hover:text-[#111827]">
                {text.viewAll}
              </Link>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
              {relatedBooks.map((relatedBook) => (
                <RelatedBookCard key={bookIdOf(relatedBook) || relatedBook.isbn} book={relatedBook} />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function BookMetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#EDEDF2] bg-[#F8F9FA] px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-[#111827]">{value}</p>
    </div>
  );
}

function RelatedBookCard({ book }: { book: Book }) {
  const coverUrl = bookCoverUrl(book, "thumbnail");

  return (
    <Link href={`/books/${bookIdOf(book)}`} className="group block outline-none">
      <div className="relative aspect-[2/3] overflow-hidden rounded-sm bg-[#F3F4F6] shadow-[0_10px_24px_rgba(17,24,39,0.14)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_30px_rgba(17,24,39,0.2)] group-focus-visible:ring-4 group-focus-visible:ring-[#E60028]/25">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={bookCoverAlt(book)}
            fill
            unoptimized
            sizes="(min-width: 1280px) 160px, (min-width: 768px) 30vw, 45vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-end bg-[linear-gradient(135deg,#111827,#000000)] p-3">
            <p className="line-clamp-4 text-sm font-black text-white">{book.title}</p>
          </div>
        )}
      </div>
      <h4 className="mt-3 line-clamp-2 text-sm font-black leading-snug text-[#111827] transition group-hover:text-[#E60028]">
        {book.title}
      </h4>
      <p className="mt-1 line-clamp-1 text-xs font-medium text-[#6B7280]">
        {(book.authors ?? []).map(authorLabel).join(", ")}
      </p>
    </Link>
  );
}

function AnimatedActionLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center justify-center gap-2 rounded-full border border-[#D9DCE8] px-5 py-3 text-sm font-bold text-[#000054] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#337AB7] hover:bg-white hover:text-[#E60028] hover:shadow-lg hover:shadow-[#000054]/10 active:translate-y-0 active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-[#337AB7]/20"
    >
      <span aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-1">
        ←
      </span>
      {children}
    </Link>
  );
}

function BookDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="border border-[#EDEDF2] bg-[#F8F9FA] p-6">
        <Skeleton variant="rectangular" className="h-6 w-32 rounded-full" />
        <Skeleton variant="text" className="mt-5 h-9 w-3/4" />
        <Skeleton variant="text" className="mt-3 h-5 w-1/2" />
        <Skeleton variant="rectangular" className="mt-6 h-8 w-40 rounded-full" />
      </section>

      <section className="border border-[#EDEDF2] bg-white p-6">
        <Skeleton variant="text" className="h-6 w-32" />
        <Skeleton variant="rectangular" className="mt-4 h-8 w-40 rounded-full" />
        <Skeleton variant="rectangular" className="mt-5 h-12 w-full rounded-full" />
        <Skeleton variant="rectangular" className="mt-3 h-12 w-full rounded-full" />
      </section>

      <section className="border border-[#EDEDF2] bg-white p-6 lg:col-span-2">
        <Skeleton variant="text" className="h-6 w-48" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-[#EDEDF2] bg-[#F8F9FA] p-4">
              <Skeleton variant="text" className="h-3 w-24" />
              <Skeleton variant="text" className="mt-2 h-5 w-32" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
