"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { editorialSerif } from "./editorialFont";

const footerCopy = {
  en: {
    title: "A home for curious minds.",
    tagline: "Discover a new perspective, revisit a favourite, and make room for your next great read.",
    browse: "Find your next book",
    copyright: "© 2026 The Athenaeum.",
    closing: "Discover. Borrow. Read.",
    groups: [
      { title: "Explore", links: [
        { label: "Book catalogue", href: "/books" },
        { label: "Borrowing guide", href: "/borrowing-guide" },
        { label: "About the library", href: "/about" },
      ] },
      { title: "Your library", links: [
        { label: "My profile", href: "/profile" },
        { label: "My borrows", href: "/user/loans" },
        { label: "Reservations", href: "/user/holds" },
        { label: "My ebooks", href: "/user/ebook-loans" },
      ] },
      { title: "Stay connected", links: [
        { label: "Library notices", href: "/notices" },
        { label: "Sign in", href: "/login" },
        { label: "Become a member", href: "/register" },
      ] },
    ],
  },
  vi: {
    title: "Nơi nuôi dưỡng niềm ham học.",
    tagline: "Khám phá góc nhìn mới, tìm lại cuốn sách yêu thích và dành chỗ cho những trang sách tiếp theo.",
    browse: "Tìm cuốn sách tiếp theo",
    copyright: "© 2026 The Athenaeum.",
    closing: "Khám phá. Mượn sách. Đọc.",
    groups: [
      { title: "Khám phá", links: [
        { label: "Danh mục sách", href: "/books" },
        { label: "Hướng dẫn mượn", href: "/borrowing-guide" },
        { label: "Về thư viện", href: "/about" },
      ] },
      { title: "Thư viện của bạn", links: [
        { label: "Hồ sơ cá nhân", href: "/profile" },
        { label: "Sách đang mượn", href: "/user/loans" },
        { label: "Lượt đặt giữ", href: "/user/holds" },
        { label: "Ebook của tôi", href: "/user/ebook-loans" },
      ] },
      { title: "Kết nối", links: [
        { label: "Thông báo thư viện", href: "/notices" },
        { label: "Đăng nhập", href: "/login" },
        { label: "Đăng ký thành viên", href: "/register" },
      ] },
    ],
  },
};

export function Footer() {
  const { locale } = useLanguage();
  const copy = footerCopy[locale];

  return (
    <footer className="border-t-2 border-[#B8872B]/70 bg-[#26231F] px-4 text-[#F7F3EA] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 py-12 sm:py-14 lg:grid-cols-[1.15fr_1.8fr] lg:gap-20">
          <div>
            <Link href="/" className="inline-flex min-h-11 items-center transition-colors hover:text-[#E1C38B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B]">
              <span className={`${editorialSerif.className} text-2xl font-medium`}>The Athenaeum<span aria-hidden="true" className="ml-1 text-[#C6A367]">.</span></span>
            </Link>
            <p className={`${editorialSerif.className} mt-4 max-w-sm text-2xl leading-snug text-[#E8DDCD]`}>{copy.title}</p>
            <p className="mt-3 max-w-sm text-[13px] leading-6 text-[#C3B7A6]">{copy.tagline}</p>
            <Link href="/books" className="mt-5 inline-flex min-h-11 items-center gap-3 text-sm text-[#E1C38B] underline decoration-[#C6A367]/50 underline-offset-4 transition-colors hover:text-[#FFFCF5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B]">
              {copy.browse}<ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
            {copy.groups.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E1C38B]">{group.title}</h2>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="group inline-flex min-h-11 items-center gap-2 py-2 text-[13px] leading-5 text-[#D4C8B7] transition-colors hover:text-[#FFFCF5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1C38B]">
                        {link.label}<ArrowUpRight size={13} aria-hidden="true" className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-[#C3B7A6]/20 py-6 text-xs leading-5 text-[#C3B7A6] sm:flex-row">
          <p>{copy.copyright}</p>
          <p>{copy.closing}</p>
        </div>
      </div>
    </footer>
  );
}
