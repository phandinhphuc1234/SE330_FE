"use client";

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
    <section aria-labelledby="notices-title" className="bg-[#FBF8F1] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.5fr] lg:gap-16">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A263A]">
            <Bell size={14} aria-hidden="true" />{copy.eyebrow}
          </p>
          <h2 id="notices-title" className={`${editorialSerif.className} mt-3 text-3xl font-medium text-[#2B2723] sm:text-4xl`}>{copy.title}</h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[#6F675E]">{copy.description}</p>
          <Link href="/notices" className="mt-5 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-[#7A263A] underline decoration-[#CBBEAE] underline-offset-4 transition-colors hover:text-[#5A1C2B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A263A]">
            {copy.viewAll}<ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="border-y border-[#DED5C8]">
          {copy.notices.map(([title, content], index) => {
            const NoticeIcon = noticeIcons[index];
            return (
              <article key={title} className="flex gap-4 border-b border-[#DED5C8] py-6 last:border-0 sm:gap-5">
                <NoticeIcon size={20} strokeWidth={1.5} aria-hidden="true" className="mt-1 shrink-0 text-[#7A263A]" />
                <div>
                  <h3 className={`${editorialSerif.className} text-xl font-medium text-[#2B2723]`}>{title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#6F675E]">{content}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
