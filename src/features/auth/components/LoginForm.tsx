"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/layout/BrandMark";
import { ApiError } from "@/types/api.type";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { resendVerification } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { getZodFieldErrors, loginSchema, validateRequiredEmail } from "../validations/authValidation";
import { PasswordVisibilityButton } from "./PasswordVisibilityButton";

const LOGIN_HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1760166699654-5d0e10f51994?auto=format&fit=crop&fm=jpg&q=80&w=2200";

const loginCopy = {
  en: {
    heroBadge: "Digital library account",
    heroTitle: "Borrow, reserve, and pick up without losing the thread.",
    heroDescription: "Your Athenaeum account keeps loans, holds, pickup windows, and library notices in one calm workspace.",
    stats: [
      ["Live", "Loan status"],
      ["Ready", "Pickup holds"],
      ["Clear", "Due reminders"],
    ],
    photoCredit: "Photo by Fer Troulik on Unsplash",
    secureAccess: "Secure access",
    heading: "Welcome back",
    description: "Sign in to continue managing your borrowing activity.",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    forgotPassword: "Forgot password?",
    resendVerification: "Resend verification email",
    signingIn: "Signing in...",
    login: "Login",
    newAccount: "New to The Athenaeum?",
    createAccount: "Create an account",
  },
  vi: {
    heroBadge: "Tài khoản thư viện số",
    heroTitle: "Mượn, đặt giữ và nhận sách mà không bỏ lỡ thông tin.",
    heroDescription: "Tài khoản Athenaeum giúp bạn theo dõi sách mượn, lượt đặt giữ, thời hạn nhận sách và thông báo thư viện trong một không gian gọn gàng.",
    stats: [
      ["Trực tiếp", "Trạng thái mượn"],
      ["Sẵn sàng", "Sách chờ nhận"],
      ["Rõ ràng", "Nhắc hạn trả"],
    ],
    photoCredit: "Ảnh bởi Fer Troulik trên Unsplash",
    secureAccess: "Truy cập an toàn",
    heading: "Chào mừng trở lại",
    description: "Đăng nhập để tiếp tục quản lý hoạt động mượn sách của bạn.",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu",
    forgotPassword: "Quên mật khẩu?",
    resendVerification: "Gửi lại email xác minh",
    signingIn: "Đang đăng nhập...",
    login: "Đăng nhập",
    newAccount: "Chưa có tài khoản The Athenaeum?",
    createAccount: "Tạo tài khoản",
  },
};

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { locale } = useLanguage();
  const copy = loginCopy[locale];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setErrorCode(undefined);
    setNotice(null);

    const validationResult = loginSchema.safeParse({ email, password });

    if (!validationResult.success) {
      setFieldErrors(getZodFieldErrors<"email" | "password">(validationResult.error));
      return;
    }

    setIsLoading(true);

    try {
      await auth.login({ email: email.trim(), password });
      router.replace("/profile");
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setError(formatLoginError(apiError));
      setErrorCode(apiError.code);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const emailError = validateRequiredEmail(email);

    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await resendVerification({ email: email.trim() });
      setNotice(response.message || "Verification email has been sent again.");
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setError(apiError.message || "Could not resend verification email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative min-h-dvh overflow-hidden bg-[#201A16] outline-none"
      style={{
        backgroundImage: `linear-gradient(105deg, rgba(0, 0, 0, 0.76) 0%, rgba(0, 0, 0, 0.52) 42%, rgba(0, 0, 0, 0.18) 68%, rgba(255, 255, 255, 0.08) 100%), url(${LOGIN_HERO_IMAGE_URL})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.05),transparent_28%)]" />
      <div className="relative z-10 grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)]">
        <section className="flex min-h-[48vh] flex-col justify-between px-6 pb-7 pt-5 text-white sm:px-10 lg:min-h-dvh lg:px-14 lg:pt-5">
          <BrandMark />
          <div className="max-w-2xl py-12 lg:py-0">
            <p className="animate-fade-up inline-flex w-fit rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white shadow-lg shadow-black/15 backdrop-blur-md">
              {copy.heroBadge}
            </p>
            <h1 className="animate-fade-up animate-delay-75 mt-5 max-w-2xl font-serif text-4xl font-bold leading-tight text-white drop-shadow-xl md:text-6xl">
              {copy.heroTitle}
            </h1>
            <p className="animate-fade-up animate-delay-150 mt-5 max-w-xl text-base leading-8 text-white/82 drop-shadow-md md:text-lg">
              {copy.heroDescription}
            </p>
            <div className="animate-fade-up animate-delay-225 mt-9 grid max-w-xl gap-3 sm:grid-cols-3">
              {copy.stats.map(([value, label], index) => (
                <div
                  key={label}
                  className={`group rounded-2xl border border-white/16 bg-white/12 p-4 shadow-lg shadow-black/15 backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/18 ${
                    index === 0 ? "animate-delay-300" : index === 1 ? "animate-delay-375" : "animate-delay-450"
                  }`}
                >
                  <p className="font-serif text-2xl font-bold text-white">{value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/65">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] font-semibold text-white/55">
            {copy.photoCredit}
          </p>
        </section>
        <section className="flex items-center justify-start px-5 py-10 sm:px-8 lg:min-h-dvh lg:pl-4 lg:pr-12">
          <div className="animate-scale-in w-full max-w-md rounded-[2rem] border border-white bg-white p-7 shadow-[0_30px_90px_rgba(43,39,35,0.24)] sm:p-8">
            <div className="mb-8">
              <div className="-mt-2 mb-5 flex items-center justify-between gap-4">
                <Link href="/" className="font-serif text-2xl font-bold text-black">
                  The Athenaeum
                </Link>
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-black">
                  {copy.secureAccess}
                </span>
              </div>
              <h2 className="font-serif text-4xl font-bold text-black">{copy.heading}</h2>
              <p className="mt-3 text-sm leading-6 text-black/75">
                {copy.description}
              </p>
            </div>
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="text-sm font-bold text-black">
                  {copy.email}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="mt-2 h-[52px] w-full rounded-2xl border border-black/15 bg-white px-4 text-black shadow-sm outline-none transition-all duration-200 focus:border-2 focus:border-black focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,0,0,0.1)]"
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                {fieldErrors.email && (
                  <p className="mt-2 animate-fade-up text-xs font-semibold text-[#7A263A]">{fieldErrors.email}</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="password" className="text-sm font-bold text-black">
                    {copy.password}
                  </label>
                  <Link href="/forgot-password" className="auth-link-blue text-sm font-semibold transition-colors duration-200">
                    {copy.forgotPassword}
                  </Link>
                </div>
                <div className="relative mt-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="h-[52px] w-full rounded-2xl border border-black/15 bg-white px-4 pr-12 text-black shadow-sm outline-none transition-all duration-200 focus:border-2 focus:border-black focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,0,0,0.1)]"
                    placeholder={copy.passwordPlaceholder}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <PasswordVisibilityButton
                    isVisible={showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="mt-2 animate-fade-up text-xs font-semibold text-[#7A263A]">{fieldErrors.password}</p>
                )}
              </div>
              {error && (
                <div className="animate-scale-in rounded-xl border border-[#7A263A]/25 bg-[#7A263A]/10 p-4 text-sm font-semibold text-[#B00020] shadow-sm">
                  {error}
                  {errorCode === "EMAIL_NOT_VERIFIED" && (
                    <button
                      type="button"
                      className="auth-link-blue mt-2 block font-bold transition-colors duration-200"
                      onClick={handleResendVerification}
                    >
                      {copy.resendVerification}
                    </button>
                  )}
                </div>
              )}
              {notice && (
                <p className="animate-scale-in rounded-xl border border-[#28A745]/25 bg-[#28A745]/12 p-4 text-sm font-semibold text-[#1E7E34] shadow-sm">
                  {notice}
                </p>
              )}
              <button
                disabled={isLoading}
                className="inline-flex h-[52px] items-center justify-center rounded-2xl bg-[#7A263A] px-5 text-sm font-bold text-white shadow-lg shadow-[#7A263A]/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5A1C2B] hover:shadow-xl hover:shadow-[#7A263A]/40 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#BEB2A3] disabled:text-white disabled:shadow-none disabled:hover:translate-y-0"
              >
                {isLoading && (
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {isLoading ? copy.signingIn : copy.login}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-black/75">
              {copy.newAccount}{" "}
              <Link href="/register" className="auth-link-blue font-bold transition-colors duration-200">
                {copy.createAccount}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatLoginError(error: ApiError) {
  if (error.code === "INVALID_CREDENTIALS") {
    return "Email or password is incorrect.";
  }

  if (error.code === "EMAIL_NOT_VERIFIED") {
    return "Your email is not verified yet.";
  }

  if (error.code === "VALIDATION_ERROR") {
    return error.message || "Please check your email and password.";
  }

  if (error.code === "UNAUTHORIZED") {
    return "Your session is not authorized. Please log in again.";
  }

  return error.message || "Login failed. Please try again.";
}
