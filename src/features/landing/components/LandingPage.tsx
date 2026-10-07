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
    <div className="h-dvh snap-y snap-proximity scroll-pt-[9.2rem] overflow-y-auto overscroll-y-contain bg-[#F7F3EA] text-[#2B2723] sm:scroll-pt-[7.05rem] lg:snap-mandatory xl:scroll-pt-[4.3rem]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <HeroSearchSection />
        <LibraryServicesSection />
        <FeaturedBooksSection />
        <section aria-labelledby="borrowing-title" className="flex min-h-[calc(100svh-9.2rem)] snap-start items-center border-b border-[#DED5C8] bg-[#EFE6D6] px-4 py-10 sm:min-h-[calc(100svh-7.05rem)] sm:px-6 sm:py-12 lg:snap-always lg:px-8 xl:min-h-[calc(100svh-4.3rem)]">
          <div className="mx-auto w-full max-w-[90rem]">
            <h2 id="borrowing-title" className={`${editorialSerif.className} mb-10 max-w-3xl text-4xl font-medium leading-tight text-[#2B2723] sm:text-5xl xl:mb-12 xl:text-6xl`}>
              {locale === "vi" ? "Cùng bạn trên từng trang sách" : "With you through every chapter"}
            </h2>
            <div className="grid gap-5 md:grid-cols-3 xl:gap-7">
              {landingCards[locale].map(([title, description], index) => {
                const BorrowingIcon = borrowingIcons[index];
                return (
                  <article key={title} className="flex min-h-52 flex-col gap-6 rounded-2xl border border-[#CBBEAE] bg-[#F7F3EA]/65 p-6 shadow-[0_10px_28px_rgba(43,39,35,0.04)] sm:p-8">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-[#F3E5E8] text-[#7A263A]">
                      <BorrowingIcon size={28} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className={`${editorialSerif.className} text-2xl font-medium leading-8 xl:text-3xl`}>{title}</h3>
                      <p className="mt-4 text-base leading-7 text-[#6F675E]">{description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        <NoticesSection />
      </main>
      <div className="snap-start lg:snap-always">
        <Footer />
      </div>
    </div>
  );
}
