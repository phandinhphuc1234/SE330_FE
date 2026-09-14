"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/layout/BrandMark";
import { ApiError } from "@/types/api.type";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { registerAccount, resendVerification } from "../services/authService";
import { getZodFieldErrors, registerSchema, validateRegisterPassword } from "../validations/authValidation";
import { PasswordVisibilityButton } from "./PasswordVisibilityButton";

type RegisterForm = {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  phone: string;
};

const initialForm: RegisterForm = {
  email: "",
  fullName: "",
  password: "",
  confirmPassword: "",
  phone: "",
};

const REGISTER_HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1760166699654-5d0e10f51994?auto=format&fit=crop&fm=jpg&q=80&w=2200";

const registerCopy = {
  en: {
    heroBadge: "Member registration",
    heroTitle: "Build your personal library trail.",
    heroDescription: "Join The Athenaeum to reserve books, follow pickup windows, and keep every loan moving from one account.",
    photoCredit: "Photo by Fer Troulik on Unsplash",
    newMember: "New member",
    heading: "Create your account",
    description: "Enter your details. We will send a 9-digit verification code to your email.",
    fields: {
      fullName: "Full name",
      fullNamePlaceholder: "Your full name",
      email: "Email",
      emailPlaceholder: "you@example.com",
      phone: "Phone",
      phonePlaceholder: "Your phone number (optional)",
      password: "Password",
      passwordPlaceholder: "Create a password",
      confirmPassword: "Confirm password",
      confirmPasswordPlaceholder: "Confirm your password",
    },
    passwordStrength: "Password strength",
    creating: "Creating account...",
    createAccount: "Create account",
    alreadyHaveAccount: "Already have an account?",
    login: "Login",
    steps: ["Register", "Verify email", "Activated"],
    checkInbox: "Check your inbox",
    verifyEmail: "Please verify your email",
    sentTo: "We sent a 9-digit verification code to",
    pending: "Your account will stay pending until you confirm it.",
    hints: [
      "Check your spam or promotions folder if the email is not visible.",
      "The verification code expires after 10 minutes.",
      "Only the newest verification code is valid.",
    ],
    resendIn: "Resend in",
    resendEmail: "Resend email",
    backToLogin: "Back to login",
    editDetails: "Need to edit details?",
    backToRegistration: "Back to registration",
  },
  vi: {
    heroBadge: "Đăng ký thành viên",
    heroTitle: "Tạo hành trình thư viện cá nhân của bạn.",
    heroDescription: "Tham gia The Athenaeum để đặt giữ sách, theo dõi thời hạn nhận sách và quản lý mọi khoản mượn từ một tài khoản.",
    photoCredit: "Ảnh bởi Fer Troulik trên Unsplash",
    newMember: "Thành viên mới",
    heading: "Tạo tài khoản",
    description: "Nhập thông tin của bạn. Chúng tôi sẽ gửi mã xác thực 9 chữ số đến email.",
    fields: {
      fullName: "Họ và tên",
      fullNamePlaceholder: "Họ và tên của bạn",
      email: "Email",
      emailPlaceholder: "you@example.com",
      phone: "Số điện thoại",
      phonePlaceholder: "Số điện thoại của bạn (không bắt buộc)",
      password: "Mật khẩu",
      passwordPlaceholder: "Tạo mật khẩu",
      confirmPassword: "Xác nhận mật khẩu",
      confirmPasswordPlaceholder: "Nhập lại mật khẩu",
    },
    passwordStrength: "Độ mạnh mật khẩu",
    creating: "Đang tạo tài khoản...",
    createAccount: "Tạo tài khoản",
    alreadyHaveAccount: "Đã có tài khoản?",
    login: "Đăng nhập",
    steps: ["Đăng ký", "Xác minh email", "Kích hoạt"],
    checkInbox: "Kiểm tra hộp thư",
    verifyEmail: "Vui lòng xác minh email",
    sentTo: "Chúng tôi đã gửi mã xác thực 9 chữ số đến",
    pending: "Tài khoản sẽ ở trạng thái chờ cho đến khi bạn xác nhận.",
    hints: [
      "Kiểm tra thư rác hoặc mục quảng cáo nếu không thấy email.",
      "Mã xác thực hết hạn sau 10 phút.",
      "Chỉ mã xác thực được gửi gần nhất có hiệu lực.",
    ],
    resendIn: "Gửi lại sau",
    resendEmail: "Gửi lại email",
    backToLogin: "Về đăng nhập",
    editDetails: "Cần sửa thông tin?",
    backToRegistration: "Quay lại đăng ký",
  },
};

type RegisterFieldErrors = Partial<Record<keyof RegisterForm, string>>;

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score += 1;

  if (score <= 1) return { label: "Weak", width: "w-1/3", color: "bg-[#D7263D]" };
  if (score <= 3) return { label: "Medium", width: "w-2/3", color: "bg-[#D8A31A]" };

  return { label: "Strong", width: "w-full", color: "bg-[#2E7D62]" };
}

function validateRegisterForm(form: RegisterForm) {
  const result = registerSchema.safeParse(form);

  if (result.success) return {};

  return getZodFieldErrors<keyof RegisterForm>(result.error);
}

