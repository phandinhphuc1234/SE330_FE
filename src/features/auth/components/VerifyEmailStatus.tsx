"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { ApiError } from "@/types/api.type";
import { resendVerification, verifyEmail } from "../services/authService";
import { validateRequiredEmail } from "../validations/authValidation";

type VerifyState = "loading" | "success" | "expired" | "invalid";

const copy = {
  en: {
    missingToken: "This verification link is missing a token.",
    checking: "Checking your verification link...",
    verified: "Your email has been verified successfully.",
    expiredMessage: "This verification link has expired.",
    invalidMessage: "This link cannot be used.",
    emailRequired: "Email is required.",
    sent: "Verification email has been sent again.",
    resendError: "Could not resend verification email.",
    heroEyebrow: "Email verification",
    heroTitle: "A secure account starts with a verified email.",
    heroDescription: "The Athenaeum uses email verification before activating borrowing and reservation access.",
    loadingEyebrow: "Checking link",
    loadingTitle: "Verifying your email",
    successEyebrow: "Verified successfully",
    successTitle: "Your account is active",
    goToLogin: "Go to login",
    expiredEyebrow: "Verification link expired",
    invalidEyebrow: "Invalid verification link",
    expiredTitle: "This link has expired",
    invalidTitle: "This link cannot be used",
    emailLabel: "Registered email",
    emailPlaceholder: "you@example.com",
    resendVerification: "Resend verification",
    backToLogin: "Back to login",
    step: "Step",
    steps: ["Register", "Verify email", "Activated"],
  },
  vi: {
    missingToken: "Liên kết xác thực này thiếu mã token.",
    checking: "Đang kiểm tra liên kết xác thực...",
    verified: "Email của bạn đã được xác thực thành công.",
    expiredMessage: "Liên kết xác thực này đã hết hạn.",
    invalidMessage: "Liên kết này không thể sử dụng.",
    emailRequired: "Vui lòng nhập email.",
    sent: "Đã gửi lại email xác thực.",
    resendError: "Không thể gửi lại email xác thực.",
    heroEyebrow: "Xác thực email",
    heroTitle: "Một tài khoản an toàn bắt đầu bằng email đã xác thực.",
    heroDescription: "The Athenaeum xác thực email trước khi kích hoạt quyền mượn sách và đặt giữ.",
    loadingEyebrow: "Đang kiểm tra",
    loadingTitle: "Đang xác thực email",
    successEyebrow: "Xác thực thành công",
    successTitle: "Tài khoản của bạn đã hoạt động",
    goToLogin: "Đi tới đăng nhập",
    expiredEyebrow: "Liên kết đã hết hạn",
    invalidEyebrow: "Liên kết không hợp lệ",
    expiredTitle: "Liên kết này đã hết hạn",
    invalidTitle: "Liên kết này không thể sử dụng",
    emailLabel: "Email đã đăng ký",
    emailPlaceholder: "ban@example.com",
    resendVerification: "Gửi lại xác thực",
    backToLogin: "Quay lại đăng nhập",
    step: "Bước",
    steps: ["Đăng ký", "Xác thực email", "Kích hoạt"],
  },
};

type VerifyEmailCopy = typeof copy.en;

