"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UsersRound } from "@/components/animate-ui/icons/users-round";
import { Icon } from "@/components/ui/Icon";
import { publicNavItems } from "@/constants/nav-items";
import { useAuth } from "@/features/auth/context/AuthContext";
import { TranslationKey, useLanguage } from "@/features/i18n/context/LanguageContext";
import { useNotifications } from "@/features/notifications/context/NotificationContext";
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
            <>
              <NotificationMenu />
              <UserMenu
                currentUser={currentUser}
                hasAdminAccess={hasAdminAccess}
                hasStaffAccess={hasStaffAccess}
                onLogout={() => logout()}
              />
            </>
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

function NotificationMenu() {
  const { t } = useLanguage();
  const { clearNotifications, markAllRead, notifications, unreadCount } = useNotifications();
  const hasNotifications = notifications.length > 0;

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={t("notifications.open")}
        title={t("notifications.open")}
        className="relative grid h-9 w-9 place-items-center rounded-full text-[#111827] transition-colors duration-150 hover:bg-[#F1F2F4] hover:text-black focus:outline-none focus:ring-4 focus:ring-black/10"
      >
        <Icon name="bell" size={18} aria-hidden="true" />
        {unreadCount ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#A33A3A] px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <div className="invisible absolute right-0 top-[calc(100%+12px)] w-80 translate-y-2 rounded-2xl border border-[#DED5C8] bg-white p-2 opacity-0 shadow-[0_24px_60px_rgba(23,20,18,0.14)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="px-3 pb-3 pt-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#6F675E]">{t("notifications.title")}</p>
              <p className="mt-1 text-sm font-bold text-[#171412]">
                {hasNotifications ? t("notifications.latestTitle") : t("notifications.emptyTitle")}
              </p>
            </div>
            {unreadCount ? (
              <span className="rounded-full bg-[#F3E5E8] px-2 py-1 text-xs font-bold text-[#7A263A]">
                {unreadCount}
              </span>
            ) : null}
          </div>
          {!hasNotifications ? (
            <p className="mt-1 text-xs font-semibold leading-5 text-[#6F675E]">{t("notifications.emptyBody")}</p>
          ) : null}
        </div>
        {hasNotifications ? (
          <div className="max-h-80 overflow-y-auto">
            {notifications.slice(0, 5).map((notification) => {
              const content = (
                <div className={`rounded-lg px-3 py-2.5 ${notification.read ? "bg-white" : "bg-[#F3E5E8]"}`}>
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${getNotificationDotClass(notification.tone)}`} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#171412]">{notification.title}</p>
                      {notification.body ? (
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#6F675E]">{notification.body}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#9A9187]">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );

              return notification.href ? (
                <Link key={notification.id} href={notification.href} className="block rounded-lg transition hover:bg-[#EFE6D6]">
                  {content}
                </Link>
              ) : (
                <div key={notification.id}>{content}</div>
              );
            })}
          </div>
        ) : null}
        <div className="mb-1 h-px bg-[#DED5C8]" />
        {hasNotifications ? (
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={markAllRead}
              className="h-10 rounded-lg px-3 text-left text-xs font-bold text-[#243B53] transition hover:bg-[#E7EEF4] focus:outline-none focus:ring-2 focus:ring-[#7A263A] focus:ring-offset-2"
            >
              {t("notifications.markAllRead")}
            </button>
            <button
              type="button"
              onClick={clearNotifications}
              className="h-10 rounded-lg px-3 text-left text-xs font-bold text-[#A33A3A] transition hover:bg-[#F6E4E1] focus:outline-none focus:ring-2 focus:ring-[#A33A3A] focus:ring-offset-2"
            >
              {t("notifications.clear")}
            </button>
          </div>
        ) : null}
        <Link
          href="/notices"
          className="flex h-11 items-center justify-between rounded-lg px-3 text-sm font-semibold text-[#2B2723] transition hover:bg-[#EFE6D6] hover:text-[#7A263A] focus:outline-none focus:ring-2 focus:ring-[#7A263A] focus:ring-offset-2"
        >
          {t("notifications.viewNotices")}
          <span className="text-sm leading-none text-[#9A9187]" aria-hidden="true">&gt;</span>
        </Link>
      </div>
    </div>
  );
}

function getNotificationDotClass(tone?: "info" | "success" | "error") {
  if (tone === "success") return "bg-[#2F5D50]";
  if (tone === "error") return "bg-[#A33A3A]";
  return "bg-[#243B53]";
}

function formatNotificationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  const menuItemClass =
    "flex h-11 items-center justify-between rounded-lg px-3 text-sm font-semibold text-[#2B2723] transition hover:bg-[#EFE6D6] hover:text-[#7A263A] focus:outline-none focus:ring-2 focus:ring-[#7A263A] focus:ring-offset-2";
  const arrowClass = "text-sm leading-none text-[#9A9187]";

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={t("menu.openUserMenu")}
        className="grid h-9 w-9 place-items-center rounded-full text-[#111827] transition-colors duration-150 hover:bg-[#F1F2F4] hover:text-black focus:outline-none focus:ring-4 focus:ring-black/10"
      >
        <UsersRound animateOnHover size={18} aria-hidden="true" />
      </button>

      <div className="invisible absolute right-0 top-[calc(100%+12px)] w-64 translate-y-2 rounded-2xl border border-[#DED5C8] bg-white p-2 opacity-0 shadow-[0_24px_60px_rgba(23,20,18,0.14)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="px-3 pb-3 pt-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6F675E]">{t("menu.account")}</p>
          <p className="mt-1 truncate text-sm font-bold text-[#171412]">{currentUser?.fullName || t("menu.memberFallback")}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#7A263A]">{currentUser?.role || "Member"}</p>
        </div>
        <div className="mb-1 h-px bg-[#DED5C8]" />
        <Link
          href="/profile"
          className={menuItemClass}
        >
          {t("menu.myProfile")}
          <span className={arrowClass} aria-hidden="true">&gt;</span>
        </Link>
        {hasAdminAccess ? (
          <Link
            href="/admin/dashboard"
            className={menuItemClass}
          >
            {t("menu.adminCenter")}
            <span className={arrowClass} aria-hidden="true">&gt;</span>
          </Link>
        ) : null}
        {!hasStaffAccess ? (
          <Link
            href="/user/loans"
            className={menuItemClass}
          >
            {t("menu.myLoans")}
            <span className={arrowClass} aria-hidden="true">&gt;</span>
          </Link>
        ) : null}
        {!hasStaffAccess ? (
          <Link
            href="/user/ebook-loans"
            className={menuItemClass}
          >
            {t("menu.myEbooks")}
            <span className={arrowClass} aria-hidden="true">&gt;</span>
          </Link>
        ) : null}
        {!hasStaffAccess ? (
          <Link
            href="/user/fines"
            className={menuItemClass}
          >
            {t("menu.myFines")}
            <span className={arrowClass} aria-hidden="true">&gt;</span>
          </Link>
        ) : null}
        {!hasStaffAccess ? (
          <Link
            href="/user/holds"
            className={menuItemClass}
          >
            {t("menu.myHolds")}
            <span className={arrowClass} aria-hidden="true">&gt;</span>
          </Link>
        ) : null}
        {!hasStaffAccess ? (
          <Link
            href="/user/receipts"
            className={menuItemClass}
          >
            {t("menu.myReceipts")}
            <span className={arrowClass} aria-hidden="true">&gt;</span>
          </Link>
        ) : null}
        <div className="my-1 h-px bg-[#DED5C8]" />
        <button
          type="button"
          className="flex h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-bold text-[#A33A3A] transition hover:bg-[#F6E4E1] hover:text-[#7F2D2D] focus:outline-none focus:ring-2 focus:ring-[#A33A3A] focus:ring-offset-2"
          onClick={onLogout}
        >
          {t("menu.logout")}
          <span className="text-sm leading-none text-[#A33A3A]" aria-hidden="true">&gt;</span>
        </button>
      </div>
    </div>
  );
}
