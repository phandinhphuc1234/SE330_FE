"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const profileCopy = {
  en: {
    authenticating: "Authenticating",
    checkingSession: "Checking your session...",
    eyebrow: "My profile",
    fallbackName: "The Athenaeum member profile",
    labels: {
      email: "Email",
      role: "Role",
      status: "Status",
      borrowLimit: "Borrow limit",
      fullName: "Full name",
      phone: "Phone",
    },
    updateTitle: "Update profile",
    updateDescription: "Only full name and phone can be changed here.",
    saving: "Saving...",
    saveChanges: "Save changes",
    fullNameRequired: "Full name is required.",
    updated: "Your profile was updated.",
    updateFailed: "Could not update profile.",
    details: "Account details",
    emailLocked: "Email cannot be changed",
    overview: "Account overview",
    membershipProgress: "Membership progress",
    membershipHelp: "Enjoy full library access and privileges.",
    thankYouTitle: "Thank you for being part of The Athenaeum.",
    thankYouText: "Your account keeps reading activity, reservations and borrowing records in one calm workspace.",
  },
  vi: {
    authenticating: "Xác thực",
    checkingSession: "Đang kiểm tra phiên đăng nhập...",
    eyebrow: "Hồ sơ của tôi",
    fallbackName: "Hồ sơ thành viên The Athenaeum",
    labels: {
      email: "Email",
      role: "Vai trò",
      status: "Trạng thái",
      borrowLimit: "Giới hạn mượn",
      fullName: "Họ và tên",
      phone: "Số điện thoại",
    },
    updateTitle: "Cập nhật hồ sơ",
    updateDescription: "Chỉ có thể thay đổi họ tên và số điện thoại tại đây.",
    saving: "Đang lưu...",
    saveChanges: "Lưu thay đổi",
    fullNameRequired: "Vui lòng nhập họ và tên.",
    updated: "Hồ sơ của bạn đã được cập nhật.",
    updateFailed: "Không thể cập nhật hồ sơ.",
    details: "Chi tiết tài khoản",
    emailLocked: "Email không thể thay đổi",
    overview: "Tổng quan tài khoản",
    membershipProgress: "Tiến độ thành viên",
    membershipHelp: "Tận hưởng đầy đủ quyền truy cập và đặc quyền thư viện.",
    thankYouTitle: "Cảm ơn bạn đã đồng hành cùng The Athenaeum.",
    thankYouText: "Tài khoản giúp bạn quản lý hoạt động đọc, đặt giữ và mượn sách trong một không gian gọn gàng.",
  },
};

