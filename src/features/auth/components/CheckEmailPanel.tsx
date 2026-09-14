"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { ApiError } from "@/types/api.type";
import { resendVerification, verifyEmailCode } from "../services/authService";
import { validateRequiredEmail, verificationCodeSchema } from "../validations/authValidation";

const copy = {
  en: {
    heroEyebrow: "Verify your account",
    heroTitle: "Enter your verification code to activate your account.",
    heroDescription: "Use the 9-digit code from your newest email. The code expires after 10 minutes.",
    cardEyebrow: "Email verification",
    title: "Enter your 9-digit code",
    description: "We sent a one-time code to your email. If you do not see it, check spam or request a new code after the cooldown.",
    emailLabel: "Registered email",
    emailPlaceholder: "you@example.com",
    emailRequired: "Email is required.",
    codeLabel: "Verification code",
    codePlaceholder: "123456789",
    codeHint: "Enter all 9 digits. Only the newest code is valid.",
    codeRequired: "Enter the 9-digit verification code.",
    verify: "Verify account",
    verifying: "Verifying...",
    verifiedTitle: "Email verified",
    verifiedDescription: "Your account is active. You can now log in and use library services.",
    sent: "A new verification code has been sent.",
    resendIn: "Resend in",
    resendEmail: "Send a new code",
    backToLogin: "Back to login",
    errors: {
      verified: "This account has already been verified. You can log in now.",
      cooldown: "Please wait before requesting another verification email.",
      limit: "You have reached today's resend limit. Please try again later.",
      invalidCode: "The verification code is incorrect.",
      expiredCode: "This code has expired. Request a new code and try again.",
      attemptLimit: "Too many incorrect attempts. Request a new code before trying again.",
      fallback: "Could not resend verification email.",
    },
  },
  vi: {
    heroEyebrow: "Xác thực tài khoản",
    heroTitle: "Nhập mã xác thực để kích hoạt tài khoản.",
    heroDescription: "Sử dụng mã 9 chữ số trong email mới nhất. Mã sẽ hết hạn sau 10 phút.",
    cardEyebrow: "Xác thực email",
    title: "Nhập mã xác thực 9 chữ số",
    description: "Chúng tôi đã gửi mã dùng một lần tới email của bạn. Nếu chưa thấy, hãy kiểm tra thư rác hoặc yêu cầu mã mới sau thời gian chờ.",
    emailLabel: "Email đã đăng ký",
    emailPlaceholder: "ban@example.com",
    emailRequired: "Vui lòng nhập email.",
    codeLabel: "Mã xác thực",
    codePlaceholder: "123456789",
    codeHint: "Nhập đủ 9 chữ số. Chỉ mã được gửi gần nhất có hiệu lực.",
    codeRequired: "Vui lòng nhập mã xác thực gồm 9 chữ số.",
    verify: "Xác thực tài khoản",
    verifying: "Đang xác thực...",
    verifiedTitle: "Xác thực thành công",
    verifiedDescription: "Tài khoản đã được kích hoạt. Bạn có thể đăng nhập và sử dụng dịch vụ thư viện.",
    sent: "Đã gửi mã xác thực mới.",
    resendIn: "Gửi lại sau",
    resendEmail: "Gửi mã mới",
    backToLogin: "Quay lại đăng nhập",
    errors: {
      verified: "Tài khoản này đã được xác thực. Bạn có thể đăng nhập ngay.",
      cooldown: "Vui lòng chờ trước khi yêu cầu email xác thực mới.",
      limit: "Bạn đã đạt giới hạn gửi lại trong ngày. Vui lòng thử lại sau.",
      invalidCode: "Mã xác thực không đúng.",
      expiredCode: "Mã đã hết hạn. Hãy yêu cầu mã mới rồi thử lại.",
      attemptLimit: "Bạn đã nhập sai quá nhiều lần. Hãy yêu cầu mã mới trước khi thử lại.",
      fallback: "Không thể gửi lại email xác thực.",
    },
  },
};

