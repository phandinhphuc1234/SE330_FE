"use client";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { editorialSerif } from "@/components/layout/editorialFont";
import { BookOpenCheck, Bookmark, Clock3 } from "lucide-react";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { FeaturedBooksSection } from "./FeaturedBooksSection";
import { HeroSearchSection } from "./HeroSearchSection";
import { LibraryServicesSection } from "./LibraryServicesSection";
import { NoticesSection } from "./NoticesSection";

const landingCards = {
  en: [
    ["Borrow Books", "Check availability and borrow available copies from the catalogue."],
    ["Reserve Unavailable Books", "Join the reservation queue and receive pickup notifications."],
    ["Track Due Dates", "Follow return deadlines before overdue fines are applied."],
  ],
  vi: [
    ["Mượn sách", "Kiểm tra tình trạng và mượn các bản sao đang có trong thư viện."],
    ["Đặt giữ sách chưa có sẵn", "Tham gia hàng đợi đặt giữ và nhận thông báo khi có thể đến lấy."],
    ["Theo dõi hạn trả", "Nắm rõ hạn trả trước khi phát sinh phí quá hạn."],
  ],
};

const borrowingIcons = [BookOpenCheck, Bookmark, Clock3];

export function LandingPage() {
  const { locale } = useLanguage();

  return (
    <div className="min-h-dvh bg-[#F7F3EA] text-[#2B2723]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="min-h-[calc(100dvh-4.5rem)] outline-none">
        <HeroSearchSection />
        <LibraryServicesSection />
        <FeaturedBooksSection />
        <section aria-labelledby="borrowing-title" className="border-b border-[#DED5C8] bg-[#EFE6D6] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 id="borrowing-title" className="mb-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A263A]">
              {locale === "vi" ? "Cùng bạn trên từng trang sách" : "With you through every chapter"}
            </h2>
            <div className="grid gap-7 md:grid-cols-3 md:gap-0">
              {landingCards[locale].map(([title, description], index) => {
                const BorrowingIcon = borrowingIcons[index];
                return (
                  <article key={title} className="flex gap-4 border-[#CBBEAE] max-md:border-b max-md:pb-7 max-md:last:border-0 max-md:last:pb-0 md:border-r md:px-6 md:first:pl-0 md:last:border-0 md:last:pr-0 lg:px-8">
                    <BorrowingIcon size={24} strokeWidth={1.5} aria-hidden="true" className="mt-1 shrink-0 text-[#7A263A]" />
                    <div>
                      <h3 className={`${editorialSerif.className} text-xl font-medium leading-7`}>{title}</h3>
                      <p className="mt-2 text-[13px] leading-6 text-[#6F675E]">{description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        <NoticesSection />
      </main>
      <Footer />
    </div>
  );
}