export function ProfilePanel() {
  const router = useRouter();
  const auth = useAuth();
  const { locale } = useLanguage();
  const copy = profileCopy[locale];
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!auth.isInitializing && !auth.isAuthenticated) {
      router.push("/login");
    }
  }, [auth.isAuthenticated, auth.isInitializing, router]);

  if (auth.isInitializing || !auth.isAuthenticated) {
    return (
      <main id="main-content" tabIndex={-1} className="flex min-h-dvh items-center justify-center bg-[#F7F3EA] px-5 outline-none">
        <div className="w-full max-w-md rounded-2xl border border-[#DED5C8] bg-white p-8 text-center shadow-[0_24px_60px_rgba(17,24,39,0.14)]">
          <p className="text-sm font-bold uppercase tracking-wide text-black/70">{copy.authenticating}</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-black">{copy.checkingSession}</h1>
        </div>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!fullName) {
      setError(copy.fullNameRequired);
      return;
    }

    setIsSaving(true);
    try {
      await auth.updateProfile({ fullName, phone });
      setMessage(copy.updated);
      setError("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.updateFailed);
      setMessage("");
    } finally {
      setIsSaving(false);
    }
  }

  const profileName = auth.currentUser?.fullName || copy.fallbackName;
  const profileInitials = initialsOf(profileName);
  const membershipProgress = Math.min(
    100,
    Math.max(35, Number(auth.currentUser?.maxBorrowLimit ?? 0) * 5 || 70),
  );
  const detailItems = [
    { label: copy.labels.email, value: auth.currentUser?.email ?? "-", icon: "mail" },
    { label: copy.labels.role, value: auth.currentUser?.role ?? "-", icon: "user" },
    { label: copy.labels.status, value: auth.currentUser?.status ?? "-", icon: "shield" },
    { label: copy.labels.borrowLimit, value: String(auth.currentUser?.maxBorrowLimit ?? "-"), icon: "book" },
  ] as const;

  return (
    <div className="min-h-dvh bg-[#f8f7f4]">
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative isolate min-h-[calc(100dvh-4.5rem)] overflow-hidden px-5 py-10 outline-none lg:px-8"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -left-28 top-12 -z-10 h-72 w-72 rounded-full border border-black/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-8 -z-10 h-96 w-96 rounded-full border border-black/5" />
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-20 -z-10 h-px w-44 rotate-[72deg] bg-black/10" />
        <div aria-hidden="true" className="pointer-events-none absolute right-8 top-44 -z-10 text-4xl text-black/10">✧</div>

        <section className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[370px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-black/10 bg-white/90 p-7 shadow-[0_24px_70px_rgba(17,24,39,0.08)] backdrop-blur">
            <SectionEyebrow>{copy.eyebrow}</SectionEyebrow>
            <div className="mt-7 flex flex-col items-center text-center">
              <div className="relative grid h-32 w-32 place-items-center rounded-full border border-black/12 bg-white p-1 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                <div className="grid h-full w-full place-items-center rounded-full bg-black font-serif text-5xl text-white">
                  {profileInitials}
                </div>
                <span aria-hidden="true" className="absolute -right-5 top-6 text-2xl text-black/70">✧</span>
              </div>
              <h1 className="mt-8 font-serif text-4xl font-semibold leading-tight tracking-[-0.04em] text-black">
                {profileName}
              </h1>
              <div className="mt-4 flex max-w-full items-center gap-2 text-sm text-black/65">
                <ProfileIcon name="mail" className="h-4 w-4 shrink-0" />
                <span className="truncate">{auth.currentUser?.email ?? "-"}</span>
              </div>
            </div>

            <div className="mt-8 space-y-3 border-t border-black/10 pt-6">
              {detailItems.slice(1).map((item) => (
                <ProfileFact key={item.label} icon={item.icon} label={item.label} value={item.value} />
              ))}
            </div>

            <div className="mt-7 rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-black/80">{copy.membershipProgress}</span>
                <span className="font-semibold text-black">{membershipProgress}%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-black" style={{ width: `${membershipProgress}%` }} />
              </div>
              <p className="mt-4 text-sm leading-6 text-black/60">{copy.membershipHelp}</p>
            </div>
          </aside>

          <section className="rounded-[28px] border border-black/10 bg-white/90 p-7 shadow-[0_24px_70px_rgba(17,24,39,0.08)] backdrop-blur">
            <SectionEyebrow>{copy.details}</SectionEyebrow>

            <form onSubmit={handleSubmit} className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
              <div className="relative p-6 md:p-8">
                <div aria-hidden="true" className="absolute right-8 top-5 hidden text-black/10 md:block">
                  <OpenBookIllustration />
                </div>
                <div className="relative max-w-2xl">
                  <h2 className="font-serif text-3xl font-semibold tracking-[-0.03em] text-black">
                    {copy.updateTitle}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-black/65">{copy.updateDescription}</p>
                </div>

                <div className="relative mt-8 grid gap-5 md:grid-cols-2">
                  <TextField
                    label={copy.labels.fullName}
                    name="fullName"
                    defaultValue={auth.currentUser?.fullName ?? ""}
                    icon="user"
                  />
                  <TextField
                    label={copy.labels.phone}
                    name="phone"
                    defaultValue={auth.currentUser?.phone ?? ""}
                    icon="phone"
                  />
                </div>

                <label className="relative mt-5 block">
                  <span className="text-sm font-semibold text-black">
                    {copy.labels.email} <span className="font-normal text-black/60">({copy.emailLocked})</span>
                  </span>
                  <span className="mt-2 flex items-center gap-3 rounded-xl border border-black/12 bg-black/[0.03] px-4 py-3 text-black/55">
                    <ProfileIcon name="lock" className="h-5 w-5 shrink-0" />
                    <input
                      value={auth.currentUser?.email ?? "-"}
                      readOnly
                      aria-label={copy.labels.email}
                      className="min-w-0 flex-1 bg-transparent outline-none"
                    />
                  </span>
                </label>

                {message ? <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p> : null}
                {error ? <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}
              </div>

              <div className="flex justify-end border-t border-black/10 bg-[#fbfaf8] p-5 md:px-8">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-3 rounded-xl bg-black px-7 py-4 text-sm font-bold text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#7A263A] disabled:opacity-60"
                >
                  <ProfileIcon name="save" className="h-5 w-5" />
                  {isSaving ? copy.saving : copy.saveChanges}
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-serif text-2xl font-semibold tracking-[-0.03em] text-black">{copy.overview}</h2>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {detailItems.map((item) => (
                  <OverviewCard key={item.label} icon={item.icon} label={item.label} value={item.value} />
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-5 rounded-2xl border border-black/10 bg-white p-5">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-black/[0.04]">
                <ProfileIcon name="book" className="h-7 w-7 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-black">{copy.thankYouTitle}</h3>
                <p className="mt-1 text-sm leading-6 text-black/60">{copy.thankYouText}</p>
              </div>
            </div>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-black">{children}</p>
      <span className="mt-3 block h-px w-8 bg-black" />
    </div>
  );
}

function ProfileFact({
  icon,
  label,
  value,
}: {
  icon: ProfileIconName;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white px-4 py-3">
      <ProfileIcon name={icon} className="h-7 w-7 shrink-0 text-black" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-black/55">{label}</p>
        <p className="mt-0.5 truncate font-bold text-black">{value}</p>
      </div>
      <span aria-hidden="true" className="text-xl text-black/55">›</span>
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
}: {
  icon: ProfileIconName;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-black/10 bg-black/[0.03]">
        <ProfileIcon name={icon} className="h-6 w-6 text-black" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-black/55">{label}</p>
        <p className="mt-1 truncate font-serif text-xl font-semibold text-black">{value}</p>
      </div>
      <span aria-hidden="true" className="text-xl text-black/55">›</span>
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  icon,
}: {
  label: string;
  name: string;
  defaultValue: string;
  icon: ProfileIconName;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-black">{label}</span>
      <span className="mt-2 flex items-center gap-3 rounded-xl border border-black/12 bg-white px-4 py-3 transition focus-within:border-black">
        <ProfileIcon name={icon} className="h-5 w-5 shrink-0 text-black" />
        <input
          name={name}
          defaultValue={defaultValue}
          className="min-w-0 flex-1 bg-transparent outline-none"
        />
      </span>
    </label>
  );
}

type ProfileIconName = "book" | "lock" | "mail" | "phone" | "save" | "shield" | "user";

function ProfileIcon({ name, className = "" }: { name: ProfileIconName; className?: string }) {
  const paths: Record<ProfileIconName, React.ReactNode> = {
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M4 5.5v16" />
        <path d="M8 7h8" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    mail: (
      <>
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="m4 8 8 6 8-6" />
      </>
    ),
    phone: (
      <path d="M7 4h3l1.5 4-2 1.2a11 11 0 0 0 5.3 5.3l1.2-2 4 1.5v3a2 2 0 0 1-2 2A14 14 0 0 1 5 6a2 2 0 0 1 2-2z" />
    ),
    save: (
      <>
        <path d="M5 4h12l2 2v14H5z" />
        <path d="M8 4v6h8V4" />
        <path d="M8 20v-6h8v6" />
      </>
    ),
    shield: (
      <path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z" />
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      {paths[name]}
    </svg>
  );
}

function OpenBookIllustration() {
  return (
    <svg viewBox="0 0 220 100" aria-hidden="true" className="h-24 w-56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
      <path d="M22 74c28-12 54-8 86 8V24C78 9 50 8 22 20z" />
      <path d="M198 74c-28-12-54-8-86 8V24c30-15 58-16 86-4z" />
      <path d="M110 24v58" />
      <path d="M42 30c16-4 33-2 50 6" />
      <path d="M42 43c16-4 33-2 50 6" />
      <path d="M128 36c16-8 32-10 50-6" />
      <path d="M128 49c16-8 32-10 50-6" />
      <path d="M164 12c10-3 16-8 24-16-2 14-6 25-20 35" />
      <path d="M168 31c-7 8-14 16-21 25" />
    </svg>
  );
}

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "A";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}
