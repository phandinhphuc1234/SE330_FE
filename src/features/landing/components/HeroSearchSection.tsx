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
    note: "Khám phá. Mượn sách. Đọc.",
  },
};

export function HeroSearchSection() {
  const { hasAdminAccess, hasStaffAccess } = useAuth();
  const { locale } = useLanguage();
  const copy = heroCopy[locale];
  const searchTarget = hasAdminAccess ? "/admin/books" : hasStaffAccess ? "/staff/books" : "/books";

  return (
    <section aria-labelledby="home-title" className="relative isolate flex min-h-[calc(100svh-9.2rem)] snap-start items-center overflow-hidden bg-[#27231F] px-4 py-10 text-[#FFFCF5] sm:min-h-[calc(100svh-7.05rem)] sm:px-6 sm:py-12 lg:snap-always lg:px-8 lg:py-14 xl:min-h-[calc(100svh-4.3rem)]">
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[url('/image.png')] bg-cover bg-[center_42%] [filter:sepia(.55)_saturate(.9)_brightness(.88)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(29,20,16,0.92)_0%,rgba(50,31,21,0.7)_58%,rgba(73,43,24,0.38)_100%)]" />
      <div className="mx-auto flex w-full max-w-[90rem] items-center">
        <div className="w-full max-w-5xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#E1C38B] sm:text-sm">
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-[#C6A367]" />
            {copy.eyebrow}
          </p>
          <h1 id="home-title" className={`${editorialSerif.className} mt-6 text-5xl font-medium leading-[1.08] sm:text-6xl lg:text-7xl 2xl:text-[5.5rem]`}>
            {copy.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#E8E0D4] sm:text-xl sm:leading-9">{copy.subtitle}</p>

          <form action={searchTarget} method="get" role="search" className="mt-7 flex max-w-4xl flex-col gap-2 rounded-2xl border border-[#E5DCD0] bg-[#FFFCF5] p-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.15)] sm:mt-8 sm:flex-row">
            <label className="sr-only" htmlFor="library-search">{copy.searchLabel}</label>
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 text-[#7A263A] focus-within:ring-2 focus-within:ring-[#7A263A]">
              <Search size={22} strokeWidth={1.7} aria-hidden="true" className="shrink-0" />
              <input
                id="library-search"
                name="q"
                className="min-h-14 w-full min-w-0 bg-transparent text-base text-[#171412] outline-none placeholder:text-[#6F675E]"
                placeholder={copy.placeholder}
                type="search"
              />
            </div>
            <button type="submit" className="inline-flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-xl bg-[#7A263A] px-8 text-base font-semibold text-white transition-colors duration-200 hover:bg-[#5A1C2B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A263A]">
              {copy.button}<ArrowRight size={19} aria-hidden="true" />
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-[#D4C8B7]">{copy.popularLabel}:</span>
            {copy.popularSearches.map((term) => (
              <Link key={term} href={`${searchTarget}?q=${encodeURIComponent(term)}`} className="inline-flex min-h-10 items-center rounded-full border border-[#F7F3EA]/25 px-4 text-[#FFFCF5] transition-colors hover:border-[#E1C38B] hover:text-[#E1C38B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E1C38B]">
                {term}
              </Link>
            ))}
          </div>
          <p className="mt-5 border-l border-[#E1C38B] pl-4 text-sm text-[#D4C8B7]">{copy.note}</p>
        </div>

      </div>
    </section>
  );
}
