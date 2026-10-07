"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { editorialSerif } from "@/components/layout/editorialFont";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const profileCopy = {
  en: {
    authenticating: "Authenticating",
    checkingSession: "Checking your session...",
    eyebrow: "Account",
    pageTitle: "Profile settings",
    pageDescription: "Manage your account information and preferences for The Athenaeum.",
    fallbackName: "The Athenaeum member profile",
    labels: {
      email: "Email",
      role: "Role",
      status: "Status",
      borrowLimit: "Borrow limit",
      fullName: "Full name",
      phone: "Phone",
    },
    updateTitle: "Personal information",
    updateDescription: "Only full name and phone can be changed here.",
    profileTip: "Keep your profile up to date for a smoother library experience.",
    saving: "Saving...",
    saveChanges: "Save changes",
    fullNameRequired: "Full name is required.",
    updated: "Your profile was updated.",
    updateFailed: "Could not update profile.",
    details: "Account details",
    emailLocked: "Email cannot be changed",
    overview: "Account overview",
    overviewDescription: "A quick summary of your account details.",
    membershipProgress: "Membership progress",
    membershipHelp: "Enjoy full library access and privileges.",
    thankYouTitle: "Thank you for being part of The Athenaeum.",
    thankYouText: "Your account keeps reading activity, reservations and borrowing records in one calm workspace.",
  },
  vi: {
    authenticating: "Xác thực",
    checkingSession: "Đang kiểm tra phiên đăng nhập...",
    eyebrow: "Tài khoản",
    pageTitle: "Cài đặt hồ sơ",
    pageDescription: "Quản lý thông tin tài khoản và tùy chọn của bạn tại The Athenaeum.",
    fallbackName: "Hồ sơ thành viên The Athenaeum",
    labels: {
      email: "Email",
      role: "Vai trò",
      status: "Trạng thái",
      borrowLimit: "Giới hạn mượn",
      fullName: "Họ và tên",
      phone: "Số điện thoại",
    },
    updateTitle: "Thông tin cá nhân",
    updateDescription: "Chỉ có thể thay đổi họ tên và số điện thoại tại đây.",
    profileTip: "Luôn cập nhật hồ sơ để có trải nghiệm thư viện thuận tiện hơn.",
    saving: "Đang lưu...",
    saveChanges: "Lưu thay đổi",
    fullNameRequired: "Vui lòng nhập họ và tên.",
    updated: "Hồ sơ của bạn đã được cập nhật.",
    updateFailed: "Không thể cập nhật hồ sơ.",
    details: "Chi tiết tài khoản",
    emailLocked: "Email không thể thay đổi",
    overview: "Tổng quan tài khoản",
    overviewDescription: "Thông tin tóm tắt nhanh về tài khoản của bạn.",
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
    <div className="min-h-dvh bg-[#F7F1EA]">
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative isolate min-h-[calc(100dvh-4.5rem)] overflow-hidden px-4 py-8 outline-none sm:px-6 lg:px-8 lg:py-10"
      >
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[url('/profile-library-bg.png')] bg-cover bg-top" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,252,248,0.14),rgba(249,245,239,0.52))]" />

        <div className="mx-auto w-full max-w-[90rem]">
          <header className="mb-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7D756C]">{copy.eyebrow}</p>
            <h1 className={`${editorialSerif.className} mt-2 text-4xl font-semibold tracking-[-0.035em] text-[#171412] sm:text-5xl`}>
              {copy.pageTitle}
            </h1>
            <p className="mt-2 text-base leading-7 text-[#756E67]">{copy.pageDescription}</p>
          </header>

          <section className="grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)] lg:items-start">
            <aside className="overflow-hidden rounded-[26px] border border-white/80 bg-white/88 shadow-[0_24px_70px_rgba(78,56,42,0.12)] backdrop-blur-md">
              <div className="relative h-32 overflow-hidden bg-[linear-gradient(135deg,#5A1725_0%,#8D243E_55%,#45111B_100%)]">
                <div aria-hidden="true" className="absolute -left-12 -top-24 h-64 w-64 rounded-full border border-white/15" />
                <div aria-hidden="true" className="absolute left-24 -top-10 h-56 w-56 rounded-full border border-white/10" />
                <div aria-hidden="true" className="absolute -right-12 top-4 h-44 w-44 rounded-full border border-white/15" />
              </div>

              <div className="px-6 pb-7">
                <div className="-mt-16 flex flex-col items-center text-center">
                  <div className="relative z-10 grid h-28 w-28 place-items-center rounded-full border-[5px] border-white bg-[#0F0F10] shadow-[0_16px_36px_rgba(0,0,0,0.2)]">
                    <span className={`${editorialSerif.className} text-4xl text-white`}>{profileInitials}</span>
                  </div>
                  <h2 className={`${editorialSerif.className} mt-4 text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#171412]`}>
                    {profileName}
                  </h2>
                  <div className="mt-2 flex max-w-full items-center gap-2 text-sm text-[#746D66]">
                    <ProfileIcon name="mail" className="h-4 w-4 shrink-0" />
                    <span className="truncate">{auth.currentUser?.email ?? "-"}</span>
                  </div>
                </div>

                <div className="mt-7 space-y-3">
                  {detailItems.slice(1).map((item) => (
                    <ProfileFact key={item.label} icon={item.icon} label={item.label} value={item.value} />
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-[#DED6CE] bg-white/70 p-5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold text-[#302B27]">{copy.membershipProgress}</span>
                    <span className="font-bold text-[#171412]">{membershipProgress}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8E1DA]">
                    <div className="h-full rounded-full bg-[#8D1534]" style={{ width: `${membershipProgress}%` }} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#79716A]">{copy.membershipHelp}</p>
                </div>
              </div>
            </aside>

            <div className="space-y-5">
              <form onSubmit={handleSubmit} className="overflow-hidden rounded-[26px] border border-white/80 bg-white/90 shadow-[0_24px_70px_rgba(78,56,42,0.12)] backdrop-blur-md">
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <h2 className={`${editorialSerif.className} text-3xl font-semibold tracking-[-0.03em] text-[#171412]`}>
                        {copy.updateTitle}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[#756E67]">{copy.updateDescription}</p>
                    </div>
                    <div className="hidden max-w-[250px] items-center gap-4 xl:flex">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#E8DED5] bg-[#FAF7F2]">
                        <ProfileIcon name="book" className="h-7 w-7 text-[#9A8A7B]" />
                      </div>
                      <p className="text-xs leading-5 text-[#7D756E]">{copy.profileTip}</p>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-5 md:grid-cols-2">
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

                  <label className="mt-5 block">
                    <span className="text-sm font-semibold text-[#211D1A]">
                      {copy.labels.email} <span className="font-normal text-[#827A73]">({copy.emailLocked})</span>
                    </span>
                    <span className="mt-2 flex items-center gap-3 rounded-xl border border-[#DCD5CE] bg-[#F5F3F0] px-4 py-3.5 text-[#827A73]">
                      <ProfileIcon name="mail" className="h-5 w-5 shrink-0" />
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

                <div className="flex justify-end border-t border-[#E8E1DA] bg-white/55 p-5 md:px-8">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#8D1534] px-7 text-sm font-bold text-white shadow-[0_14px_30px_rgba(141,21,52,0.24)] transition hover:-translate-y-0.5 hover:bg-[#6F1028] disabled:opacity-60"
                  >
                    <ProfileIcon name="save" className="h-5 w-5" />
                    {isSaving ? copy.saving : copy.saveChanges}
                  </button>
                </div>
              </form>

              <section className="rounded-[26px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(78,56,42,0.12)] backdrop-blur-md md:p-8">
                <h2 className={`${editorialSerif.className} text-3xl font-semibold tracking-[-0.03em] text-[#171412]`}>{copy.overview}</h2>
                <p className="mt-1 text-sm leading-6 text-[#756E67]">{copy.overviewDescription}</p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {detailItems.map((item) => (
                    <OverviewCard key={item.label} icon={item.icon} label={item.label} value={item.value} />
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[#E6DED6] bg-white/65 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#F5E7EA] text-[#7A263A]">
                    <ProfileIcon name="book" className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#211D1A]">{copy.thankYouTitle}</h3>
                    <p className="mt-0.5 text-sm leading-6 text-[#756E67]">{copy.thankYouText}</p>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
      <Footer />
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
  const iconTone = icon === "shield"
    ? "bg-[#E9F4E7] text-[#315A38]"
    : icon === "book"
      ? "bg-[#F8EEDF] text-[#6F4527]"
      : "bg-[#F8E7EA] text-[#7A263A]";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#E3DDD6] bg-white/72 px-4 py-3.5">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${iconTone}`}>
        <ProfileIcon name={icon} className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#80776F]">{label}</p>
        <p className="mt-0.5 truncate font-bold text-[#211D1A]">{value}</p>
      </div>
      <span aria-hidden="true" className="text-xl text-[#948A82]">›</span>
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
  const iconTone = icon === "shield"
    ? "bg-[#E9F4E7] text-[#315A38]"
    : icon === "book"
      ? "bg-[#F8EEDF] text-[#6F4527]"
      : "bg-[#F8E7EA] text-[#7A263A]";

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#E6DED6] bg-white/68 p-4">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${iconTone}`}>
        <ProfileIcon name={icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#80776F]">{label}</p>
        <p className="mt-1 truncate font-bold text-[#211D1A]">{value}</p>
      </div>
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
      <span className="text-sm font-semibold text-[#211D1A]">{label}</span>
      <span className="mt-2 flex items-center gap-3 rounded-xl border border-[#DCD5CE] bg-white/78 px-4 py-3.5 transition focus-within:border-[#8D1534] focus-within:ring-2 focus-within:ring-[#8D1534]/10">
        <ProfileIcon name={icon} className="h-5 w-5 shrink-0 text-[#453F39]" />
        <input
          name={name}
          defaultValue={defaultValue}
          className="min-w-0 flex-1 bg-transparent text-[#211D1A] outline-none"
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

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "A";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}