export function VerifyEmailStatus() {
  const { locale } = useLanguage();
  const text = copy[locale];
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<VerifyState>(token ? "loading" : "invalid");
  const [message, setMessage] = useState(
    token ? text.checking : text.missingToken,
  );
  const [email, setEmail] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    verifyEmail(token)
      .then((response) => {
        setState("success");
        setMessage(response.message || text.verified);
      })
      .catch((caughtError) => {
        const apiError = caughtError as ApiError;
        const isExpired = apiError.code === "VERIFICATION_TOKEN_EXPIRED";
        setState(isExpired ? "expired" : "invalid");
        setMessage(apiError.message || (isExpired ? text.expiredMessage : text.invalidMessage));
      });
  }, [token, text.expiredMessage, text.invalidMessage, text.verified]);

  const handleResend = async () => {
    const emailError = validateRequiredEmail(email);

    if (emailError) {
      setResendError(text.emailRequired);
      return;
    }

    setIsResending(true);
    setResendError(null);
    setResendMessage(null);

    try {
      const response = await resendVerification({ email: email.trim() });
      setResendMessage(response.message || text.sent);
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setResendError(apiError.message || text.resendError);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh bg-[linear-gradient(180deg,#F7F3EA_0%,#FFFFFF_100%)] outline-none">
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
            <StepIndicator state={state} text={text} />
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-12 lg:px-8">
          <div className="animate-modal-in w-full max-w-md rounded-2xl border border-[#DED5C8] bg-white p-8 shadow-[0_24px_60px_rgba(17,24,39,0.14)]">
            {state === "loading" && <LoadingState message={message} text={text} />}
            {state === "success" && <SuccessState message={message} text={text} />}
            {(state === "expired" || state === "invalid") && (
              <VerifyError
                state={state}
                text={text}
                message={message}
                email={email}
                onEmailChange={setEmail}
                onResend={handleResend}
                isResending={isResending}
                resendMessage={resendMessage}
                resendError={resendError}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function LoadingState({ message, text }: { message: string; text: VerifyEmailCopy }) {
  return (
    <>
      <p className="text-sm font-bold uppercase tracking-wide text-black/70">{text.loadingEyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl font-bold text-black">{text.loadingTitle}</h2>
      <p className="mt-3 text-sm leading-6 text-black/75">{message}</p>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#DED5C8]">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-black" />
      </div>
    </>
  );
}

function SuccessState({ message, text }: { message: string; text: VerifyEmailCopy }) {
  return (
    <>
      <p className="text-sm font-bold uppercase tracking-wide text-[#28A745]">{text.successEyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl font-bold text-black">{text.successTitle}</h2>
      <p className="mt-3 text-sm leading-6 text-black/75">{message}</p>
      <Link
        href="/login"
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7A263A] to-[#5A1C2B] px-5 text-sm font-bold text-white shadow-lg shadow-[#7A263A]/25 transition-all duration-200 hover:-translate-y-0.5"
      >
        {text.goToLogin}
      </Link>
    </>
  );
}

function VerifyError({
  state,
  text,
  message,
  email,
  onEmailChange,
  onResend,
  isResending,
  resendMessage,
  resendError,
}: {
  state: Exclude<VerifyState, "loading" | "success">;
  text: VerifyEmailCopy;
  message: string;
  email: string;
  onEmailChange: (email: string) => void;
  onResend: () => void;
  isResending: boolean;
  resendMessage: string | null;
  resendError: string | null;
}) {
  const isExpired = state === "expired";

  return (
    <>
      <p className="text-sm font-bold uppercase tracking-wide text-[#7A263A]">
        {isExpired ? text.expiredEyebrow : text.invalidEyebrow}
      </p>
      <h2 className="mt-3 font-serif text-3xl font-bold text-black">
        {isExpired ? text.expiredTitle : text.invalidTitle}
      </h2>
      <p className="mt-3 text-sm leading-6 text-black/75">{message}</p>
      <label htmlFor="resend-email" className="mt-6 block text-sm font-bold text-black">
        {text.emailLabel}
      </label>
      <input
        id="resend-email"
        type="email"
        className="mt-2 h-12 w-full rounded-lg border border-[#D8CCBC] px-4 text-black outline-none transition-all duration-200 focus:border-2 focus:border-black focus:shadow-[0_0_0_4px_rgba(0,0,0,0.1)]"
        placeholder={text.emailPlaceholder}
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
      />
      {resendMessage && (
        <p className="mt-4 animate-fade-up rounded-lg border border-[#28A745]/20 bg-[#28A745]/10 p-3 text-sm font-semibold text-[#1E7E34]">
          {resendMessage}
        </p>
      )}
      {resendError && (
        <p className="mt-4 animate-fade-up rounded-lg border border-[#7A263A]/20 bg-[#7A263A]/8 p-3 text-sm font-semibold text-[#B00020]">
          {resendError}
        </p>
      )}
      <div className="mt-6 grid gap-3">
        <button
          type="button"
          disabled={isResending}
          className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#7A263A] to-[#5A1C2B] px-5 text-sm font-bold text-white shadow-lg shadow-[#7A263A]/25 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:from-[#BEB2A3] disabled:to-[#A09282]"
          onClick={onResend}
        >
          {isResending && (
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {text.resendVerification}
        </button>
        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center rounded-full border border-black px-5 text-sm font-bold text-black transition hover:bg-black hover:text-white"
        >
          {text.backToLogin}
        </Link>
      </div>
    </>
  );
}

function StepIndicator({ state, text }: { state: VerifyState; text: VerifyEmailCopy }) {
  const steps = text.steps;
  const activeStep = state === "success" ? 3 : 2;

  return (
    <div className="animate-fade-up animate-delay-225 mt-10 grid max-w-lg gap-3 sm:grid-cols-3">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= activeStep;

        return (
          <div
            key={step}
            className={`rounded-lg border p-4 backdrop-blur ${
              isActive ? "border-white/35 bg-white/14" : "border-white/12 bg-white/6"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-white/75">{text.step} {stepNumber}</p>
            <p className="mt-1 text-sm font-bold text-white">{step}</p>
          </div>
        );
      })}
    </div>
  );
}
