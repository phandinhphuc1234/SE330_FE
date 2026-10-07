"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/types/api.type";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogShell } from "@/features/catalog/components/CatalogShell";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { confirmVnpayReturn } from "../services/paymentService";

type ReturnState = "confirming" | "confirmed" | "failed" | "error";

const REDIRECT_DELAY_MS = 650;

const copy = {
  en: {
    eyebrow: "Payment",
    title: "Ebook payment return",
    description: "Confirming the signed VNPAY response before updating your ebook access.",
    backToBooks: "Back to books",
    myEbooks: "My ebooks",
    viewStatus: "View payment status",
    retry: "Retry confirmation",
    confirming: "Confirming payment...",
    confirmed: "Payment confirmed",
    failed: "Payment failed",
    error: "Could not confirm payment",
    confirmingBody: "Please wait while we send the VNPAY return data to the library server.",
    confirmedBody: "The payment was confirmed. Redirecting to the payment status page...",
    failedBody: "VNPAY returned a failed or inactive result. Redirecting to the payment status page...",
    errorBody: "The server could not verify this VNPAY return. You can retry with the same return parameters or open the payment status page.",
    missingCode: "Could not find vnp_TxnRef in the return URL.",
    missingParams: "This return URL does not include VNPAY parameters.",
    authRequired: "Please sign in again so we can confirm this authenticated payment return.",
  },
  vi: {
    eyebrow: "Thanh toán",
    title: "Xác nhận thanh toán ebook",
    description: "Xác nhận phản hồi có chữ ký từ VNPAY trước khi cập nhật quyền đọc ebook.",
    backToBooks: "Quay lại sách",
    myEbooks: "Ebook của tôi",
    viewStatus: "Xem trạng thái thanh toán",
    retry: "Xác nhận lại",
    confirming: "Đang xác nhận thanh toán...",
    confirmed: "Đã xác nhận thanh toán",
    failed: "Thanh toán thất bại",
    error: "Không thể xác nhận thanh toán",
    confirmingBody: "Vui lòng chờ trong lúc hệ thống gửi dữ liệu trả về từ VNPAY cho server thư viện.",
    confirmedBody: "Thanh toán đã được xác nhận. Đang chuyển sang trang trạng thái thanh toán...",
    failedBody: "VNPAY trả về kết quả thất bại hoặc không còn hiệu lực. Đang chuyển sang trang trạng thái thanh toán...",
    errorBody: "Server chưa xác minh được phản hồi VNPAY này. Bạn có thể xác nhận lại bằng cùng tham số hoặc mở trang trạng thái thanh toán.",
    missingCode: "Không tìm thấy vnp_TxnRef trong URL trả về.",
    missingParams: "URL trả về này không có tham số VNPAY.",
    authRequired: "Vui lòng đăng nhập lại để xác nhận lượt thanh toán yêu cầu xác thực này.",
  },
};

