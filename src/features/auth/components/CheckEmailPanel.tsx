"use client";

import Link from "next/link";
import {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { ApiError } from "@/types/api.type";
import { resendVerification, verifyEmailCode } from "../services/authService";
import { verificationCodeSchema } from "../validations/authValidation";

const OTP_LENGTH = 9;
const PENDING_EMAIL_KEY = "pendingVerificationEmail";

const copy = {
  en: {
    eyebrow: "Secure email check",
    title: "Verify your email",
    description: "Enter the 9-digit code sent to the email you used during registration.",
    codeLabel: "Nine-digit verification code",
    codeHint: "Paste the full code or enter one digit in each box, then press Enter.",
    codeRequired: "Enter all 9 digits of the verification code.",
    verify: "Verify email",
    verifying: "Verifying...",
    verifiedTitle: "Email verified",
    verifiedDescription: "Your account is active. You can now sign in to The Athenaeum.",
    missingTitle: "Verification session not found",
    missingDescription: "Return to registration so we can securely remember which email should receive the code.",
    registerAgain: "Return to registration",
    sent: "A fresh verification code has been sent.",
    resendIn: "Send another code in",
    resendEmail: "Send another code",
    backToLogin: "Back to login",
    digitsMeta: "9 digits",
    minutesMeta: "10 minutes",
    errors: {
      verified: "This account has already been verified. You can sign in now.",
      cooldown: "Please wait before requesting another verification code.",
      limit: "You have reached today's resend limit. Please try again later.",
      invalidCode: "The verification code is incorrect.",
      expiredCode: "This code has expired. Request a new code and try again.",
      attemptLimit: "Too many incorrect attempts. Request a new code before trying again.",
      fallback: "Could not send another verification code.",
    },
  },
  vi: {
    eyebrow: "Xác thực email an toàn",
    title: "Xác thực email của bạn",
    description: "Nhập mã 9 chữ số đã gửi đến email bạn dùng khi đăng ký.",
    codeLabel: "Mã xác thực gồm chín chữ số",
    codeHint: "Dán toàn bộ mã hoặc nhập từng số vào mỗi ô, sau đó nhấn Enter.",
    codeRequired: "Vui lòng nhập đủ 9 chữ số của mã xác thực.",
    verify: "Xác thực email",
    verifying: "Đang xác thực...",
    verifiedTitle: "Xác thực thành công",
    verifiedDescription: "Tài khoản đã được kích hoạt. Bạn có thể đăng nhập vào The Athenaeum.",
    missingTitle: "Không tìm thấy phiên xác thực",
    missingDescription: "Hãy quay lại trang đăng ký để hệ thống ghi nhớ an toàn email sẽ nhận mã.",
    registerAgain: "Quay lại đăng ký",
    sent: "Đã gửi một mã xác thực mới.",
    resendIn: "Gửi mã khác sau",
    resendEmail: "Gửi mã khác",
    backToLogin: "Quay lại đăng nhập",
    digitsMeta: "9 chữ số",
    minutesMeta: "10 phút",
    errors: {
      verified: "Tài khoản này đã được xác thực. Bạn có thể đăng nhập ngay.",
      cooldown: "Vui lòng chờ trước khi yêu cầu mã xác thực khác.",
      limit: "Bạn đã đạt giới hạn gửi lại trong ngày. Vui lòng thử lại sau.",
      invalidCode: "Mã xác thực không đúng.",
      expiredCode: "Mã đã hết hạn. Hãy yêu cầu mã mới rồi thử lại.",
      attemptLimit: "Bạn đã nhập sai quá nhiều lần. Hãy yêu cầu mã mới trước khi thử lại.",
      fallback: "Không thể gửi mã xác thực khác.",
    },
  },
};

function subscribeToClientState() {
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function createEmptyDigits() {
  return Array<string>(OTP_LENGTH).fill("");
}

export function CheckEmailPanel() {
  const { locale } = useLanguage();
  const text = copy[locale];
  const isClient = useSyncExternalStore(subscribeToClientState, getClientSnapshot, getServerSnapshot);
  const email = isClient ? window.sessionStorage.getItem(PENDING_EMAIL_KEY)?.trim() ?? "" : "";
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState(createEmptyDigits);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const code = digits.join("");
  const isComplete = digits.every(Boolean);

  const focusDigit = (index: number) => {
    window.requestAnimationFrame(() => inputRefs.current[index]?.focus());
  };

  const replaceDigits = (rawValue: string, startIndex = 0) => {
    const numericValue = rawValue.replace(/\D/g, "").slice(0, OTP_LENGTH - startIndex);
    if (!numericValue) return;

    setDigits((current) => {
      const next = [...current];
      numericValue.split("").forEach((digit, offset) => {
        next[startIndex + offset] = digit;
      });
      return next;
    });
    setError(null);
    focusDigit(Math.min(startIndex + numericValue.length, OTP_LENGTH - 1));
  };

  const handleDigitChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "");

    if (numericValue.length > 1) {
      replaceDigits(numericValue, index);
      return;
    }

    setDigits((current) => {
      const next = [...current];
      next[index] = numericValue;
      return next;
    });
    setError(null);

    if (numericValue && index < OTP_LENGTH - 1) {
      focusDigit(index + 1);
    }
  };

  const handleDigitKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      setDigits((current) => {
        const next = [...current];
        if (next[index]) {
          next[index] = "";
        } else if (index > 0) {
          next[index - 1] = "";
          focusDigit(index - 1);
        }
        return next;
      });
      setError(null);
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      setDigits((current) => current.map((digit, digitIndex) => (digitIndex === index ? "" : digit)));
      setError(null);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusDigit(index - 1);
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusDigit(index + 1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusDigit(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      focusDigit(OTP_LENGTH - 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pastedCode) return;

    event.preventDefault();
    const next = createEmptyDigits();
    pastedCode.split("").forEach((digit, index) => {
      next[index] = digit;
    });
    setDigits(next);
    setError(null);
    focusDigit(Math.min(pastedCode.length, OTP_LENGTH - 1));
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const codeResult = verificationCodeSchema.safeParse(code);

    if (!email || !codeResult.success) {
      setError(text.codeRequired);
      return;
    }

    setIsVerifying(true);
    setError(null);
    setMessage(null);

    try {
      await verifyEmailCode({ email, code });
      setIsVerified(true);
      window.sessionStorage.removeItem(PENDING_EMAIL_KEY);
    } catch (caughtError) {
      setError(formatVerificationError(caughtError as ApiError, locale));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await resendVerification({ email });
      setDigits(createEmptyDigits());
      setMessage(response.message || text.sent);
      setCooldown(60);
      focusDigit(0);
      const timerId = window.setInterval(() => {
        setCooldown((current) => {
          if (current <= 1) {
            window.clearInterval(timerId);
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    } catch (caughtError) {
      setError(formatResendError(caughtError as ApiError, locale));
    } finally {
      setIsResending(false);
    }
  };

  const viewState = isVerified ? "verified" : !isClient ? "loading" : email ? "ready" : "missing";

  return (
    <main id="main-content" tabIndex={-1} className="relative flex min-h-dvh flex-col overflow-hidden bg-[#F2F2EF] px-4 py-6 text-black outline-none sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.95),transparent_44%)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between">
        <BrandMark tone="dark" />
        <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-black/65 transition hover:bg-black/5 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
          {text.backToLogin}
        </Link>
      </header>

      <section className="relative z-10 flex flex-1 items-center justify-center py-10">
        <div className="animate-modal-in w-full max-w-xl rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_26px_80px_rgba(0,0,0,0.13)] sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
            <Icon name={viewState === "verified" ? "check" : viewState === "missing" ? "alert-circle" : "shield"} size={26} aria-hidden="true" />
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/50">{text.eyebrow}</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-black sm:text-4xl">
              {viewState === "verified" ? text.verifiedTitle : viewState === "missing" ? text.missingTitle : text.title}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/65 sm:text-base">
              {viewState === "verified"
                ? text.verifiedDescription
                : viewState === "missing"
                  ? text.missingDescription
                  : text.description}
            </p>
          </div>

          {viewState === "loading" && (
            <div className="mt-8 grid grid-cols-9 gap-1.5 sm:gap-2" aria-label="Loading verification form">
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-lg bg-black/8 sm:h-14" />
              ))}
            </div>
          )}

          {viewState === "ready" && (
            <form className="mt-8" onSubmit={handleVerify}>
              <div
                role="group"
                aria-labelledby="verification-code-label"
                aria-describedby="verification-code-hint"
                onPaste={handlePaste}
              >
                <p id="verification-code-label" className="sr-only">{text.codeLabel}</p>
                <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={index === 0 ? OTP_LENGTH : 1}
                      value={digit}
                      aria-label={`${text.codeLabel}, ${index + 1}/${OTP_LENGTH}`}
                      aria-invalid={Boolean(error)}
                      autoFocus={index === 0}
                      className="h-12 min-w-0 rounded-lg border border-black/20 bg-white text-center text-lg font-bold text-black caret-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/15 sm:h-14 sm:rounded-xl sm:text-xl"
                      onChange={(event) => handleDigitChange(index, event.target.value)}
                      onKeyDown={(event) => handleDigitKeyDown(index, event)}
                      onFocus={(event) => event.currentTarget.select()}
                    />
                  ))}
                </div>
                <p id="verification-code-hint" className="mt-3 text-center text-xs leading-5 text-black/55 sm:text-sm">
                  {text.codeHint}
                </p>
              </div>

              {message && (
                <p role="status" className="mt-5 rounded-xl border border-black/15 bg-black/[0.03] px-4 py-3 text-sm font-medium text-black">
                  {message}
                </p>
              )}
              {error && (
                <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-black bg-black px-4 py-3 text-sm font-medium text-white">
                  <Icon name="alert-circle" size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={isVerifying || !isComplete}
                className="mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-black px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-black/25 disabled:shadow-none"
              >
                {isVerifying && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {isVerifying ? text.verifying : text.verify}
              </button>

              <div className="mt-5 text-center text-sm text-black/60">
                <button
                  type="button"
                  disabled={isResending || cooldown > 0}
                  className="cursor-pointer font-bold text-black underline decoration-black/30 underline-offset-4 transition hover:decoration-black focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-not-allowed disabled:text-black/35 disabled:no-underline"
                  onClick={handleResend}
                >
                  {cooldown > 0 ? `${text.resendIn} ${cooldown}s` : text.resendEmail}
                </button>
              </div>
            </form>
          )}

          {viewState === "missing" && (
            <Link href="/register" className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl bg-black px-5 text-sm font-bold text-white transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
              {text.registerAgain}
            </Link>
          )}

          {viewState === "verified" && (
            <Link href="/login" className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl bg-black px-5 text-sm font-bold text-white transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
              {text.backToLogin}
            </Link>
          )}

          <div className="mt-7 flex items-center justify-center gap-3 border-t border-black/8 pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-black/40">
            <span>{text.digitsMeta}</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-black/30" />
            <span>{text.minutesMeta}</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function formatResendError(error: ApiError, locale: "en" | "vi") {
  const text = copy[locale].errors;
  if (error.code === "EMAIL_ALREADY_VERIFIED") return text.verified;
  if (error.code === "EMAIL_RESEND_COOLDOWN") return text.cooldown;
  if (error.code === "EMAIL_RESEND_LIMIT_EXCEEDED") return text.limit;
  return error.message || text.fallback;
}

function formatVerificationError(error: ApiError, locale: "en" | "vi") {
  const text = copy[locale].errors;
  if (error.code === "INVALID_VERIFICATION_CODE") return text.invalidCode;
  if (error.code === "VERIFICATION_CODE_EXPIRED") return text.expiredCode;
  if (error.code === "EMAIL_VERIFICATION_ATTEMPT_LIMIT_EXCEEDED") return text.attemptLimit;
  if (error.code === "EMAIL_ALREADY_VERIFIED") return text.verified;
  return error.message || text.invalidCode;
}
