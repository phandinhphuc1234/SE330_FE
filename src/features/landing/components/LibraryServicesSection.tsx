"use client";

import Link from "next/link";
import { ArrowUpRight, Bell, BookOpen, Bookmark, LibraryBig, Search, UserRound } from "lucide-react";
import { editorialSerif } from "@/components/layout/editorialFont";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLanguage } from "@/features/i18n/context/LanguageContext";

const servicesCopy = {
  en: {
    eyebrow: "Your library, within reach",
    title: "Library Services",
    description: "A little guidance for every chapter of your reading journey.",
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
    <section aria-labelledby="services-title" className="bg-[#F7F3EA] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 border-b border-[#DED5C8] pb-7 md:flex-row md:items-end md:gap-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A263A]">{copy.eyebrow}</p>
            <h2 id="services-title" className={`${editorialSerif.className} mt-3 text-3xl font-medium text-[#2B2723] sm:text-4xl`}>{copy.title}</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#6F675E]">{copy.description}</p>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {copy.services.map(([number, title, description], index) => {
            const ServiceIcon = serviceIcons[index];
            return (
              <Link key={number} href={destinations[index]} className="group relative flex min-w-0 gap-4 rounded-xl border border-[#DED5C8] bg-[#FFFCF5] p-5 transition-[border-color,background-color,box-shadow] duration-200 hover:border-[#BDA88F] hover:bg-white hover:shadow-[0_6px_20px_rgba(43,39,35,0.05)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A263A] lg:p-6">
                <span className="flex shrink-0 flex-col items-center gap-4 pt-0.5">
                  <ServiceIcon aria-hidden="true" size={23} strokeWidth={1.5} className="text-[#7A263A]" />
                  <span aria-hidden="true" className={`${editorialSerif.className} text-sm text-[#8B775F]`}>{number}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={`${editorialSerif.className} text-xl font-medium leading-7 text-[#2B2723] transition-colors group-hover:text-[#7A263A]`}>{title}</h3>
                    <ArrowUpRight aria-hidden="true" size={16} className="mt-1.5 shrink-0 text-[#9A8670] transition-colors group-hover:text-[#7A263A]" />
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-[#6F675E]">{description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
