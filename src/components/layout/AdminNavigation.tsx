"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Book, BookOpen, Bookmark, ChevronDown, CreditCard, Home, Menu, TrendingUp, Upload, User, Users, X, type LucideIcon } from "lucide-react";
import { type TranslationKey, useLanguage } from "@/features/i18n/context/LanguageContext";

type AdminNavItem = {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  matchPaths?: string[];
};

const primaryItems: AdminNavItem[] = [
  { href: "/admin/dashboard", labelKey: "nav.overview", icon: Home },
  { href: "/admin/books", labelKey: "nav.books", icon: Book, matchPaths: ["/admin/books", "/staff/books", "/books"] },
  { href: "/staff/circulation", labelKey: "nav.borrowReturn", icon: BookOpen, matchPaths: ["/staff/circulation", "/staff/loans", "/staff/holds"] },
  { href: "/staff/members", labelKey: "nav.borrowers", icon: Users },
];

const managementItems: AdminNavItem[] = [
  { href: "/admin/statistics/borrows", labelKey: "menu.borrowStatistics", icon: TrendingUp },
  { href: "/admin/payments", labelKey: "nav.payments", icon: CreditCard },
  { href: "/admin/categories", labelKey: "menu.categories", icon: Bookmark },
  { href: "/staff/authors", labelKey: "nav.authors", icon: User },
  { href: "/staff/books/import", labelKey: "menu.importCsv", icon: Upload, matchPaths: ["/staff/books/import", "/staff/imports"] },
];

function matchesDestination(pathname: string, item: AdminNavItem) {
  return (item.matchPaths ?? [item.href]).some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function AdminNavigation({ mobileActions }: { mobileActions: ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [openPanel, setOpenPanel] = useState<"management" | "mobile" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const managementTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const isManagementActive = managementItems.some((item) => matchesDestination(pathname, item));
  const NavigationToggleIcon = openPanel === "mobile" ? X : Menu;
  const linkClass = "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-[#F2F2F2] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

  useEffect(() => {
    if (!openPanel) return;

    function closeOutside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpenPanel(null);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpenPanel(null);
      const trigger = openPanel === "mobile" ? mobileTriggerRef.current : managementTriggerRef.current;
      trigger?.focus();
    }

    const desktopQuery = window.matchMedia("(min-width: 1280px)");
    function closeOnResize() {
      setOpenPanel(null);
    }

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    desktopQuery.addEventListener("change", closeOnResize);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
      desktopQuery.removeEventListener("change", closeOnResize);
    };
  }, [openPanel]);

  function renderLink(item: AdminNavItem, primary = false) {
    const active = matchesDestination(pathname, item) && (!primary || !isManagementActive);
    const ItemIcon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={() => setOpenPanel(null)}
        className={`${linkClass} ${active ? "bg-black text-white hover:bg-[#262626] hover:text-white" : "text-[#262626]"}`}
      >
        <ItemIcon size={17} aria-hidden="true" className="shrink-0 xl:hidden" />
        <span>{t(item.labelKey)}</span>
      </Link>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative col-start-3 row-start-1 min-w-0 xl:col-start-2"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpenPanel(null);
      }}
    >
      <div role="group" aria-label={t("nav.adminNavigation")} className="hidden items-center justify-center gap-1 xl:flex">
        {primaryItems.map((item) => renderLink(item, true))}
        <div className="relative">
          <button
            ref={managementTriggerRef}
            type="button"
            aria-expanded={openPanel === "management"}
            aria-controls="admin-management-navigation"
            onClick={() => setOpenPanel((current) => current === "management" ? null : "management")}
            className={`${linkClass} ${isManagementActive || openPanel === "management" ? "bg-black text-white hover:bg-[#262626] hover:text-white" : "text-[#262626]"}`}
          >
            <span>{t("nav.management")}</span>
            <ChevronDown size={15} aria-hidden="true" className={openPanel === "management" ? "rotate-180" : ""} />
          </button>
          {openPanel === "management" ? (
            <div
              id="admin-management-navigation"
              role="group"
              aria-label={t("nav.management")}
              className="absolute right-0 top-[calc(100%+12px)] z-50 w-60 space-y-1 rounded-xl border border-[#D4D4D4] bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
            >
              {managementItems.map((item) => renderLink(item))}
            </div>
          ) : null}
        </div>
      </div>

      <button
        ref={mobileTriggerRef}
        type="button"
        aria-label={t("nav.openNavigation")}
        aria-expanded={openPanel === "mobile"}
        aria-controls="admin-mobile-navigation"
        onClick={() => setOpenPanel((current) => current === "mobile" ? null : "mobile")}
        className="grid h-11 w-11 place-items-center rounded-xl border border-[#D4D4D4] text-[#262626] transition-colors hover:bg-[#F2F2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 xl:hidden"
      >
        <NavigationToggleIcon size={19} aria-hidden="true" />
      </button>
      {openPanel === "mobile" ? (
        <div
          id="admin-mobile-navigation"
          role="group"
          aria-label={t("nav.adminNavigation")}
          className="absolute right-0 top-[calc(100%+12px)] z-50 max-h-[calc(100dvh-6rem)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-[#D4D4D4] bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.12)] xl:hidden"
        >
          <div className="space-y-1">{primaryItems.map((item) => renderLink(item, true))}</div>
          <div className="mb-2 mt-3 border-t border-[#DED5C8] px-3 pt-3 text-xs font-bold uppercase tracking-wide text-[#6F675E]">
            {t("nav.management")}
          </div>
          <div className="space-y-1">{managementItems.map((item) => renderLink(item))}</div>
          <div className="mt-2 border-t border-[#DED5C8] px-1 pt-2">{mobileActions}</div>
        </div>
      ) : null}
    </div>
  );
}