export function CheckEmailPanel() {
  const { locale } = useLanguage();
  const text = copy[locale];
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => {
    const emailFromQuery = searchParams.get("email");

    if (emailFromQuery) return emailFromQuery;
    if (typeof window === "undefined") return "";

    return window.sessionStorage.getItem("pendingVerificationEmail") ?? "";
  });
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailError = validateRequiredEmail(email);
    const codeResult = verificationCodeSchema.safeParse(code);

    if (emailError) {
      setError(text.emailRequired);
      return;
    }
    if (!codeResult.success) {
      setError(text.codeRequired);
      return;
    }

    setIsVerifying(true);
    setError(null);
    setMessage(null);

    try {
      await verifyEmailCode({ email: email.trim(), code });
      window.sessionStorage.removeItem("pendingVerificationEmail");
      setIsVerified(true);
    } catch (caughtError) {
      setError(formatVerificationError(caughtError as ApiError, locale));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    const emailError = validateRequiredEmail(email);

    if (emailError) {
      setError(text.emailRequired);
      return;
    }

    setIsResending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await resendVerification({ email: email.trim() });
      setCode("");
      setMessage(response.message || text.sent);
      setCooldown(60);
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
      const apiError = caughtError as ApiError;
      setError(formatResendError(apiError, locale));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh bg-[linear-gradient(180deg,#F8F9FA_0%,#FFFFFF_100%)] outline-none">
      <div className="grid min-h-dvh lg:grid-cols-[0.95fr_1.05fr]">
        <section className="bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.14),transparent_30%),linear-gradient(135deg,#050505_0%,#171717_65%,#2d2d2d_100%)] px-6 py-8 text-white lg:px-12">
          <BrandMark />
          <div className="flex min-h-[calc(100vh-96px)] flex-col justify-center">
            <p className="animate-fade-up inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white backdrop-blur">
              {text.heroEyebrow}
            </p>
            <h1 className="animate-fade-up animate-delay-75 mt-5 max-w-xl font-serif text-4xl font-bold leading-tight md:text-5xl">
              {text.heroTitle}
            </h1>
            <p className="animate-fade-up animate-delay-150 mt-5 max-w-lg text-lg leading-8 text-white/78">
              {text.heroDescription}
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-12 lg:px-8">
          <div className="animate-modal-in w-full max-w-lg rounded-2xl border border-[#EDEDF2] bg-white p-8 shadow-[0_24px_60px_rgba(17,24,39,0.14)]">
            <p className="text-sm font-bold uppercase tracking-wide text-black/70">{text.cardEyebrow}</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-black">
              {isVerified ? text.verifiedTitle : text.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-black/75">
              {isVerified ? text.verifiedDescription : text.description}
            </p>

            {!isVerified && (
              <form className="mt-6" onSubmit={handleVerify}>
                <label htmlFor="verification-email" className="block text-sm font-bold text-black">
                  {text.emailLabel}
                </label>
                <input
                  id="verification-email"
                  type="email"
                  autoComplete="email"
                  className="mt-2 h-12 w-full rounded-lg border border-[#D9DCE8] px-4 text-black outline-none transition-all duration-200 focus:border-2 focus:border-black focus:shadow-[0_0_0_4px_rgba(0,0,0,0.1)]"
                  placeholder={text.emailPlaceholder}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />

                <label htmlFor="verification-code" className="mt-5 block text-sm font-bold text-black">
                  {text.codeLabel}
                </label>
                <input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={9}
                  aria-describedby="verification-code-hint"
                  className="mt-2 h-14 w-full rounded-lg border border-[#D9DCE8] px-4 text-center font-mono text-2xl font-bold tracking-[0.35em] text-black outline-none transition-all duration-200 focus:border-2 focus:border-black focus:shadow-[0_0_0_4px_rgba(0,0,0,0.1)]"
                  placeholder={text.codePlaceholder}
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 9));
                    setError(null);
                  }}
                />
                <p id="verification-code-hint" className="mt-2 text-xs leading-5 text-black/60">
                  {text.codeHint}
                </p>

                <button
                  type="submit"
                  disabled={isVerifying || code.length !== 9}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#E60028] to-[#c90022] px-5 text-sm font-bold text-white shadow-lg shadow-[#E60028]/25 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:from-[#B8BBC8] disabled:to-[#9FA3B2] disabled:shadow-none disabled:hover:translate-y-0"
                >
                  {isVerifying && (
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {isVerifying ? text.verifying : text.verify}
                </button>
              </form>
            )}

            {message && (
              <p className="mt-4 animate-fade-up rounded-lg border border-[#28A745]/20 bg-[#28A745]/10 p-3 text-sm font-semibold text-[#1E7E34]">
                {message}
              </p>
            )}
            {error && (
              <p className="mt-4 animate-fade-up rounded-lg border border-[#E60028]/20 bg-[#E60028]/8 p-3 text-sm font-semibold text-[#B00020]">
                {error}
              </p>
            )}

            <div className={`mt-6 grid gap-3 ${isVerified ? "" : "sm:grid-cols-2"}`}>
              {!isVerified && (
                <button
                  type="button"
                  disabled={isResending || cooldown > 0}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-black px-5 text-sm font-bold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-[#B8BBC8] disabled:text-[#777]"
                  onClick={handleResend}
                >
                  {isResending && (
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {cooldown > 0 ? `${text.resendIn} ${cooldown}s` : text.resendEmail}
                </button>
              )}
              <Link
                href="/login"
                className={`inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-bold transition ${
                  isVerified
                    ? "bg-black text-white hover:bg-black/80"
                    : "border border-black text-black hover:bg-black hover:text-white"
                }`}
              >
                {text.backToLogin}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatResendError(error: ApiError, locale: "en" | "vi") {
  const text = copy[locale].errors;
  if (error.code === "EMAIL_ALREADY_VERIFIED") {
    return text.verified;
  }

  if (error.code === "EMAIL_RESEND_COOLDOWN") {
    return text.cooldown;
  }

  if (error.code === "EMAIL_RESEND_LIMIT_EXCEEDED") {
    return text.limit;
  }

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
