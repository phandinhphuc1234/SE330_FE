"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "en" | "vi";

export type TranslationKey =
  | "nav.books"
  | "nav.borrowingGuide"
  | "nav.reservations"
  | "nav.libraryNotices"
  | "nav.about"
  | "nav.dashboard"
  | "nav.circulation"
  | "nav.borrowers"
  | "nav.login"
  | "nav.register"
  | "menu.openUserMenu"
  | "menu.account"
  | "menu.memberFallback"
  | "menu.myProfile"
  | "menu.myLoans"
  | "menu.myHolds"
  | "menu.activeLoans"
  | "menu.holds"
  | "menu.importCsv"
  | "menu.adminDashboard"
  | "menu.adminBooks"
  | "menu.categories"
  | "menu.borrowStatistics"
  | "menu.logout"
  | "language.switchToEnglish"
  | "language.switchToVietnamese";

type LanguageContextValue = {
  locale: Locale;
  nextLocale: Locale;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
};

const LANGUAGE_STORAGE_KEY = "athenaeumLocale";

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    "nav.books": "Books",
    "nav.borrowingGuide": "Borrowing Guide",
    "nav.reservations": "Reservations",
    "nav.libraryNotices": "Library Notices",
    "nav.about": "About",
    "nav.dashboard": "Dashboard",
    "nav.circulation": "Circulation",
    "nav.borrowers": "Borrowers",
    "nav.login": "Login",
    "nav.register": "Register",
    "menu.openUserMenu": "Open user menu",
    "menu.account": "Account",
    "menu.memberFallback": "The Athenaeum member",
    "menu.myProfile": "My profile",
    "menu.myLoans": "My borrows",
    "menu.myFines": "My fines",
    "menu.myHolds": "My holds",
    "menu.activeLoans": "Active loans",
    "menu.holds": "Holds",
    "menu.importCsv": "Import CSV",
    "menu.adminDashboard": "Admin dashboard",
    "menu.adminBooks": "Admin books",
    "menu.categories": "Categories",
    "menu.borrowStatistics": "Borrow statistics",
    "menu.logout": "Logout",
    "language.switchToEnglish": "Switch to English",
    "language.switchToVietnamese": "Switch to Vietnamese",
  },
  vi: {
    "nav.books": "Sách",
    "nav.borrowingGuide": "Hướng dẫn mượn",
    "nav.reservations": "Đặt giữ",
    "nav.libraryNotices": "Thông báo",
    "nav.about": "Giới thiệu",
    "nav.dashboard": "Bảng điều khiển",
    "nav.circulation": "Lưu thông",
    "nav.borrowers": "Người mượn",
    "nav.login": "Đăng nhập",
    "nav.register": "Đăng ký",
    "menu.openUserMenu": "Mở menu người dùng",
    "menu.account": "Tài khoản",
    "menu.memberFallback": "Thành viên The Athenaeum",
    "menu.myProfile": "Hồ sơ của tôi",
    "menu.myLoans": "Sách đang mượn",
    "menu.myFines": "Sổ tiền phạt",
    "menu.myHolds": "Lượt đặt giữ",
    "menu.activeLoans": "Khoản mượn đang mở",
    "menu.holds": "Hàng đợi giữ sách",
    "menu.importCsv": "Nhập CSV",
    "menu.adminDashboard": "Dashboard quản trị",
    "menu.adminBooks": "Sách quản trị",
    "menu.categories": "Danh mục",
    "menu.borrowStatistics": "Thống kê mượn/trả",
    "menu.logout": "Đăng xuất",
    "language.switchToEnglish": "Chuyển sang tiếng Anh",
    "language.switchToVietnamese": "Chuyển sang tiếng Việt",
  },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const syncLocale = window.setTimeout(() => {
      const storedLocale = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (storedLocale === "vi" || storedLocale === "en") {
        setLocale(storedLocale);
      }

      setIsMounted(true);
    }, 0);

    return () => window.clearTimeout(syncLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const nextLocale = locale === "en" ? "vi" : "en";

  const toggleLocale = useCallback(() => {
    setLocale((currentLocale) => {
      const next = currentLocale === "en" ? "vi" : "en";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey) => {
      const activeLocale = isMounted ? locale : "en";
      return translations[activeLocale][key];
    },
    [locale, isMounted]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      nextLocale,
      toggleLocale,
      t,
    }),
    [locale, nextLocale, toggleLocale, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
