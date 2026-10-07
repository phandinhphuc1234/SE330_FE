"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bell, BookOpen, Bookmark, Wrench } from "lucide-react";
import { editorialSerif } from "@/components/layout/editorialFont";
import { useLanguage } from "@/features/i18n/context/LanguageContext";

const noticesCopy = {
  en: {
    eyebrow: "From the library desk",
    title: "Library Notices",
    description: "Useful updates to keep your library visits running smoothly.",
    viewAll: "All notices",
    notices: [
      ["New books added", "New computer science and finance titles are available this week."],
      ["Reservation pickup", "Reserved books are held for 48 hours after notification."],
      ["System maintenance", "Catalogue services may be briefly unavailable on Sunday morning."],
    ],
  },
  vi: {
    eyebrow: "Góc thông tin thư viện",
    title: "Thông báo thư viện",
    description: "Những cập nhật hữu ích để mỗi lần ghé thư viện đều thuận tiện hơn.",
    viewAll: "Tất cả thông báo",
    notices: [
      ["Sách mới đã được thêm", "Các đầu sách mới về khoa học máy tính và tài chính đã có trong tuần này."],
      ["Nhận sách đã đặt giữ", "Sách đã đặt giữ sẽ được giữ trong 48 giờ sau khi gửi thông báo."],
      ["Bảo trì hệ thống", "Dịch vụ danh mục có thể tạm thời gián đoạn vào sáng Chủ nhật."],
    ],
  },
};

const noticeIcons = [BookOpen, Bookmark, Wrench];

export function NoticesSection() {
  const { locale } = useLanguage();
  const copy = noticesCopy[locale];

  return (
    <section aria-labelledby="notices-title" className="relative isolate flex min-h-[calc(100svh-9.2rem)] snap-start items-center overflow-hidden border-b border-[#DED5C8] bg-[#FBF8F1] px-4 py-10 sm:min-h-[calc(100svh-7.05rem)] sm:px-6 sm:py-12 lg:snap-always lg:px-8 xl:min-h-[calc(100svh-4.3rem)]">
      <Image
        src="/landing/library-notices-background.png"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="-z-20 object-fill"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#FBF8F1]/10" />
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 lg:grid-cols-[0.75fr_1.5fr] lg:items-center lg:gap-16">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7A263A] sm:text-sm">
            <Bell size={16} aria-hidden="true" />{copy.eyebrow}
          </p>
          <h2 id="notices-title" className={`${editorialSerif.className} mt-4 text-4xl font-medium leading-tight text-[#2B2723] sm:text-5xl xl:text-6xl`}>{copy.title}</h2>
          <p className="mt-6 max-w-md text-base leading-8 text-[#6F675E] sm:text-lg">{copy.description}</p>
          <Link href="/notices" className="mt-7 inline-flex min-h-12 items-center gap-3 text-base font-semibold text-[#7A263A] underline decoration-[#CBBEAE] underline-offset-4 transition-colors hover:text-[#5A1C2B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A263A]">
            {copy.viewAll}<ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#DED5C8] bg-[#FFFCF5]/85 px-6 shadow-[0_12px_32px_rgba(43,39,35,0.04)] sm:px-8">
          {copy.notices.map(([title, content], index) => {
            const NoticeIcon = noticeIcons[index];
            return (
              <article key={title} className="flex min-h-28 items-center gap-5 border-b border-[#DED5C8] py-6 last:border-0 sm:gap-6 xl:min-h-32 xl:py-7">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#F3E5E8] text-[#7A263A] xl:h-14 xl:w-14">
                  <NoticeIcon size={24} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className={`${editorialSerif.className} text-xl font-medium text-[#2B2723] xl:text-2xl`}>{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6F675E] xl:text-base">{content}</p>
                </div>
                <Link href="/notices" aria-label={`${copy.viewAll}: ${title}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#DED5C8] text-[#8B775F] transition-colors hover:border-[#7A263A] hover:text-[#7A263A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A263A]">
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
