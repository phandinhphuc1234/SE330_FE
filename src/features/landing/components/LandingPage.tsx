"use client";

import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { editorialSerif } from "@/components/layout/editorialFont";
import { ArrowRight, BookOpenCheck, Bookmark, Clock3, Leaf } from "lucide-react";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { FeaturedBooksSection } from "./FeaturedBooksSection";
import { HeroSearchSection } from "./HeroSearchSection";
import { LibraryServicesSection } from "./LibraryServicesSection";
import { NoticesSection } from "./NoticesSection";

const borrowingCopy = {
  eyebrow: ["Library services", "Dịch vụ thư viện"],
  title: ["With you through every chapter", "Cùng bạn trên từng trang sách"],
  learnMore: ["Learn more", "Tìm hiểu thêm"],
  cards: [
    {
      title: ["Borrow Books", "Mượn sách"],
      description: [
        "Check availability and borrow available copies from the catalogue.",
        "Kiểm tra tình trạng và mượn các bản sao đang có trong thư viện.",
      ],
    },
    {
      title: ["Reserve Unavailable Books", "Đặt giữ sách chưa có sẵn"],
      description: [
        "Join the reservation queue and receive pickup notifications.",
        "Tham gia hàng đợi đặt giữ và nhận thông báo khi có thể đến lấy.",
      ],
    },
    {
      title: ["Track Due Dates", "Theo dõi hạn trả"],
      description: [
        "Follow return deadlines before overdue fines are applied.",
        "Nắm rõ hạn trả trước khi phát sinh phí quá hạn.",
      ],
    },
  ],
} as const;

const borrowingIcons = [BookOpenCheck, Bookmark, Clock3];

export function LandingPage() {
  const { locale } = useLanguage();
  const localeIndex = locale === "en" ? 0 : 1;

  return (
    <div className="h-dvh snap-y snap-proximity scroll-pt-[9.2rem] overflow-y-auto overscroll-y-contain bg-[#F7F3EA] text-[#2B2723] sm:scroll-pt-[7.05rem] lg:snap-mandatory xl:scroll-pt-[4.3rem]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <HeroSearchSection />
        <LibraryServicesSection />
        <FeaturedBooksSection />
        <section aria-labelledby="borrowing-title" className="relative isolate flex min-h-[calc(100svh-9.2rem)] snap-start items-center overflow-hidden border-b border-[#DED5C8] bg-[#FBF7F0] px-4 py-12 sm:min-h-[calc(100svh-7.05rem)] sm:px-6 sm:py-14 lg:snap-always lg:px-8 xl:min-h-[calc(100svh-4.3rem)] xl:py-16">
          <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_12%,rgba(238,222,209,0.72),transparent_34%),radial-gradient(circle_at_86%_76%,rgba(244,228,220,0.66),transparent_31%),linear-gradient(145deg,#FBF7F0_0%,#FFFCF7_48%,#F7EFE7_100%)]" />
          <div aria-hidden="true" className="absolute -left-[18rem] -top-[15rem] -z-10 h-[40rem] w-[40rem] rounded-full bg-[#EAD9CA]/35" />
          <div aria-hidden="true" className="absolute -left-[11rem] -top-[10rem] -z-10 h-[33rem] w-[33rem] rounded-full border border-[#DCC3B4]/35" />
          <div aria-hidden="true" className="absolute -right-24 top-10 -z-10 text-[#B98D77]/15 sm:right-4">
            <Leaf size={210} strokeWidth={0.8} />
          </div>

          <div className="mx-auto w-full max-w-[96rem]">
            <header className="mx-auto max-w-6xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D2742] sm:text-sm">
                {borrowingCopy.eyebrow[localeIndex]}
              </p>
              <span aria-hidden="true" className="mx-auto mt-5 block h-px w-16 bg-[#B98691]/70" />
              <h2 id="borrowing-title" className={`${editorialSerif.className} mt-5 text-4xl font-medium leading-[1.05] tracking-[-0.035em] text-[#211D1A] sm:text-5xl lg:text-6xl xl:text-7xl`}>
                {borrowingCopy.title[localeIndex]}
              </h2>
            </header>

            <div className="mt-10 grid gap-5 md:grid-cols-3 lg:mt-14 xl:gap-7">
              {borrowingCopy.cards.map((card, index) => {
                const BorrowingIcon = borrowingIcons[index];
                return (
                  <article key={card.title[0]} className="group relative flex min-h-[22rem] flex-col overflow-hidden rounded-[24px] border border-[#E1D5C9] bg-[#FFFCF7]/88 p-7 shadow-[0_18px_45px_rgba(82,61,47,0.08)] backdrop-blur-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#CFAFB0] hover:shadow-[0_24px_55px_rgba(82,61,47,0.13)] sm:p-8 xl:min-h-[25rem] xl:p-10">
                    <div aria-hidden="true" className="absolute -bottom-28 -right-24 h-64 w-64 rounded-full bg-[#EEDFD8]/55" />
                    <BorrowingIcon aria-hidden="true" size={152} strokeWidth={0.75} className="absolute -bottom-8 -right-6 text-[#9F6A70]/[0.08]" />
                    <span className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-[#F5E7E8] text-[#82213D] transition-colors group-hover:bg-[#8D2742] group-hover:text-white">
                      <BorrowingIcon size={28} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <div className="relative z-10 mt-7">
                      <h3 className={`${editorialSerif.className} max-w-sm text-3xl font-medium leading-[1.05] tracking-[-0.025em] text-[#211D1A] xl:text-4xl`}>
                        {card.title[localeIndex]}
                      </h3>
                      <p className="mt-5 max-w-md text-base leading-7 text-[#6F675E] xl:text-lg xl:leading-8">
                        {card.description[localeIndex]}
                      </p>
                    </div>
                    <Link href="/borrowing-guide" className="relative z-10 mt-auto inline-flex min-h-11 items-center gap-3 self-start pt-8 text-base font-semibold text-[#8D2742] transition-colors hover:text-[#5E1529] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8D2742]">
                      {borrowingCopy.learnMore[localeIndex]}
                      <ArrowRight size={19} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
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
