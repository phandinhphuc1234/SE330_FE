"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { publicNavItems } from "@/constants/nav-items";
import { useAuth } from "@/features/auth/context/AuthContext";
import { TranslationKey, useLanguage } from "@/features/i18n/context/LanguageContext";
import { useNotifications } from "@/features/notifications/context/NotificationContext";
import { BrandMark } from "./BrandMark";
import { AdminNavigation } from "./AdminNavigation";

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
  "/user/ebook-loans": "menu.myEbooks",
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
  const [isPublicMenuOpen, setIsPublicMenuOpen] = useState(false);
  const staffNavItems: TopNavItem[] = [
    { labelKey: "nav.books", href: "/staff/books", originalHref: "/books" },
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
      className="sticky inset-x-0 top-0 z-30 border-b border-[#DED5C8] bg-[#FFFCF5]/95 text-[#2B2723] shadow-[0_8px_24px_rgba(43,39,35,0.08)] backdrop-blur-xl"
    >
      <nav className={`mx-auto min-h-16 w-full max-w-7xl items-center px-4 py-3 sm:px-6 ${hasAdminAccess ? "grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-2 xl:gap-x-4" : "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-5"}`}>
        <BrandMark tone="dark" showSymbol />
        {hasAdminAccess ? (
          <AdminNavigation key={pathname} mobileActions={<LanguageToggle />} />
        ) : (
          <div className="hidden min-w-0 lg:col-start-2 lg:row-start-1 lg:block">
            <div className="flex items-center justify-center gap-0.5">
              {topNavItems.map((item) => {
                const originalHref = item.originalHref ?? item.href;
                const isActive = isActiveNavItem(pathname, originalHref, item.href, hasStaffAccess);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsPublicMenuOpen(false)}
                    className={`group relative flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-xl px-3 py-2 font-semibold text-[#2B2723] transition-colors duration-150 hover:bg-[#F1EADF] hover:text-[#7A263A] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#7A263A] ${
                      isActive ? "bg-[#F1EADF] text-[#7A263A]" : ""
                    }`}
                  >
                    {/* Size the label directly; the global anchor reset inherits font. */}
                    <span className="text-sm leading-5">{t(item.labelKey)}</span>
                    <span
                      className={`absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-[#7A263A] transition-transform duration-200 ${
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        <div className={`ml-auto flex shrink-0 items-center gap-1.5 text-sm ${hasAdminAccess ? "col-start-2 row-start-1 xl:col-start-3" : "col-start-2 row-start-1 lg:col-start-3"}`}>
          <div className={hasAdminAccess ? "hidden xl:block" : "hidden lg:block"}>
            <LanguageToggle />
          </div>
          {isInitializing ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-[#DED5C8]" aria-label="Checking session" />
          ) : isAuthenticated ? (
            <>
              <NotificationMenu compact={hasAdminAccess} />
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
                className="hidden min-h-11 items-center whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-[#2B2723] transition-colors duration-75 hover:bg-[#F1EADF] hover:text-[#7A263A] lg:inline-flex"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="hidden min-h-11 items-center whitespace-nowrap rounded-xl bg-[#7A263A] px-5 py-2 text-sm font-bold text-white shadow-[0_8px_20px_rgba(122,38,58,0.18)] transition-colors duration-150 hover:bg-[#5A1C2B] lg:inline-flex"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
          {!hasAdminAccess ? (
            <button
              type="button"
              aria-label={isPublicMenuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={isPublicMenuOpen}
              aria-controls="public-mobile-navigation"
              onClick={() => setIsPublicMenuOpen((open) => !open)}
              className="grid h-11 w-11 place-items-center rounded-xl border border-[#DED5C8] bg-[#FFFCF5] text-[#2B2723] transition hover:border-[#7A263A] hover:text-[#7A263A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A263A] lg:hidden"
            >
              <Icon name={isPublicMenuOpen ? "x" : "menu"} size={20} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {!hasAdminAccess && isPublicMenuOpen ? (
          <div id="public-mobile-navigation" className="col-span-2 mt-3 border-t border-[#DED5C8] pt-3 lg:hidden">
            <div className="grid gap-1">
              {topNavItems.map((item) => {
                const originalHref = item.originalHref ?? item.href;
                const isActive = isActiveNavItem(pathname, originalHref, item.href, hasStaffAccess);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsPublicMenuOpen(false)}
                    className={`flex min-h-11 items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      isActive ? "bg-[#F1EADF] text-[#7A263A]" : "text-[#2B2723] hover:bg-[#F7F3EA] hover:text-[#7A263A]"
                    }`}
                  >
                    {t(item.labelKey)}
                    <Icon name="chevron-right" size={16} aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#DED5C8] pt-3">
              <LanguageToggle />
              {!isInitializing && !isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link href="/login" onClick={() => setIsPublicMenuOpen(false)} className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-[#2B2723] hover:bg-[#F1EADF] hover:text-[#7A263A]">
                    {t("nav.login")}
                  </Link>
                  <Link href="/register" onClick={() => setIsPublicMenuOpen(false)} className="inline-flex min-h-11 items-center rounded-xl bg-[#7A263A] px-4 text-sm font-bold text-white hover:bg-[#5A1C2B]">
                    {t("nav.register")}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}

function NotificationMenu({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const { clearNotifications, markAllRead, notifications, unreadCount } = useNotifications();
  const hasNotifications = notifications.length > 0;

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={t("notifications.open")}
        title={t("notifications.open")}
        className="relative grid h-9 w-9 place-items-center rounded-full text-[#2B2723] transition-colors duration-150 hover:bg-[#F1F2F4] hover:text-black focus:outline-none focus:ring-4 focus:ring-black/10"
      >
        <Icon name="bell" size={18} aria-hidden="true" />
        {unreadCount ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#A33A3A] px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <div className={`invisible translate-y-2 rounded-2xl border border-[#DED5C8] bg-white p-2 opacity-0 shadow-[0_24px_60px_rgba(23,20,18,0.14)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 ${compact ? "fixed inset-x-4 top-20 w-auto xl:absolute xl:inset-x-auto xl:right-0 xl:top-[calc(100%+12px)] xl:w-80" : "absolute right-0 top-[calc(100%+12px)] w-80"}`}>
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
  currentUser: { email?: string; fullName?: string; role?: string } | null;
  hasAdminAccess: boolean;
  hasStaffAccess: boolean;
  onLogout: () => void;
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = currentUser?.fullName || t("menu.memberFallback");
  const displayRole = currentUser?.role || "Member";
  const displayMeta = currentUser?.email || displayRole;
  const initials = getUserInitials(displayName);
  const menuItemClass =
    "group/item flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#2B2723] transition-colors duration-200 hover:bg-[#EFE6D6] hover:text-[#7A263A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A263A] focus-visible:ring-offset-2";
  const menuItems: Array<{
    href: string;
    icon: Parameters<typeof Icon>[0]["name"];
    labelKey: TranslationKey;
  }> = [
    { href: "/profile", icon: "user", labelKey: "menu.myProfile" },
    ...(hasAdminAccess
      ? [{ href: "/admin/dashboard", icon: "shield" as const, labelKey: "menu.adminCenter" as TranslationKey }]
      : []),
    ...(!hasStaffAccess
      ? [
          { href: "/user/loans", icon: "book", labelKey: "menu.myLoans" },
          { href: "/user/ebook-loans", icon: "book-open", labelKey: "menu.myEbooks" },
          { href: "/user/fines", icon: "banknote", labelKey: "menu.myFines" },
          { href: "/user/holds", icon: "bookmark", labelKey: "menu.myHolds" },
          { href: "/user/receipts", icon: "file-text", labelKey: "menu.myReceipts" },
        ] as Array<{
          href: string;
          icon: Parameters<typeof Icon>[0]["name"];
          labelKey: TranslationKey;
        }>
      : []),
  ];

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={menuRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={t("menu.openUserMenu")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="navbar-user-menu"
        onClick={() => setIsOpen((open) => !open)}
        className="group flex h-12 max-w-[18rem] cursor-pointer items-center rounded-full border border-[#E8DED5] bg-white/85 p-1.5 text-left text-[#171412] shadow-[0_8px_24px_rgba(79,55,45,0.08)] backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-200 hover:border-[#D6C5B8] hover:bg-white hover:shadow-[0_12px_30px_rgba(79,55,45,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A263A] focus-visible:ring-offset-2"
      >
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#A8244B,#7A263A)] text-xs font-bold tracking-wide text-white shadow-[0_5px_14px_rgba(122,38,58,0.24)] md:h-10 md:w-10">
          {initials}
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-[#FFFCF5] bg-[#59A66F] shadow-[0_2px_5px_rgba(49,90,56,0.28)]"
          />
        </span>
        <span className="mx-3 hidden min-w-0 flex-1 md:block">
          <span className="block truncate text-[13px] font-bold leading-4 text-[#211D1A]">{displayName}</span>
          <span className="mt-1 block truncate text-[11px] font-medium leading-3 text-[#766D65]">
            {displayMeta}
          </span>
        </span>
        <span aria-hidden="true" className="hidden h-7 w-px shrink-0 bg-[#E7DDD4] md:block" />
        <span className="hidden h-9 w-10 shrink-0 place-items-center rounded-full text-[#453F39] transition-colors group-hover:bg-[#F5EEE8] group-hover:text-[#7A263A] md:grid">
          <Icon
            name="chevron-down"
            size={17}
            aria-hidden="true"
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div
        id="navbar-user-menu"
        role="menu"
        aria-label={t("menu.account")}
        className={`absolute right-0 z-50 mt-3 w-72 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-[#DED5C8] bg-[#FFFCF5] p-2 shadow-[0_24px_60px_rgba(23,20,18,0.16)] transition-[opacity,transform,visibility] duration-200 ${
          isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="rounded-xl bg-[#F7F3EA] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#171412]">{displayName}</p>
            {currentUser?.email ? (
              <p className="mt-0.5 truncate text-xs font-medium text-[#6F675E]">{currentUser.email}</p>
            ) : null}
            <p className="mt-1 inline-flex rounded-md bg-[#F3E5E8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7A263A]">
              {displayRole}
            </p>
          </div>
        </div>

        <div className="mt-2 max-h-[min(22rem,calc(100vh-12rem))] space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className={menuItemClass}
              onClick={() => setIsOpen(false)}
            >
              <Icon name={item.icon} size={17} aria-hidden="true" className="shrink-0 text-[#7A263A]" />
              <span className="min-w-0 flex-1">{t(item.labelKey)}</span>
              <Icon
                name="chevron-right"
                size={15}
                aria-hidden="true"
                className="shrink-0 text-[#9A9187] transition-transform duration-200 group-hover/item:translate-x-0.5 group-hover/item:text-[#7A263A]"
              />
            </Link>
          ))}
        </div>

        <div className="my-2 h-px bg-[#DED5C8]" />
        <button
          type="button"
          role="menuitem"
          className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#A33A3A] transition-colors duration-200 hover:bg-[#F6E4E1] hover:text-[#7F2D2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A33A3A] focus-visible:ring-offset-2"
          onClick={() => {
            setIsOpen(false);
            onLogout();
          }}
        >
          <Icon name="logout" size={17} aria-hidden="true" className="shrink-0" />
          <span className="flex-1">{t("menu.logout")}</span>
        </button>
      </div>
    </div>
  );
}

function getUserInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "A";
}
