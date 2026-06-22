"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError } from "@/types/api.type";
import { useAuth } from "@/features/auth/context/AuthContext";
import { createHold, getMyHolds } from "@/features/circulation/services/circulationService";
import { HoldRecord } from "@/features/circulation/types/circulation.type";
import { borrowEbook } from "@/features/ebook/services/ebookService";
import { EbookLoan } from "@/features/ebook/types/ebook.type";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { createPayment } from "@/features/payments/services/paymentService";
import { Book, BookEbookInfo } from "../types/catalog.type";
import { getBook, getBookEbookInfo, getBooks } from "../services/catalogService";
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

const copy = {
  en: {
    eyebrow: "Book detail",
    fallbackTitle: "Library record",
    description: "Inspect metadata, physical availability, and ebook access for this title.",
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
    ebookAccess: "Ebook Access",
    ebookInfoError: "Could not load ebook access information.",
    ebookUnavailable: "Ebook not available",
    ebookUnavailableBody: "This title does not currently have an online reading copy.",
    availableNow: "Available now",
    unavailableNow: "Unavailable",
    availabilityStatus: "Availability",
    maxLicenses: "License limit",
    loanDuration: "Loan duration",
    daysUnit: "days",
    access: "Access",
    file: "File",
    freeAccess: "Free access",
    paidAccess: "Paid access",
    onlineReaderOnly: "Online reader only",
    borrowEbook: "Borrow Ebook",
    borrowingEbook: "Borrowing...",
    readEbook: "Read ebook",
    signInToBorrow: "Sign in to borrow",
    signInToPay: "Sign in to pay",
    paymentRequired: "Payment required",
    payEbook: "Pay with VNPAY",
    creatingPayment: "Creating payment...",
    paymentPendingHelp: "Complete payment to unlock this ebook. Access is granted after VNPAY confirms the transaction.",
    paymentCreateError: "Could not create ebook payment.",
    paymentMissingTarget: "This ebook is missing payment metadata.",
    paymentRedirectError: "Payment was created, but the provider URL was not returned.",
    paymentUnavailable: "Complete payment to unlock this ebook.",
    ebookBorrowed: "Your ebook loan is active.",
    ebookBorrowError: "Could not borrow ebook.",
    manageEbooks: "Manage ebooks",
    yourStatus: "Your Status",
    notBorrowedYet: "Not borrowed yet",
    notBorrowedBody: "You have not borrowed this ebook yet.",
    signedOutStatus: "Sign in to borrow",
    signedOutBody: "Use your member account to borrow and read this ebook.",
    activeLoan: "Active ebook loan",
    activeLoanBody: "Your online reading session is ready.",
    expires: "Expires",
    actions: "Actions",
    addWishlist: "Add to wishlist",
    shareBook: "Share this book",
    reportIssue: "Report an issue",
    aboutEbookAccess: "About ebook access",
    aboutEbookText: "Ebooks can only be read online through our secure reader. Downloading, printing, and sharing are disabled to protect copyright.",
    lastUpdated: "Last updated",
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
    description: "Xem thông tin mô tả, tình trạng bản in và quyền truy cập ebook của đầu sách này.",
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
    ebookAccess: "Quyền truy cập ebook",
    ebookInfoError: "Không thể tải thông tin ebook.",
    ebookUnavailable: "Chưa có ebook",
    ebookUnavailableBody: "Đầu sách này hiện chưa có bản đọc trực tuyến.",
    availableNow: "Đang có thể mượn",
    unavailableNow: "Tạm hết lượt",
    availabilityStatus: "Tình trạng",
    maxLicenses: "Giới hạn lượt mượn",
    loanDuration: "Thời hạn mượn",
    daysUnit: "ngày",
    access: "Truy cập",
    file: "Tệp",
    freeAccess: "Miễn phí",
    paidAccess: "Có phí",
    onlineReaderOnly: "Chỉ đọc online",
    borrowEbook: "Mượn ebook",
    borrowingEbook: "Đang mượn...",
    readEbook: "Đọc ebook",
    signInToBorrow: "Đăng nhập để mượn",
    signInToPay: "Đăng nhập để thanh toán",
    paymentRequired: "Cần thanh toán",
    payEbook: "Thanh toán VNPAY",
    creatingPayment: "Đang tạo thanh toán...",
    paymentPendingHelp: "Hoàn tất thanh toán để mở quyền đọc ebook. Quyền truy cập được cấp sau khi VNPAY xác nhận giao dịch.",
    paymentCreateError: "Không thể tạo thanh toán ebook.",
    paymentMissingTarget: "Ebook này đang thiếu dữ liệu thanh toán.",
    paymentRedirectError: "Đã tạo thanh toán nhưng chưa nhận được đường dẫn nhà cung cấp.",
    paymentUnavailable: "Hoàn tất thanh toán để mở quyền đọc ebook.",
    ebookBorrowed: "Lượt mượn ebook của bạn đang hoạt động.",
    ebookBorrowError: "Không thể mượn ebook.",
    manageEbooks: "Quản lý ebook",
    yourStatus: "Trạng thái của bạn",
    notBorrowedYet: "Chưa mượn",
    notBorrowedBody: "Bạn chưa mượn ebook này.",
    signedOutStatus: "Đăng nhập để mượn",
    signedOutBody: "Dùng tài khoản thành viên để mượn và đọc ebook.",
    activeLoan: "Đang mượn ebook",
    activeLoanBody: "Phiên đọc online của bạn đã sẵn sàng.",
    expires: "Hết hạn",
    actions: "Thao tác",
    addWishlist: "Thêm vào yêu thích",
    shareBook: "Chia sẻ sách",
    reportIssue: "Báo lỗi",
    aboutEbookAccess: "Về quyền truy cập ebook",
    aboutEbookText: "Ebook chỉ được đọc online qua trình đọc bảo mật. Tải xuống, in ấn và chia sẻ bị tắt để bảo vệ bản quyền.",
    lastUpdated: "Cập nhật",
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
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [ebookInfo, setEbookInfo] = useState<BookEbookInfo | null>(null);
  const [ebookInfoError, setEbookInfoError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getBook(params.bookId)
      .then((data) => {
        if (!isMounted) return;
        setBook(data);
        setError("");
        getBookEbookInfo(params.bookId)
          .then((info) => {
            if (!isMounted) return;
            setEbookInfo(info);
            setEbookInfoError("");
          })
          .catch((ebookError) => {
            if (!isMounted) return;
            setEbookInfo(null);
            setEbookInfoError(ebookError instanceof ApiError && ebookError.status === 404 ? "" : text.ebookInfoError);
          });

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
  }, [params.bookId, text.ebookInfoError, text.loadError]);

  return (
    <CatalogShell
      wide
      frameless
      hideHeader
      eyebrow={text.eyebrow}
      title={book?.title ?? text.fallbackTitle}
      description={text.description}
    >
      <div className="mx-auto w-full max-w-[1296px]">
        <section className="mb-2 flex flex-col justify-between gap-4 px-1 py-1 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <p className="text-sm font-black text-[#E60028]">‹ {text.eyebrow}</p>
            <h1 className="mt-2 break-words font-serif text-4xl font-bold leading-tight text-[#0B1026] md:text-5xl">{book?.title ?? text.fallbackTitle}</h1>
            <p className="mt-2 text-sm font-medium text-[#59637A]">{text.description}</p>
          </div>
          <AnimatedActionLink href="/books">{text.back}</AnimatedActionLink>
        </section>

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
            ebookInfo={ebookInfo}
            ebookInfoError={ebookInfoError}
          />
        ) : null}
      </div>
    </CatalogShell>
  );
}

function BookDetailContent({
  book,
  relatedBooks,
  text,
  ebookInfo,
  ebookInfoError,
}: {
  book: Book;
  relatedBooks: Book[];
  text: typeof copy.en;
  ebookInfo: BookEbookInfo | null;
  ebookInfoError: string;
}) {
  const { accessToken, isAuthenticated, refresh } = useAuth();
  const { locale } = useLanguage();
  const coverUrl = bookCoverUrl(book, "detail");
  const authorNames = (book.authors ?? []).map(authorLabel).join(", ") || text.unknownAuthor;
  const authorBio = firstAuthorBio(book) || fallbackAuthorBio(authorNames, text);
  const [ebookLoan, setEbookLoan] = useState<EbookLoan | null>(null);
  const [isBorrowingEbook, setIsBorrowingEbook] = useState(false);
  const [ebookBorrowError, setEbookBorrowError] = useState("");
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [userHolds, setUserHolds] = useState<HoldRecord[]>([]);
  const [isPlacingHold, setIsPlacingHold] = useState(false);
  const [holdError, setHoldError] = useState("");
  const [holdSuccess, setHoldSuccess] = useState("");
  const numericBookId = Number(bookIdOf(book));
  const bookSummary = summaryForBook(book, text);

  useEffect(() => {
    if (!isAuthenticated || !Number.isFinite(numericBookId)) return;

    let isMounted = true;
    const refreshAccessToken = async () => (await refresh())?.accessToken ?? null;

    getMyHolds(accessToken, refreshAccessToken)
      .then((holds) => {
        if (isMounted) setUserHolds(holds.filter((h) => Number(h.bookId ?? h.id) === numericBookId));
      })
      .catch(() => {
        if (isMounted) setUserHolds([]);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, numericBookId, accessToken, refresh]);

  async function handlePlaceHold() {
    if (isPlacingHold || !Number.isFinite(numericBookId)) return;

    if (!isAuthenticated) {
      setHoldError(text.loginFirst);
      return;
    }

    setIsPlacingHold(true);
    setHoldError("");
    setHoldSuccess("");

    try {
      const refreshAccessToken = async () => (await refresh())?.accessToken ?? null;
      const newHold = await createHold(String(numericBookId), accessToken, refreshAccessToken);
      setUserHolds((prev) => [newHold, ...prev]);
      setHoldSuccess(text.holdPlaced);
    } catch (error) {
      setHoldError(error instanceof Error ? error.message : text.holdError);
    } finally {
      setIsPlacingHold(false);
    }
  }

  async function handleBorrowEbook() {
    if (isBorrowingEbook || !Number.isFinite(numericBookId) || !ebookInfo) return;

    if (ebookInfo.requiresPayment) {
      setEbookBorrowError(text.paymentUnavailable);
      return;
    }

    if (!isAuthenticated) {
      setEbookBorrowError(text.signInToBorrow);
      return;
    }

    setIsBorrowingEbook(true);
    setEbookBorrowError("");

    try {
      const refreshAccessToken = async () => (await refresh())?.accessToken ?? null;
      const loan = await borrowEbook(numericBookId, accessToken, refreshAccessToken);
      setEbookLoan(loan);
    } catch (borrowError) {
      setEbookBorrowError(borrowError instanceof Error ? borrowError.message : text.ebookBorrowError);
    } finally {
      setIsBorrowingEbook(false);
    }
  }

  async function handleCreateEbookPayment() {
    if (isCreatingPayment || !ebookInfo) return;

    const targetId = ebookInfo.bookEbookId;

    if (typeof targetId !== "number") {
      setPaymentError(text.paymentMissingTarget);
      return;
    }

    if (!isAuthenticated) {
      setPaymentError(text.signInToPay);
      return;
    }

    setIsCreatingPayment(true);
    setPaymentError("");
    setEbookBorrowError("");

    try {
      const refreshAccessToken = async () => (await refresh())?.accessToken ?? null;
      const payment = await createPayment(
        {
          purpose: "EBOOK_PAYMENT",
          targetType: "BOOK_EBOOK",
          targetId,
          provider: "VNPAY",
          locale: locale === "vi" ? "vn" : "en",
        },
        createPaymentIdempotencyKey(targetId),
        accessToken,
        refreshAccessToken,
      );

      rememberPendingEbookPayment(payment.paymentCode, payment.paymentId, targetId);

      if (payment.paymentUrl) {
        window.location.assign(payment.paymentUrl);
        return;
      }

      setPaymentError(text.paymentRedirectError);
    } catch (paymentCreateError) {
      setPaymentError(paymentCreateError instanceof Error ? paymentCreateError.message : text.paymentCreateError);
    } finally {
      setIsCreatingPayment(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#D8DEE8] bg-white p-4 pt-6 shadow-[0_22px_70px_rgba(15,23,42,0.07)] md:p-5 lg:p-6">
        <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[280px] lg:max-w-[300px] xl:max-w-[320px]">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-[#F3F4F6] shadow-[0_24px_55px_rgba(15,23,42,0.16)] ring-1 ring-black/5">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={bookCoverAlt(book)}
                  fill
                  priority
                  unoptimized
                  sizes="(min-width: 1280px) 320px, (min-width: 1024px) 300px, 280px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col justify-between bg-[linear-gradient(135deg,#111827_0%,#3f3f46_52%,#000000_100%)] p-6 text-white">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">{categoryLabel(book.category)}</span>
                  <h2 className="text-3xl font-black leading-tight text-white">{book.title}</h2>
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/60">The Athenaeum</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-7 bg-gradient-to-r from-black/20 to-transparent" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#111827] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                  {categoryLabel(book.category)}
                </span>
                <span className="rounded-full border border-[#D8DEE8] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#6B7280]">
                  {text.original}
                </span>
              </div>

              <h2 className="mt-2 max-w-4xl break-words font-serif text-4xl font-bold leading-tight text-[#0B1026] md:text-[2.75rem] xl:text-[3rem]">
                {book.title}
              </h2>
              <p className="mt-2 text-sm font-semibold text-[#59637A]">
                {text.by}: <span className="text-[#111827]">{authorNames}</span>
                {book.publishedDate ? <span> | {text.published}: {book.publishedDate}</span> : null}
              </p>
            </div>

            <DetailActionGroup text={text} />

            <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <BookMetaPill icon="book-open" label={text.isbn} value={book.isbn} tone="rose" />
              <BookMetaPill icon="clock" label={text.availableCopies} value={String(book.availableCopies ?? 0)} tone="amber" />
              <BookMetaPill icon="book" label={text.totalCopies} value={String(book.totalCopies ?? 0)} tone="slate" />
              <BookMetaPill icon="bookmark" label={text.editionLabel} value={book.edition || text.none} tone="rose" />
            </div>

            <div className="mt-2">
              <PhysicalAvailabilityPanel
                book={book}
                userHolds={userHolds}
                isPlacingHold={isPlacingHold}
                holdError={holdError}
                holdSuccess={holdSuccess}
                text={text}
                onPlaceHold={handlePlaceHold}
              />
            </div>

            <div className="mt-2">
              <EbookAccessPanel
                ebookInfo={ebookInfo}
                ebookInfoError={ebookInfoError}
                loan={ebookLoan}
                bookId={numericBookId}
                isAuthenticated={isAuthenticated}
                isBorrowing={isBorrowingEbook}
                isCreatingPayment={isCreatingPayment}
                borrowError={ebookBorrowError}
                paymentError={paymentError}
                text={text}
                onBorrow={handleBorrowEbook}
                onPay={handleCreateEbookPayment}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.95fr]">
        <InfoPanel title={text.bookSummary}>
          <p>{bookSummary}</p>
          {bookSummary === text.summaryText ? <p>{text.summaryText}</p> : null}
        </InfoPanel>
        <AuthorPanel authorNames={authorNames} authorBio={authorBio} text={text} />
      </div>

      {relatedBooks.length ? (
        <section className="rounded-2xl border border-[#D8DEE8] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
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
        </section>
      ) : null}
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="relative min-h-[205px] overflow-hidden rounded-2xl border border-[#D8DEE8] bg-white p-5 shadow-[0_18px_46px_rgba(15,23,42,0.055)]">
      <h3 className="text-base font-black text-[#0B1026]">{title}</h3>
      <div className="mt-3 h-0.5 w-28 bg-[#E60028]" />
      <div className="mt-4 max-w-4xl space-y-2 text-[13px] font-medium leading-6 text-[#59637A]">{children}</div>
    </section>
  );
}

function AuthorPanel({
  authorNames,
  authorBio,
  text,
}: {
  authorNames: string;
  authorBio: string;
  text: typeof copy.en;
}) {
  const tags = authorTags(authorNames, text);

  return (
    <section className="min-h-[205px] rounded-2xl border border-[#D8DEE8] bg-white p-5 shadow-[0_18px_46px_rgba(15,23,42,0.055)]">
      <h3 className="text-base font-black text-[#0B1026]">{text.aboutAuthor}</h3>
      <div className="mt-3 h-0.5 w-28 bg-[#E60028]" />
      <div className="mt-4 flex gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#EEF2F7] text-lg font-black text-[#0B1026] ring-1 ring-[#D8DEE8]">
          {authorInitials(authorNames)}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-black text-[#0B1026]">{authorNames}</h4>
          <p className="mt-1 line-clamp-4 text-[13px] font-medium leading-5 text-[#59637A]">{authorBio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-[#D8DEE8] bg-white px-3 py-1 text-xs font-bold text-[#61708F]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function summaryForBook(book: Book, text: typeof copy.en) {
  if (typeof book.category === "object" && book.category?.description?.trim()) {
    return book.category.description.trim();
  }

  if (book.title.trim().toLowerCase() === "số đỏ") {
    return "Số Đỏ là tiểu thuyết trào phúng nổi tiếng của nhà văn Vũ Trọng Phụng, xuất bản lần đầu năm 1936. Tác phẩm phản ánh xã hội Việt Nam nửa phong kiến nửa thực dân với giọng văn châm biếm sắc sảo, điêu tả sự tha hóa, lố lăng và những mánh đời nhỏ bé bị cuốn vào vòng xoáy danh vọng và vật chất. Đây là một trong những tác phẩm tiêu biểu nhất của nền văn học hiện thực phê phán Việt Nam.";
  }

  return text.summaryText;
}

function fallbackAuthorBio(authorNames: string, text: typeof copy.en) {
  if (authorNames.toLowerCase().includes("vũ trọng phụng")) {
    return "Nhà văn hiện thực trào phúng xuất sắc của Việt Nam. Ông nổi tiếng với những tác phẩm phơi bày thói hư tật xấu trong xã hội đương thời bằng giọng văn sắc bén và sâu cay.";
  }

  return text.authorFallback;
}

function authorTags(authorNames: string, text: typeof copy.en) {
  if (authorNames.toLowerCase().includes("vũ trọng phụng")) {
    return ["Trào phúng", "Hiện thực phê phán", "Tác phẩm kinh điển"];
  }

  return [text.original, text.relatedBooks];
}

function authorInitials(authorNames: string) {
  return authorNames
    .split(/[,\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function createPaymentIdempotencyKey(targetId: number) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `ebook-${targetId}-${randomPart}`;
}

function rememberPendingEbookPayment(paymentCode: string | undefined, paymentId: number | undefined, targetId: number) {
  if (typeof window === "undefined" || (!paymentCode && typeof paymentId !== "number")) return;

  try {
    window.sessionStorage.setItem(
      "athenaeum.pendingEbookPayment",
      JSON.stringify({
        paymentCode,
        paymentId,
        targetId,
        createdAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Session storage is a convenience only; payment still continues without it.
  }
}

function DetailActionGroup({ text }: { text: typeof copy.en }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 sm:justify-end">
      <DetailActionButton icon="heart" label={text.addWishlist} />
      <DetailActionButton icon="arrow-right" label={text.shareBook} />
      <DetailActionButton icon="alert-circle" label={text.reportIssue} />
    </div>
  );
}

function DetailActionButton({ icon, label }: { icon: "heart" | "arrow-right" | "alert-circle"; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[#D8DEE8] bg-white px-3 text-[11px] font-black leading-none text-[#0B1026] shadow-[0_6px_14px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#B30D2D] hover:text-[#B30D2D]"
    >
      <Icon name={icon} size={14} aria-hidden="true" className="shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function BookMetaPill({
  icon,
  label,
  value,
  tone = "slate",
}: {
  icon: "book-open" | "clock" | "book" | "bookmark";
  label: string;
  value: string;
  tone?: "rose" | "amber" | "slate";
}) {
  const toneClass =
    tone === "rose"
      ? "bg-[#FDF0F3] text-[#B30D2D]"
      : tone === "amber"
        ? "bg-[#FFF7ED] text-[#D97706]"
        : "bg-[#F4F6FA] text-[#0B1026]";

  return (
    <div className="flex min-h-[66px] items-center gap-3 rounded-xl border border-[#E1E6F0] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.045)]">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${toneClass}`}>
        <Icon name={icon} size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#6B7280]">{label}</p>
        <p className="mt-1 truncate text-base font-black text-[#111827]">{value}</p>
      </div>
    </div>
  );
}

function EbookAccessPanel({
  ebookInfo,
  ebookInfoError,
  loan,
  bookId,
  isAuthenticated,
  isBorrowing,
  isCreatingPayment,
  borrowError,
  paymentError,
  text,
  onBorrow,
  onPay,
}: {
  ebookInfo: BookEbookInfo | null;
  ebookInfoError: string;
  loan: EbookLoan | null;
  bookId: number;
  isAuthenticated: boolean;
  isBorrowing: boolean;
  isCreatingPayment: boolean;
  borrowError: string;
  paymentError: string;
  text: typeof copy.en;
  onBorrow: () => void;
  onPay: () => void;
}) {
  const isAvailable = isEbookAvailable(ebookInfo);
  const requiresPayment = Boolean(ebookInfo?.requiresPayment);
  const hasActiveLoan = loan?.status === "ACTIVE";

  return (
    <section className="rounded-xl border border-[#E1E6F0] bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FDF0F3] text-[#B30D2D]">
              <Icon name="book-open" size={19} aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-serif text-xl font-bold leading-tight text-[#0B1026]">{text.ebookAccess}</h3>
              {ebookInfo?.updatedAt ? (
                <p className="mt-0.5 text-xs font-semibold text-[#61708F]">
                  {text.lastUpdated}: {formatDateValue(ebookInfo.updatedAt, text)}
                </p>
              ) : null}
            </div>
          </div>

          {ebookInfoError ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
              {ebookInfoError}
            </p>
          ) : null}

          <div className="mt-2 divide-y divide-[#E1E6F0]">
            <EbookInfoRow icon="check" label={text.availabilityStatus} value={isAvailable ? text.availableNow : text.unavailableNow} />
            <EbookInfoRow icon="users" label={text.maxLicenses} value={formatLicenseLimit(ebookInfo, text)} />
            <EbookInfoRow icon="clock" label={text.loanDuration} value={formatLoanDuration(ebookInfo?.loanDurationDays, text)} />
            <EbookInfoRow icon="bookmark" label={text.access} value={formatEbookAccess(ebookInfo, text)} />
            <EbookInfoRow icon="file" label={text.file} value={formatEbookFile(ebookInfo, text)} />
          </div>
        </div>

        <div className="flex min-h-full flex-col justify-center border-t border-[#E1E6F0] pt-4 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
          <div className="mb-2 inline-flex w-fit items-center gap-2 self-center rounded-lg bg-[#F7F3FF] px-4 py-2 text-xs font-bold leading-tight text-[#6D5BD0]">
            <Icon name="check" size={14} aria-hidden="true" />
            <span>Secure payment<br />powered by VNPAY</span>
          </div>
          <div className="mx-auto w-full max-w-[214px]">
            {hasActiveLoan ? (
              <Link
                href={`/books/${bookId}/read`}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#B30D2D] px-3 text-[13px] font-black leading-none text-white shadow-[0_16px_32px_rgba(179,13,45,0.24)] transition hover:-translate-y-0.5 hover:bg-[#910A24]"
              >
                <Icon name="book-open" size={18} aria-hidden="true" className="shrink-0" />
                <span className="min-w-0 truncate">{text.readEbook}</span>
              </Link>
            ) : !isAvailable ? (
              <button
                type="button"
                disabled
                className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#A8AFBD] px-3 text-[13px] font-black leading-none text-white"
              >
                <Icon name="book-open" size={18} aria-hidden="true" className="shrink-0" />
                <span className="min-w-0 truncate">{text.ebookUnavailable}</span>
              </button>
            ) : requiresPayment && isAuthenticated ? (
              <button
                type="button"
                onClick={onPay}
                disabled={isCreatingPayment}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#B30D2D] px-3 text-[13px] font-black leading-none text-white shadow-[0_16px_32px_rgba(179,13,45,0.24)] transition hover:-translate-y-0.5 hover:bg-[#910A24] disabled:cursor-not-allowed disabled:bg-[#A8AFBD] disabled:shadow-none disabled:hover:translate-y-0"
              >
                <Icon name={isCreatingPayment ? "clock" : "book-open"} size={18} aria-hidden="true" className="shrink-0" />
                <span className="min-w-0 truncate">{isCreatingPayment ? text.creatingPayment : text.payEbook}</span>
              </button>
            ) : requiresPayment ? (
              <Link
                href="/login"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#B30D2D] px-3 text-[13px] font-black leading-none text-white shadow-[0_16px_32px_rgba(179,13,45,0.24)] transition hover:-translate-y-0.5 hover:bg-[#910A24]"
              >
                <Icon name="user" size={18} aria-hidden="true" className="shrink-0" />
                <span className="min-w-0 truncate">{text.signInToPay}</span>
              </Link>
            ) : isAuthenticated ? (
              <button
                type="button"
                onClick={onBorrow}
                disabled={!isAvailable || isBorrowing}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#B30D2D] px-3 text-[13px] font-black leading-none text-white shadow-[0_16px_32px_rgba(179,13,45,0.24)] transition hover:-translate-y-0.5 hover:bg-[#910A24] disabled:cursor-not-allowed disabled:bg-[#A8AFBD] disabled:shadow-none disabled:hover:translate-y-0"
              >
                <Icon name="book-open" size={18} aria-hidden="true" className="shrink-0" />
                <span className="min-w-0 truncate">{isBorrowing ? text.borrowingEbook : text.borrowEbook}</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#B30D2D] px-3 text-[13px] font-black leading-none text-white shadow-[0_16px_32px_rgba(179,13,45,0.24)] transition hover:-translate-y-0.5 hover:bg-[#910A24]"
              >
                <Icon name="user" size={18} aria-hidden="true" className="shrink-0" />
                <span className="min-w-0 truncate">{text.signInToBorrow}</span>
              </Link>
            )}
          </div>
          <p className="mt-2 text-center text-xs font-medium leading-5 text-[#61708F]">
            {hasActiveLoan ? text.ebookBorrowed : requiresPayment ? text.paymentPendingHelp : isAvailable ? text.onlineReaderOnly : text.ebookUnavailableBody}
          </p>
          {borrowError || paymentError ? (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-bold text-rose-700">
              {borrowError || paymentError}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function EbookInfoRow({ icon, label, value }: { icon: "check" | "users" | "clock" | "bookmark" | "file"; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 text-xs leading-4">
      <div className="flex min-w-0 items-center gap-3 text-[#59637A]">
        <Icon name={icon} size={14} aria-hidden="true" className="shrink-0 text-[#0B1026]" />
        <span className="truncate font-medium">{label}</span>
      </div>
      <span className="min-w-0 max-w-[65%] truncate text-right font-black text-[#0B1026]" title={value}>{value}</span>
    </div>
  );
}

function isEbookAvailable(ebookInfo: BookEbookInfo | null) {
  const status = ebookInfo?.status?.toUpperCase() ?? "ACTIVE";
  return Boolean(ebookInfo?.available && status === "ACTIVE");
}

function formatLicenseLimit(ebookInfo: BookEbookInfo | null, text: typeof copy.en) {
  if (typeof ebookInfo?.maxConcurrentLoans !== "number") {
    return text.none;
  }

  return String(ebookInfo.maxConcurrentLoans);
}

function formatLoanDuration(days: number | null | undefined, text: typeof copy.en) {
  if (typeof days !== "number") {
    return text.none;
  }

  return `${days} ${text.daysUnit}`;
}

function formatEbookAccess(ebookInfo: BookEbookInfo | null, text: typeof copy.en) {
  if (!ebookInfo) {
    return text.ebookUnavailable;
  }

  if (ebookInfo.requiresPayment || ebookInfo.accessType?.toUpperCase() === "PAID") {
    return `${formatAccessFee(ebookInfo, text)} · ${text.onlineReaderOnly}`;
  }

  return `${text.freeAccess} · ${text.onlineReaderOnly}`;
}

function formatAccessFee(ebookInfo: BookEbookInfo, text: typeof copy.en) {
  if (typeof ebookInfo.accessFee !== "number" || ebookInfo.accessFee <= 0) {
    return text.paidAccess;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: ebookInfo.currency || "VND",
      maximumFractionDigits: ebookInfo.currency === "VND" ? 0 : 2,
    }).format(ebookInfo.accessFee);
  } catch {
    return `${ebookInfo.accessFee} ${ebookInfo.currency || ""}`.trim();
  }
}

function formatEbookFile(ebookInfo: BookEbookInfo | null, text: typeof copy.en) {
  if (!ebookInfo) {
    return text.none;
  }

  const format = ebookInfo.format?.toUpperCase() || "PDF";
  const size = formatFileSize(ebookInfo.sizeBytes);

  return size ? `${format} · ${size}` : format;
}

function formatFileSize(sizeBytes?: number | null) {
  if (typeof sizeBytes !== "number" || sizeBytes <= 0) {
    return "";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(sizeBytes) / Math.log(1024)), units.length - 1);
  const value = sizeBytes / 1024 ** unitIndex;
  const fractionDigits = unitIndex === 0 || value >= 10 ? 0 : 1;

  return `${value.toFixed(fractionDigits)} ${units[unitIndex]}`;
}

function formatDateValue(value: string, text: typeof copy.en) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || text.none;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

function PhysicalAvailabilityPanel({
  book,
  userHolds,
  isPlacingHold,
  holdError,
  holdSuccess,
  text,
  onPlaceHold,
}: {
  book: Book;
  userHolds: HoldRecord[];
  isPlacingHold: boolean;
  holdError: string;
  holdSuccess: string;
  text: typeof copy.en;
  onPlaceHold: () => void;
}) {
  const isOutOfStock = (book.availableCopies ?? 0) === 0;
  const hasHold = userHolds.length > 0;

  return (
    <section
      className="relative overflow-hidden rounded-xl border px-4 py-2"
      style={{
        backgroundColor: isOutOfStock ? "rgba(255, 251, 235, 0.78)" : "rgba(236, 253, 245, 0.82)",
        borderColor: isOutOfStock ? "#FDE68A" : "#BBF7D0",
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 xl:pr-24">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                isOutOfStock ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <Icon name={isOutOfStock ? "clock" : "check"} size={19} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base font-black text-[#0B1026]">
                {isOutOfStock ? text.unavailableTitle : text.availableTitle}
              </h3>
              <p className="mt-0.5 text-xs font-medium leading-5 text-[#61708F]">
                {isOutOfStock ? text.unavailableBody : text.availableBody}
              </p>
            </div>
          </div>
        </div>

        {isOutOfStock && (
          <div className="w-full shrink-0 lg:w-56">
            {hasHold ? (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled
                  className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg bg-emerald-500 px-5 text-sm font-black text-white"
                >
                  <Icon name="check" size={20} aria-hidden="true" />
                  {text.holdPlaced.split(".")[0]}
                </button>
                <Link
                  href="/user/holds"
                  className="text-center text-sm font-bold text-[#B30D2D] transition hover:underline"
                >
                  {text.myHolds}
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={onPlaceHold}
                disabled={isPlacingHold}
                className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-[#B30D2D] px-5 text-sm font-black text-white shadow-[0_16px_32px_rgba(179,13,45,0.24)] transition hover:-translate-y-0.5 hover:bg-[#910A24] disabled:cursor-not-allowed disabled:bg-[#A8AFBD] disabled:shadow-none disabled:hover:translate-y-0"
              >
                <Icon name={isPlacingHold ? "clock" : "bookmark"} size={20} aria-hidden="true" />
                {isPlacingHold ? text.placingHold : text.placeHold}
              </button>
            )}
            {holdError || holdSuccess ? (
              <p
                className={`mt-3 rounded-xl border px-3 py-2 text-center text-xs font-bold ${
                  holdError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {holdError || holdSuccess}
              </p>
            ) : null}
          </div>
        )}
      </div>
      {!isOutOfStock ? (
        <Icon
          name="book-open"
          size={76}
          aria-hidden="true"
          className="pointer-events-none absolute right-7 top-1/2 hidden -translate-y-1/2 text-emerald-700/10 xl:block"
        />
      ) : null}
    </section>
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
