"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogShell, Notice } from "@/features/catalog/components/CatalogShell";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { getPaymentByCode } from "../services/paymentService";
import { Payment } from "../types/payment.type";

const copy = {
  en: {
    eyebrow: "Payment",
    title: "Ebook payment status",
    description: "Track the VNPAY transaction created for ebook access.",
    backToBooks: "Back to books",
    myEbooks: "My ebooks",
    loading: "Checking payment status...",
    loadError: "Could not load payment status.",
    continuePayment: "Continue payment",
    paid: "Payment confirmed",
    pending: "Awaiting payment",
    failed: "Payment failed",
    cancelled: "Payment cancelled",
    expired: "Payment expired",
    unknown: "Payment status",
    code: "Payment code",
    provider: "Provider",
    amount: "Amount",
    purpose: "Purpose",
    target: "Target",
    createdAt: "Created",
    expiredAt: "Expires",
    paidAt: "Paid at",
    updatedAt: "Updated",
    responseCode: "Provider code",
    pendingBody: "Complete payment in VNPAY. Ebook access will be granted after the server receives confirmation.",
    paidBody: "Your payment was confirmed. You can check the ebook loan in My ebooks.",
    inactiveBody: "This payment is no longer active. Create a new payment from the book detail page if you still need access.",
    noPaymentUrl: "No provider URL is available for this payment.",
    notAvailable: "N/A",
    viewReceiptDetail: "View receipt detail",
  },
  vi: {
    eyebrow: "Thanh toán",
    title: "Trạng thái thanh toán ebook",
    description: "Theo dõi giao dịch VNPAY được tạo để mở quyền đọc ebook.",
    backToBooks: "Quay lại sách",
    myEbooks: "Ebook của tôi",
    loading: "Đang kiểm tra trạng thái thanh toán...",
    loadError: "Không thể tải trạng thái thanh toán.",
    continuePayment: "Tiếp tục thanh toán",
    paid: "Đã xác nhận thanh toán",
    pending: "Đang chờ thanh toán",
    failed: "Thanh toán thất bại",
    cancelled: "Đã hủy thanh toán",
    expired: "Thanh toán hết hạn",
    unknown: "Trạng thái thanh toán",
    code: "Mã thanh toán",
    provider: "Nhà cung cấp",
    amount: "Số tiền",
    purpose: "Mục đích",
    target: "Đối tượng",
    createdAt: "Tạo lúc",
    expiredAt: "Hết hạn",
    paidAt: "Thanh toán lúc",
    updatedAt: "Cập nhật",
    responseCode: "Mã nhà cung cấp",
    pendingBody: "Hoàn tất thanh toán trong VNPAY. Quyền đọc ebook sẽ được cấp sau khi server nhận xác nhận.",
    paidBody: "Thanh toán đã được xác nhận. Bạn có thể kiểm tra lượt mượn ebook trong Ebook của tôi.",
    inactiveBody: "Giao dịch này không còn hoạt động. Nếu vẫn cần quyền đọc, hãy tạo thanh toán mới từ trang chi tiết sách.",
    noPaymentUrl: "Giao dịch này không có đường dẫn nhà cung cấp.",
    notAvailable: "Không có",
    viewReceiptDetail: "Xem chi tiết biên lai",
  },
};

