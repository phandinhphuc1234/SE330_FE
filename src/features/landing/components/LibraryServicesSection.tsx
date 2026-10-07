"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bell, BookOpen, Bookmark, LibraryBig, Search, UserRound } from "lucide-react";
import { editorialSerif } from "@/components/layout/editorialFont";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLanguage } from "@/features/i18n/context/LanguageContext";

const servicesCopy = {
  en: {
    eyebrow: "Your library, within reach",
    title: "Library Services",
    description: "A little guidance for every chapter of your reading journey.",
    learnMore: "Learn more",
    services: [
      ["01", "Find Books", "Search across titles, authors, categories and ISBNs."],
      ["02", "Borrowing Guide", "Learn loan limits, due dates and return rules."],
      ["03", "Reserve a Book", "Join the queue when a book is currently unavailable."],
      ["04", "My Library Account", "Track loans, reservations, notifications and fines."],
      ["05", "For Librarians", "Manage books, copies, members and borrowing records."],
      ["06", "Library Notices", "Stay updated with reminders and important announcements."],
    ],
  },
  vi: {
    eyebrow: "Thư viện trong tầm tay",
    title: "Dịch vụ thư viện",
    description: "Đồng hành cùng bạn trên từng chặng đường khám phá tri thức.",
    learnMore: "Tìm hiểu thêm",
    services: [
      ["01", "Tìm sách", "Tìm theo tên sách, tác giả, danh mục và ISBN."],
      ["02", "Hướng dẫn mượn", "Nắm rõ giới hạn mượn, hạn trả và quy định hoàn trả."],
      ["03", "Đặt giữ sách", "Tham gia hàng đợi khi sách hiện chưa có sẵn."],
      ["04", "Tài khoản thư viện", "Theo dõi sách mượn, đặt giữ, thông báo và phí phạt."],
      ["05", "Dành cho thủ thư", "Quản lý sách, bản sao, thành viên và hồ sơ mượn trả."],
      ["06", "Thông báo thư viện", "Cập nhật nhắc nhở và các thông báo quan trọng."],
    ],
  },
};

const serviceIcons = [Search, BookOpen, Bookmark, UserRound, LibraryBig, Bell];

export function LibraryServicesSection() {
  const { locale } = useLanguage();
  const { hasAdminAccess, hasStaffAccess } = useAuth();
  const copy = servicesCopy[locale];
  const destinations = [
    hasAdminAccess ? "/admin/books" : hasStaffAccess ? "/staff/books" : "/books",
    "/borrowing-guide",
    hasStaffAccess ? "/staff/holds" : "/user/holds",
    "/profile",
    hasAdminAccess ? "/admin/dashboard" : "/staff/circulation",
    "/notices",
  ];

  return (
    <section aria-labelledby="services-title" className="relative isolate flex min-h-[calc(100svh-9.2rem)] snap-start items-center overflow-hidden border-b border-[#DED5C8] bg-[#F7F3EA] px-4 py-10 sm:min-h-[calc(100svh-7.05rem)] sm:px-6 sm:py-12 lg:snap-always lg:px-8 xl:min-h-[calc(100svh-4.3rem)]">
      <Image
        src="/landing/library-services-background.png"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="-z-20 object-fill"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#F7F3EA]/10" />
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-center lg:gap-14 xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A263A] sm:text-sm">{copy.eyebrow}</p>
          <h2 id="services-title" className={`${editorialSerif.className} mt-4 text-4xl font-medium leading-tight text-[#2B2723] sm:text-5xl xl:text-6xl`}>{copy.title}</h2>
          <p className="mt-6 max-w-md text-base leading-8 text-[#6F675E] sm:text-lg">{copy.description}</p>
          <Link href="/about" className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-lg bg-[#7A263A] px-6 text-base font-semibold text-white transition-colors hover:bg-[#5A1C2B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A263A]">
            {copy.learnMore}<ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          {copy.services.map(([number, title, description], index) => {
            const ServiceIcon = serviceIcons[index];
            return (
              <Link key={number} href={destinations[index]} className="group relative flex min-h-40 min-w-0 items-start gap-5 rounded-xl border border-[#DED5C8] bg-[#FFFCF5]/90 p-5 transition-[border-color,background-color,box-shadow] duration-200 hover:border-[#BDA88F] hover:bg-white hover:shadow-[0_8px_22px_rgba(43,39,35,0.06)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A263A] xl:min-h-44 xl:p-6">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#F3E5E8] text-[#7A263A] xl:h-14 xl:w-14">
                  <ServiceIcon aria-hidden="true" size={24} strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={`${editorialSerif.className} text-xl font-medium leading-7 text-[#2B2723] transition-colors group-hover:text-[#7A263A] xl:text-2xl`}>{title}</h3>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#DED5C8] text-[#9A8670] transition-colors group-hover:border-[#7A263A] group-hover:text-[#7A263A]">
                      <ArrowRight aria-hidden="true" size={16} />
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#6F675E]">{description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