export function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, isAuthenticated, isInitializing, refresh } = useAuth();
  const { locale } = useLanguage();
  const text = copy[locale];
  const searchParamString = searchParams.toString();
  const attemptedReturnRef = useRef("");
  const redirectTimerRef = useRef<number | null>(null);
  const [returnState, setReturnState] = useState<ReturnState>("confirming");
  const [errorMessage, setErrorMessage] = useState("");
  const [resolvedPaymentCode, setResolvedPaymentCode] = useState("");

  const returnParams = useMemo(() => parseSearchParams(searchParamString), [searchParamString]);
  const hasVnpayParams = useMemo(() => Object.keys(returnParams).some((key) => key.startsWith("vnp_")), [returnParams]);
  const paymentCode = returnParams.vnp_TxnRef || returnParams.paymentCode || returnParams.code || resolvedPaymentCode || "";
  const statusHref = paymentCode ? `/payments/${encodeURIComponent(paymentCode)}` : "";

  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  const clearRedirectTimer = useCallback(() => {
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  }, []);

  const redirectToStatus = useCallback(
    (code: string) => {
      clearRedirectTimer();
      redirectTimerRef.current = window.setTimeout(() => {
        router.replace(`/payments/${encodeURIComponent(code)}`);
      }, REDIRECT_DELAY_MS);
    },
    [clearRedirectTimer, router],
  );

  const runConfirmation = useCallback(async () => {
    const codeFromReturn = returnParams.vnp_TxnRef;

    if (!hasVnpayParams) {
      const legacyCode = returnParams.paymentCode || returnParams.code || readPendingPaymentCode();

      if (legacyCode) {
        router.replace(`/payments/${encodeURIComponent(legacyCode)}`);
        return;
      }

      setReturnState("error");
      setErrorMessage(text.missingParams);
      return;
    }

    if (!codeFromReturn) {
      setReturnState("error");
      setErrorMessage(text.missingCode);
      return;
    }

    if (!accessToken && !isAuthenticated) {
      setResolvedPaymentCode(codeFromReturn);
      setReturnState("error");
      setErrorMessage(text.authRequired);
      return;
    }

    clearRedirectTimer();
    setResolvedPaymentCode(codeFromReturn);
    setReturnState("confirming");
    setErrorMessage("");

    try {
      const result = await confirmVnpayReturn(returnParams, accessToken, refreshAccessToken);
      const confirmedCode = result.paymentCode || codeFromReturn;
      const providerStatus = result.status?.toUpperCase() || "";

      setResolvedPaymentCode(confirmedCode);
      setReturnState(isTerminalFailure(providerStatus) ? "failed" : isConfirmedStatus(providerStatus) ? "confirmed" : "confirming");
      redirectToStatus(confirmedCode);
    } catch (error) {
      setReturnState("error");
      setErrorMessage(formatConfirmError(error));
    }
  }, [
    accessToken,
    clearRedirectTimer,
    hasVnpayParams,
    isAuthenticated,
    redirectToStatus,
    refreshAccessToken,
    returnParams,
    router,
    text.authRequired,
    text.missingCode,
    text.missingParams,
  ]);

  useEffect(() => {
    if (isInitializing) return;
    if (attemptedReturnRef.current === searchParamString) return;

    attemptedReturnRef.current = searchParamString;
    void runConfirmation();

    return clearRedirectTimer;
  }, [clearRedirectTimer, isInitializing, runConfirmation, searchParamString]);

  const stateCopy = getStateCopy(returnState, text, errorMessage);

  return (
    <CatalogShell
      protectedPage
      wide
      frameless
      eyebrow={text.eyebrow}
      title={text.title}
      description={text.description}
      actions={<ReturnAction href="/books">{text.backToBooks}</ReturnAction>}
    >
      <section className="rounded-[28px] border border-[#D8DEE8] bg-white p-6 shadow-[0_26px_80px_rgba(15,23,42,0.08)] md:p-8">
        <div className="rounded-2xl border border-[#E1E6F0] bg-[#FBF8F1] p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${stateCopy.iconClass}`}>
                <Icon name={stateCopy.icon} size={26} animate={returnState === "confirming" ? "pulse" : "none"} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${stateCopy.pillClass}`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {stateCopy.label}
                </span>
                <h2 className="mt-3 font-serif text-4xl font-bold text-[#171412]">{stateCopy.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#59637A]">{stateCopy.body}</p>
                {paymentCode ? (
                  <p className="mt-3 break-all text-xs font-black uppercase tracking-wide text-[#776D63]">
                    {paymentCode}
                  </p>
                ) : null}
              </div>
            </div>

            {returnState === "error" ? (
              <button
                type="button"
                onClick={() => void runConfirmation()}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#B30D2D] px-5 text-sm font-black text-white shadow-[0_16px_32px_rgba(179,13,45,0.2)] transition hover:-translate-y-0.5 hover:bg-[#910A24]"
              >
                <Icon name="clock" size={18} aria-hidden="true" />
                {text.retry}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
          {statusHref ? (
            <Link
              href={statusHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2B2723] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-black"
            >
              <Icon name="file" size={17} aria-hidden="true" />
              {text.viewStatus}
            </Link>
          ) : null}
          <Link
            href="/ebook-loans"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D8DEE8] bg-white px-4 text-sm font-black text-[#171412] transition hover:-translate-y-0.5 hover:border-[#B30D2D] hover:text-[#B30D2D]"
          >
            <Icon name="book-open" size={17} aria-hidden="true" />
            {text.myEbooks}
          </Link>
          <Link
            href="/books"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D8DEE8] bg-white px-4 text-sm font-black text-[#171412] transition hover:-translate-y-0.5 hover:border-[#B30D2D] hover:text-[#B30D2D]"
          >
            <Icon name="arrow-left" size={17} aria-hidden="true" />
            {text.backToBooks}
          </Link>
        </div>
      </section>
    </CatalogShell>
  );
}

function parseSearchParams(searchParamString: string) {
  const params = new URLSearchParams(searchParamString);
  const parsed: Record<string, string> = {};

  params.forEach((value, key) => {
    parsed[key] = value;
  });

  return parsed;
}

function readPendingPaymentCode() {
  if (typeof window === "undefined") return "";

  try {
    const rawPayment = window.sessionStorage.getItem("athenaeum.pendingEbookPayment");
    const payment = rawPayment ? (JSON.parse(rawPayment) as { paymentCode?: string }) : null;

    return payment?.paymentCode || "";
  } catch {
    return "";
  }
}

function getStateCopy(state: ReturnState, text: typeof copy.en, errorMessage: string) {
  switch (state) {
    case "confirmed":
      return {
        label: text.confirmed,
        title: text.confirmed,
        body: text.confirmedBody,
        icon: "check" as const,
        iconClass: "bg-emerald-50 text-emerald-700",
        pillClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      };
    case "failed":
      return {
        label: text.failed,
        title: text.failed,
        body: text.failedBody,
        icon: "alert-circle" as const,
        iconClass: "bg-rose-50 text-rose-700",
        pillClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
      };
    case "error":
      return {
        label: text.error,
        title: text.error,
        body: errorMessage ? `${text.errorBody} ${errorMessage}` : text.errorBody,
        icon: "alert-circle" as const,
        iconClass: "bg-rose-50 text-rose-700",
        pillClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
      };
    default:
      return {
        label: text.confirming,
        title: text.confirming,
        body: text.confirmingBody,
        icon: "clock" as const,
        iconClass: "bg-amber-50 text-amber-700",
        pillClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      };
  }
}

function isTerminalFailure(status: string) {
  return status === "FAILED" || status === "CANCELLED" || status === "EXPIRED";
}

function isConfirmedStatus(status: string) {
  return status === "SUCCESS" || status === "PAID";
}

function formatConfirmError(error: unknown) {
  if (error instanceof ApiError) {
    const details = [`Status ${error.status}`];

    if (error.code) details.push(`code ${error.code}`);
    if (error.traceId) details.push(`trace ${error.traceId}`);

    return `${error.message} (${details.join(" · ")}).`;
  }

  return error instanceof Error ? error.message : "Unknown error.";
}

function ReturnAction({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center justify-center gap-2 rounded-full border border-[#D8CCBC] px-5 py-3 text-sm font-bold text-[#2B2723] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7A263A] hover:bg-white hover:text-[#7A263A] hover:shadow-lg hover:shadow-[#2B2723]/10"
    >
      <Icon name="arrow-left" size={17} aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-1" />
      {children}
    </Link>
  );
}