function isRegisterFormValid(form: RegisterForm) {
  return Object.keys(validateRegisterForm(form)).length === 0;
}

export function RegisterFlow() {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy = registerCopy[locale];
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const passwordError = validateRegisterPassword(form.password);
  const passwordMeetsRules = !passwordError;
  const canSubmit = isRegisterFormValid(form);

  const updateField = (field: keyof RegisterForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors = validateRegisterForm(form);
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await registerAccount({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      window.sessionStorage.setItem("pendingVerificationEmail", form.email.trim());
      setIsSubmitted(true);
      router.push(`/check-email?email=${encodeURIComponent(form.email.trim())}`);
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setError(formatRegisterError(apiError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setCooldown(60);
    await resendVerification({ email: form.email }).catch(() => undefined);
    const timerId = window.setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timerId);
          return 0;
        }

        return current - 1;
      });
    }, 1000);
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative min-h-dvh overflow-hidden bg-[#050726] outline-none"
      style={{
        backgroundImage: `linear-gradient(105deg, rgba(0, 0, 0, 0.76) 0%, rgba(0, 0, 0, 0.52) 42%, rgba(0, 0, 0, 0.18) 68%, rgba(255, 255, 255, 0.08) 100%), url(${REGISTER_HERO_IMAGE_URL})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.05),transparent_28%)]" />
      <div className="relative z-10 grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(460px,600px)]">
        <section className="flex min-h-[48vh] flex-col justify-between px-6 py-7 text-white sm:px-10 lg:min-h-dvh lg:px-14">
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
            <StepIndicator currentStep={isSubmitted ? 2 : 1} steps={copy.steps} />
          </div>
          <p className="text-[11px] font-semibold text-white/55">
            {copy.photoCredit}
          </p>
        </section>

        <section className="flex items-center justify-start px-5 py-10 sm:px-8 lg:min-h-dvh lg:pl-4 lg:pr-12">
          {isSubmitted ? (
            <VerificationPending email={form.email} cooldown={cooldown} onResend={handleResend} copy={copy} />
          ) : (
            <div className="animate-scale-in w-full max-w-lg rounded-[2rem] border border-white bg-white p-7 shadow-[0_30px_90px_rgba(0,0,84,0.26)] sm:p-8">
              <div className="mb-8">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <Link href="/" className="font-serif text-2xl font-bold text-black">
                    The Athenaeum
                  </Link>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-black">
                    {copy.newMember}
                  </span>
                </div>
                <h2 className="font-serif text-4xl font-bold text-black">{copy.heading}</h2>
                <p className="mt-3 text-sm leading-6 text-black/75">
                  {copy.description}
                </p>
              </div>

              <form className="grid gap-4" onSubmit={handleSubmit}>
                <Field
                  id="fullName"
                  label={copy.fields.fullName}
                  value={form.fullName}
                  placeholder={copy.fields.fullNamePlaceholder}
                  autoComplete="name"
                  error={fieldErrors.fullName}
                  onChange={(value) => updateField("fullName", value)}
                />
                <Field
                  id="email"
                  label={copy.fields.email}
                  type="email"
                  value={form.email}
                  placeholder={copy.fields.emailPlaceholder}
                  autoComplete="email"
                  error={fieldErrors.email}
                  onChange={(value) => updateField("email", value)}
                />
                <Field
                  id="phone"
                  label={copy.fields.phone}
                  type="tel"
                  value={form.phone}
                  placeholder={copy.fields.phonePlaceholder}
                  autoComplete="tel"
                  error={fieldErrors.phone}
                  onChange={(value) => updateField("phone", value)}
                />
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <label htmlFor="password" className="text-sm font-bold text-black">
                      {copy.fields.password}
                    </label>
                  </div>
                  <div className="relative mt-2">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="h-[50px] w-full rounded-2xl border border-black/15 bg-white px-4 pr-12 text-black shadow-sm outline-none transition-all duration-200 focus:border-2 focus:border-black focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,0,0,0.1)]"
                      placeholder={copy.fields.passwordPlaceholder}
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                    />
                    <PasswordVisibilityButton
                      isVisible={showPassword}
                      onClick={() => setShowPassword((current) => !current)}
                    />
                  </div>
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-[#EDEDF2]">
                      <div className={`h-full rounded-full ${strength.width} ${strength.color} transition-all duration-300`} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-black/75">{copy.passwordStrength}: {strength.label}</p>
                    {!passwordMeetsRules && form.password.length > 0 && (
                      <p className="mt-2 animate-fade-up text-xs font-semibold text-[#E60028]">
                        {passwordError}
                      </p>
                    )}
                    {fieldErrors.password && (
                      <p className="mt-2 animate-fade-up text-xs font-semibold text-[#E60028]">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                </div>
                <Field
                  id="confirmPassword"
                  label={copy.fields.confirmPassword}
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  placeholder={copy.fields.confirmPasswordPlaceholder}
                  autoComplete="new-password"
                  error={fieldErrors.confirmPassword}
                  hasPasswordToggle
                  isPasswordVisible={showPassword}
                  onTogglePassword={() => setShowPassword((current) => !current)}
                  onChange={(value) => updateField("confirmPassword", value)}
                />

                {error && (
                  <p className="animate-scale-in rounded-xl border border-[#E60028]/25 bg-[#E60028]/10 p-4 text-sm font-semibold text-[#B00020] shadow-sm">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="inline-flex h-[52px] items-center justify-center rounded-2xl bg-[#E60028] px-5 text-sm font-bold text-white shadow-lg shadow-[#E60028]/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C90022] hover:shadow-xl hover:shadow-[#E60028]/40 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#B8BBC8] disabled:text-white disabled:shadow-none disabled:hover:translate-y-0"
                >
                  {isSubmitting && (
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {isSubmitting ? copy.creating : copy.createAccount}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-black/75">
                {copy.alreadyHaveAccount}{" "}
                <Link href="/login" className="auth-link-blue font-bold transition-colors duration-200">
                  {copy.login}
                </Link>
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatRegisterError(error: ApiError) {
  if (error.code === "EMAIL_ALREADY_EXISTS") {
    return "This email is already registered. Please log in or use another email.";
  }

  if (error.code === "VALIDATION_ERROR") {
    return error.message || "Please check your registration details.";
  }

  return error.message || "Could not create account. Please try again.";
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  error,
  hasPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePassword,
}: {
  id: keyof RegisterForm;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  hasPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-black">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          className={`h-[50px] w-full rounded-2xl border border-black/15 bg-white px-4 text-black shadow-sm outline-none transition-all duration-200 focus:border-2 focus:border-black focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,0,0,0.1)] ${
            hasPasswordToggle ? "pr-12" : ""
          }`}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {hasPasswordToggle && onTogglePassword && (
          <PasswordVisibilityButton
            isVisible={isPasswordVisible}
            label={label.toLowerCase()}
            onClick={onTogglePassword}
          />
        )}
      </div>
      {error && <p className="mt-2 animate-fade-up text-xs font-semibold text-[#E60028]">{error}</p>}
    </div>
  );
}

function StepIndicator({ currentStep, steps }: { currentStep: 1 | 2 | 3; steps: string[] }) {
  return (
    <div className="animate-fade-up animate-delay-225 mt-9 grid max-w-xl gap-3 sm:grid-cols-3">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= currentStep;

        return (
          <div
            key={step}
            className={`group rounded-2xl border p-4 shadow-lg shadow-black/15 backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 ${
              isActive 
                ? "border-white/35 bg-white/18" 
                : "border-white/15 bg-white/8"
            }`}
          >
            <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${
              isActive ? "bg-white text-black" : "bg-white/12 text-white/65"
            }`}>
              {stepNumber}
            </span>
            <p className={`mt-2 text-sm font-bold transition-colors duration-300 ${
              isActive ? "text-white" : "text-white/70"
            }`}>
              {step}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function VerificationPending({
  email,
  cooldown,
  onResend,
  copy,
}: {
  email: string;
  cooldown: number;
  onResend: () => void;
  copy: typeof registerCopy.en;
}) {
  return (
    <div className="animate-scale-in w-full max-w-lg rounded-[2rem] border border-white bg-white p-8 shadow-[0_30px_90px_rgba(0,0,84,0.26)]">
      <p className="text-sm font-bold uppercase tracking-wide text-black">{copy.checkInbox}</p>
      <h2 className="mt-3 font-serif text-3xl font-bold text-black">{copy.verifyEmail}</h2>
      <p className="mt-3 text-sm leading-6 text-black/75">
        {copy.sentTo} <span className="font-bold text-black">{email}</span>. {copy.pending}
      </p>

      <div className="mt-6 grid gap-3">
        {copy.hints.map((hint, index) => (
          <div
            key={hint}
            className={`animate-fade-up rounded-xl border border-black/10 bg-black/[0.03] p-4 text-sm leading-6 text-black/75 shadow-sm ${
              index === 0 ? "animate-delay-75" : index === 1 ? "animate-delay-150" : "animate-delay-225"
            }`}
          >
            {hint}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={cooldown > 0}
          className="h-[52px] rounded-2xl bg-[#E60028] px-5 text-sm font-bold text-white shadow-lg shadow-[#E60028]/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C90022] hover:shadow-xl hover:shadow-[#E60028]/40 disabled:cursor-not-allowed disabled:bg-[#B8BBC8] disabled:shadow-none disabled:hover:translate-y-0"
          onClick={onResend}
        >
          {cooldown > 0 ? `${copy.resendIn} ${cooldown}s` : copy.resendEmail}
        </button>
        <Link
          href="/login"
          className="inline-flex h-[52px] items-center justify-center rounded-2xl border-2 border-black px-5 text-sm font-bold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-black hover:text-white hover:shadow-md"
        >
          {copy.backToLogin}
        </Link>
      </div>

      <p className="mt-5 text-center text-sm text-black/75">
        {copy.editDetails}{" "}
        <button type="button" className="auth-link-blue font-bold transition-colors duration-200" onClick={() => window.location.reload()}>
          {copy.backToRegistration}
        </button>
      </p>
    </div>
  );
}