export function PaymentStatusPage() {
  const params = useParams<{ paymentCode: string }>();
  const { accessToken, isAuthenticated, refresh } = useAuth();
  const { locale } = useLanguage();
  const text = copy[locale];
  const paymentCode = params.paymentCode;
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  useEffect(() => {
    if (!paymentCode || (!isAuthenticated && !accessToken)) return;

    let isActive = true;

    getPaymentByCode(paymentCode, accessToken, refreshAccessToken)
      .then((data) => {
        if (!isActive) return;
        setPayment(data);
        setError("");
      })
      .catch((statusError) => {
        if (!isActive) return;
        setError(statusError instanceof Error ? statusError.message : text.loadError);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, isAuthenticated, paymentCode, refreshAccessToken, text.loadError]);

  const statusTone = useMemo(() => getStatusTone(payment?.status), [payment?.status]);

  return (
    <CatalogShell
      protectedPage
      wide
      frameless
      eyebrow={text.eyebrow}
      title={text.title}
      description={text.description}
      actions={<StatusBackLink href="/books">{text.backToBooks}</StatusBackLink>}
    >
      <section className="rounded-[28px] border border-[#D8DEE8] bg-white p-6 shadow-[0_26px_80px_rgba(15,23,42,0.08)] md:p-8">
        {error ? (
          <div className="mb-5">
            <Notice tone="error" message={error} />
          </div>
        ) : null}

        {isLoading ? (
          <PaymentStatusSkeleton text={text} />
        ) : payment ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="flex flex-col gap-5 rounded-2xl border border-[#E1E6F0] bg-[#F8FAFC] p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${statusTone.iconClass}`}>
                    <Icon name={statusTone.icon} size={26} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <StatusPill status={payment.status} text={text} />
                    <h2 className="mt-3 font-serif text-4xl font-bold text-[#0B1026]">
                      {statusTitle(payment.status, text)}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#59637A]">
                      {statusBody(payment, text)}
                    </p>
                  </div>
                </div>

                {payment.status?.toUpperCase() === "PENDING" && payment.paymentUrl ? (
                  <a
                    href={payment.paymentUrl}
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#B30D2D] px-5 text-sm font-black text-white shadow-[0_16px_32px_rgba(179,13,45,0.2)] transition hover:-translate-y-0.5 hover:bg-[#910A24]"
                  >
                    <Icon name="arrow-right" size={18} aria-hidden="true" />
                    {text.continuePayment}
                  </a>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {/* Conditionally hide Payment Code if it's a fine payment, to simplify UI */}
                {payment.purpose !== "OVERDUE_FINE" && (
                  <PaymentInfoCard label={text.code} value={payment.paymentCode || text.notAvailable} />
                )}
                {/* Conditionally hide Provider to simplify UI */}
                {payment.purpose !== "OVERDUE_FINE" && (
                  <PaymentInfoCard label={text.provider} value={payment.provider || text.notAvailable} />
                )}
                <PaymentInfoCard label={text.amount} value={formatMoney(payment.amount, payment.currency, text)} />
                <PaymentInfoCard label={text.purpose} value={payment.purpose || text.notAvailable} />
                <PaymentInfoCard label={text.target} value={formatTarget(payment, text)} />
              </div>
            </div>

            <aside className="rounded-2xl border border-[#E1E6F0] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <h3 className="font-serif text-2xl font-bold text-[#0B1026]">{text.updatedAt}</h3>
              <div className="mt-5 divide-y divide-[#E1E6F0]">
                <TimelineRow label={text.createdAt} value={formatDate(payment.createdAt, text)} />
                <TimelineRow label={text.expiredAt} value={formatDate(payment.expiredAt, text)} />
                <TimelineRow label={text.paidAt} value={formatDate(payment.paidAt, text)} />
                <TimelineRow label={text.updatedAt} value={formatDate(payment.updatedAt, text)} />
              </div>

              <div className="mt-6 grid gap-3">
                {(payment.status?.toUpperCase() === "PAID" || payment.status?.toUpperCase() === "SUCCESS") && (
                  <Link
                    href={`/user/receipts/${payment.paymentCode}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#B30D2D] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#910A24]"
                  >
                    <Icon name="file-text" size={17} aria-hidden="true" />
                    {text.viewReceiptDetail}
                  </Link>
                )}
                {payment.purpose === "EBOOK_PAYMENT" && (
                  <Link
                    href="/user/ebook-loans"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-black"
                  >
                    <Icon name="book-open" size={17} aria-hidden="true" />
                    {text.myEbooks}
                  </Link>
                )}
                {payment.purpose === "OVERDUE_FINE" && (
                  <Link
                    href="/user/fines"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-black"
                  >
                    <Icon name="alert-circle" size={17} aria-hidden="true" />
                    My fines
                  </Link>
                )}
                <Link
                  href="/books"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D8DEE8] bg-white px-4 text-sm font-black text-[#0B1026] transition hover:-translate-y-0.5 hover:border-[#B30D2D] hover:text-[#B30D2D]"
                >
                  <Icon name="arrow-left" size={17} aria-hidden="true" />
                  {text.backToBooks}
                </Link>
              </div>

              {payment.status?.toUpperCase() === "PENDING" && !payment.paymentUrl ? (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                  {text.noPaymentUrl}
                </p>
              ) : null}
            </aside>
          </div>
        ) : null}
      </section>
    </CatalogShell>
  );
}

function PaymentStatusSkeleton({ text }: { text: typeof copy.en }) {
  return (
    <div>
      <Notice message={text.loading} />
      <div className="mt-5 rounded-2xl border border-[#E1E6F0] bg-[#F8FAFC] p-5">
        <Skeleton variant="rectangular" className="h-10 w-36 rounded-full" />
        <Skeleton variant="text" className="mt-5 h-10 w-80 max-w-full" />
        <Skeleton variant="text" className="mt-3 h-5 w-[520px] max-w-full" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status, text }: { status?: string; text: typeof copy.en }) {
  const tone = getStatusTone(status);

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${tone.pillClass}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {statusTitle(status, text)}
    </span>
  );
}

function PaymentInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E1E6F0] bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-black uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-2 break-words text-base font-black text-[#0B1026]">{value}</p>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="font-semibold text-[#59637A]">{label}</span>
      <span className="text-right font-black text-[#0B1026]">{value}</span>
    </div>
  );
}

function StatusBackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center justify-center gap-2 rounded-full border border-[#D9DCE8] px-5 py-3 text-sm font-bold text-[#000054] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#337AB7] hover:bg-white hover:text-[#E60028] hover:shadow-lg hover:shadow-[#000054]/10"
    >
      <Icon name="arrow-left" size={17} aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-1" />
      {children}
    </Link>
  );
}

function getStatusTone(status?: string) {
  switch (status?.toUpperCase()) {
    case "PAID":
    case "SUCCESS":
      return {
        icon: "check" as const,
        iconClass: "bg-emerald-50 text-emerald-700",
        pillClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      };
    case "PENDING":
      return {
        icon: "clock" as const,
        iconClass: "bg-amber-50 text-amber-700",
        pillClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      };
    case "CANCELLED":
    case "EXPIRED":
    case "FAILED":
      return {
        icon: "alert-circle" as const,
        iconClass: "bg-rose-50 text-rose-700",
        pillClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
      };
    default:
      return {
        icon: "info" as const,
        iconClass: "bg-slate-100 text-slate-700",
        pillClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
      };
  }
}

function statusTitle(status: string | undefined, text: typeof copy.en) {
  switch (status?.toUpperCase()) {
    case "PAID":
    case "SUCCESS":
      return text.paid;
    case "PENDING":
      return text.pending;
    case "CANCELLED":
      return text.cancelled;
    case "EXPIRED":
      return text.expired;
    case "FAILED":
      return text.failed;
    default:
      return status || text.unknown;
  }
}

function statusBody(payment: Payment, text: typeof copy.en) {
  switch (payment.status?.toUpperCase()) {
    case "PAID":
    case "SUCCESS":
      return text.paidBody;
    case "PENDING":
      return text.pendingBody;
    default:
      return text.inactiveBody;
  }
}

function formatTarget(payment: Payment, text: typeof copy.en) {
  if (!payment.targetType && typeof payment.targetId !== "number") {
    return text.notAvailable;
  }

  return [payment.targetType, typeof payment.targetId === "number" ? `#${payment.targetId}` : ""].filter(Boolean).join(" ");
}

function formatMoney(amount: number | undefined, currency: string | undefined, text: typeof copy.en) {
  if (typeof amount !== "number") {
    return text.notAvailable;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "VND",
      maximumFractionDigits: currency === "VND" || !currency ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency || ""}`.trim();
  }
}

function formatDate(value: string | null | undefined, text: typeof copy.en) {
  if (!value) return text.notAvailable;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
