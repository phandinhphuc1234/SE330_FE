"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UsersRound } from "@/components/animate-ui/icons/users-round";
import { publicNavItems } from "@/constants/nav-items";
import { useAuth } from "@/features/auth/context/AuthContext";
import { TranslationKey, useLanguage } from "@/features/i18n/context/LanguageContext";
import { BrandMark } from "./BrandMark";

type TopNavItem = {
  labelKey: TranslationKey;
  href: string;
  originalHref?: string;
};

const publicNavLabelKeys: Record<string, TranslationKey> = {
  "/books": "nav.books",
  "/borrowing-guide": "nav.borrowingGuide",
  "/user/holds": "nav.reservations",
  "/notices": "nav.libraryNotices",
  "/about": "nav.about",
};

export function Navbar() {
  const {
    currentUser,
    hasAdminAccess,
    hasStaffAccess,
    isAuthenticated,
    isInitializing,
    logout,
  } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const staffBooksHref = hasAdminAccess ? "/admin/books" : "/staff/books";
  const staffNavItems: TopNavItem[] = [
    ...(hasAdminAccess ? [{ labelKey: "nav.dashboard", href: "/admin/dashboard" } as TopNavItem] : []),
    { labelKey: "nav.books", href: staffBooksHref, originalHref: "/books" },
    { labelKey: "nav.borrowingGuide", href: "/borrowing-guide" },
    { labelKey: "nav.libraryNotices", href: "/notices" },
    { labelKey: "nav.about", href: "/about" },
    { labelKey: "nav.circulation", href: "/staff/circulation" },
    { labelKey: "nav.borrowers", href: "/staff/members" },
  ];
  const topNavItems: TopNavItem[] = hasStaffAccess
    ? staffNavItems
    : publicNavItems.map((item) => ({
        labelKey: publicNavLabelKeys[item.href],
        href: item.href,
        originalHref: item.href,
      }));

  return (
    <header
      className="sticky inset-x-0 top-0 z-30 border-b border-[#EDEDF2] bg-white text-[#111827] shadow-[0_12px_30px_rgba(7,7,88,0.12)]"
    >
      <nav className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between gap-5 px-5 py-3 lg:px-8">
        <BrandMark tone="dark" />
        <div className="hidden items-center gap-1 lg:flex">
          {topNavItems.map((item) => {
            const originalHref = item.originalHref ?? item.href;
            const isActive = isActiveNavItem(pathname, originalHref, item.href, hasStaffAccess);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group relative rounded-full px-3 py-2 text-sm font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#F1F2F4] hover:text-black ${
                  isActive ? "bg-[#F1F2F4] text-black" : ""
                }`}
              >
                {t(item.labelKey)}
                <span
                  className={`absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-[#E60028] transition-transform duration-200 ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {isInitializing ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-[#EDEDF2]" aria-label="Checking session" />
          ) : isAuthenticated ? (
            <UserMenu
              currentUser={currentUser}
              hasAdminAccess={hasAdminAccess}
              hasStaffAccess={hasStaffAccess}
              onLogout={() => logout()}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-sm font-semibold text-[#111827] transition-colors duration-75 hover:bg-[#F1F2F4] hover:text-black"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-[#E60028] to-[#c90022] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-[#E60028]/25 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[#E60028]/35"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function LanguageToggle() {
  const { nextLocale, toggleLocale, t } = useLanguage();
  const nextLabel = nextLocale.toUpperCase();
  const title = nextLocale === "vi" ? t("language.switchToVietnamese") : t("language.switchToEnglish");

  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      onClick={toggleLocale}
      className="inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-bold text-[#4B5563] transition hover:bg-[#F1F2F4] hover:text-black focus:outline-none focus:ring-4 focus:ring-black/10"
    >
      <svg
        aria-hidden="true"
        className="h-[17px] w-[17px]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.2 2.3 3.4 5.3 3.4 9s-1.2 6.7-3.4 9" />
        <path d="M12 3C9.8 5.3 8.6 8.3 8.6 12s1.2 6.7 3.4 9" />
      </svg>
      <span className="leading-none">{nextLabel}</span>
    </button>
  );
}

function isActiveNavItem(pathname: string, originalHref: string, resolvedHref: string, hasStaffAccess: boolean) {
  if (pathname === "/" || pathname === "") return false;

  if (originalHref === "/books" && hasStaffAccess) {
    return pathname.startsWith("/staff/books") || pathname.startsWith("/admin/books") || pathname.startsWith("/books");
  }

  if (originalHref === "/user/holds") {
    return pathname.startsWith("/user/holds");
  }

  return pathname === resolvedHref || pathname.startsWith(`${resolvedHref}/`);
}

function UserMenu({
  currentUser,
  hasAdminAccess,
  hasStaffAccess,
  onLogout,
}: {
  currentUser: { fullName?: string; role?: string } | null;
  hasAdminAccess: boolean;
  hasStaffAccess: boolean;
  onLogout: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={t("menu.openUserMenu")}
        className="grid h-9 w-9 place-items-center rounded-full text-[#111827] transition-colors duration-150 hover:bg-[#F1F2F4] hover:text-black focus:outline-none focus:ring-4 focus:ring-black/10"
      >
        <UsersRound animateOnHover size={18} aria-hidden="true" />
      </button>

      <div className="invisible absolute right-0 top-[calc(100%+12px)] w-64 translate-y-2 rounded-2xl border border-[#EDEDF2] bg-white p-2 opacity-0 shadow-[0_24px_60px_rgba(7,7,88,0.16)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-wide text-black/70">{t("menu.account")}</p>
          <p className="mt-1 text-sm font-bold text-black">{currentUser?.fullName || t("menu.memberFallback")}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#333333]/70">{currentUser?.role || "Member"}</p>
        </div>
        <Link
          href="/profile"
          className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#111827] transition hover:bg-black hover:text-white"
        >
          {t("menu.myProfile")}
          <span aria-hidden="true">&gt;</span>
        </Link>
        {!hasStaffAccess ? (
          <Link
            href="/user/loans"
            className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#111827] transition hover:bg-black hover:text-white"
          >
            {t("menu.myLoans")}
            <span aria-hidden="true">&gt;</span>
          </Link>
        ) : null}
        {!hasStaffAccess ? (
          <Link
            href="/user/ebook-loans"
            className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#111827] transition hover:bg-black/[0.06] hover:text-black"
          >
            My ebooks
            <span aria-hidden="true">&gt;</span>
          </Link>
        ) : null}
        {!hasStaffAccess ? (
          <Link
            href="/user/fines"
            className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#111827] transition hover:bg-black hover:text-white"
          >
            {t("menu.myFines")}
            <span aria-hidden="true">&gt;</span>
          </Link>
        ) : null}
        {!hasStaffAccess ? (
          <Link
            href="/user/holds"
            className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#111827] transition hover:bg-black hover:text-white"
          >
            {t("menu.myHolds")}
            <span aria-hidden="true">&gt;</span>
          </Link>
        ) : null}
        {!hasStaffAccess ? (
          <Link
            href="/user/receipts"
            className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#111827] transition hover:bg-black hover:text-white"
          >
            My receipts
            <span aria-hidden="true">&gt;</span>
          </Link>
        ) : null}
        {hasStaffAccess ? (
          <>
            <div className="my-2 h-px bg-[#EDEDF2]" />
            <Link
              href="/staff/circulation"
              className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#111827] transition hover:bg-black hover:text-white"
            >
              {t("nav.circulation")}
              <span aria-hidden="true">&gt;</span>
            </Link>
            <Link
              href="/staff/loans"
              className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#111827] transition hover:bg-black hover:text-white"
            >
              {t("menu.activeLoans")}
              <span aria-hidden="true">&gt;</span>
            </Link>
            <Link
              href="/staff/holds"
              className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#111827] transition hover:bg-black hover:text-white"
            >
              {t("menu.holds")}
              <span aria-hidden="true">&gt;</span>
            </Link>
            <Link
              href="/staff/books/import"
              className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#111827] transition hover:bg-black hover:text-white"
            >
              {t("menu.importCsv")}
              <span aria-hidden="true">&gt;</span>
            </Link>
          </>
        ) : null}
        {hasAdminAccess ? (
          <>
            <div className="my-2 h-px bg-[#EDEDF2]" />
            <Link
              href="/admin/dashboard"
              className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-[#E60028] transition hover:bg-[#E60028] hover:text-white"
            >
              {t("menu.adminDashboard")}
              <span aria-hidden="true">&gt;</span>
            </Link>
            <Link
              href="/admin/books"
              className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-[#E60028] transition hover:bg-[#E60028] hover:text-white"
            >
              {t("menu.adminBooks")}
              <span aria-hidden="true">&gt;</span>
            </Link>
            <Link
              href="/admin/categories"
              className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-[#E60028] transition hover:bg-[#E60028] hover:text-white"
            >
              {t("menu.categories")}
              <span aria-hidden="true">&gt;</span>
            </Link>
            <Link
              href="/admin/payments"
              className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-[#E60028] transition hover:bg-[#E60028] hover:text-white"
            >
              Payment dashboard
              <span aria-hidden="true">&gt;</span>
            </Link>
            <Link
              href="/admin/statistics/borrows"
              className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-[#E60028] transition hover:bg-[#E60028] hover:text-white"
            >
              {t("menu.borrowStatistics")}
              <span aria-hidden="true">&gt;</span>
            </Link>
          </>
        ) : null}
        <button
          type="button"
          className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold text-[#E60028] transition hover:bg-[#E60028] hover:text-white"
          onClick={onLogout}
        >
          {t("menu.logout")}
          <span aria-hidden="true">&gt;</span>
        </button>
      </div>
    </div>
  );
}
