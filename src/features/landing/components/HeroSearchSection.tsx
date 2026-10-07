"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { editorialSerif } from "@/components/layout/editorialFont";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLanguage } from "@/features/i18n/context/LanguageContext";

const heroCopy = {
  en: {
    eyebrow: "A place for curious minds",
    title: "The Athenaeum",
    subtitle: "A modern space for knowledge discovery.",
    searchLabel: "Search library catalogue",
    placeholder: "Title, author or ISBN…",
    button: "Search",
    popularLabel: "Popular searches",
    popularSearches: ["Computer Science", "Database", "Java", "Finance", "English"],
    explore: "Explore the collection",
    note: "Discover. Borrow. Read.",
  },
  vi: {
    eyebrow: "Khơi mở những trang tri thức",
    title: "The Athenaeum",
    subtitle: "Không gian hiện đại cho hành trình khám phá tri thức.",
    searchLabel: "Tìm kiếm trong danh mục thư viện",
    placeholder: "Tên sách, tác giả hoặc ISBN…",
    button: "Tìm kiếm",
    popularLabel: "Tìm kiếm phổ biến",
    popularSearches: ["Khoa học máy tính", "Cơ sở dữ liệu", "Java", "Tài chính", "Tiếng Anh"],
    explore: "Khám phá bộ sưu tập",
    note: "Khám phá. Mượn sách. Đọc.",
  },
};

export function HeroSearchSection() {
  const { hasAdminAccess, hasStaffAccess } = useAuth();
  const { locale } = useLanguage();
  const copy = heroCopy[locale];
  const searchTarget = hasAdminAccess ? "/admin/books" : hasStaffAccess ? "/staff/books" : "/books";

  return (
    <section aria-labelledby="home-title" className="relative isolate overflow-hidden bg-[#27231F] px-4 py-10 text-[#FFFCF5] sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[url('/image.png')] bg-cover bg-[center_42%]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(23,20,18,0.9)_0%,rgba(23,20,18,0.76)_45%,rgba(23,20,18,0.52)_100%)]" />
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-3xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E1C38B] sm:text-xs">
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-[#C6A367]" />
            {copy.eyebrow}
          </p>
          <h1 id="home-title" className={`${editorialSerif.className} mt-5 text-4xl font-medium leading-[1.12] sm:text-6xl lg:text-[4.25rem]`}>
            {copy.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#E8E0D4] sm:text-lg sm:leading-8">{copy.subtitle}</p>

          <form action={searchTarget} method="get" role="search" className="mt-6 flex flex-col gap-2 rounded-xl border border-[#E5DCD0] bg-[#FFFCF5] p-2 shadow-[0_12px_36px_rgba(0,0,0,0.15)] sm:mt-8 sm:flex-row">
            <label className="sr-only" htmlFor="library-search">{copy.searchLabel}</label>
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 text-[#7A263A] focus-within:ring-2 focus-within:ring-[#7A263A]">
              <Search size={20} strokeWidth={1.7} aria-hidden="true" className="shrink-0" />
              <input
                id="library-search"
                name="q"
                className="min-h-12 w-full min-w-0 bg-transparent text-sm text-[#171412] outline-none placeholder:text-[#6F675E]"
                placeholder={copy.placeholder}
                type="search"
              />
            </div>
            <button type="submit" className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-lg bg-[#7A263A] px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#5A1C2B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A263A]">
              {copy.button}<ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="text-[#D4C8B7]">{copy.popularLabel}:</span>
            {copy.popularSearches.map((term) => (
              <Link key={term} href={`${searchTarget}?q=${encodeURIComponent(term)}`} className="inline-flex min-h-11 items-center text-[#FFFCF5] underline decoration-[#BAA98E]/55 underline-offset-4 transition-colors hover:text-[#E1C38B] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B]">
                {term}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-[#F7F3EA]/20 pt-4 text-xs text-[#D4C8B7] sm:mt-7">
          <span className="hidden sm:block">{copy.note}</span>
          <Link href="#new-books" className="inline-flex min-h-11 items-center gap-3 text-[#FFFCF5] transition-colors hover:text-[#E1C38B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B]">
            {copy.explore}<ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
