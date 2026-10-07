"use client";

import Link from "next/link";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { InstitutionalShell, SectionBand } from "./InstitutionalShell";

const noticesPageCopy = {
  en: {
    eyebrow: "Library notices",
    title: "Current updates from The Athenaeum.",
    description: "Operational notices, service changes, collection highlights, and space updates for members and staff.",
    notices: [
      {
        type: "Service",
        title: "Extended study hours during assessment week",
        date: "May 20, 2026",
        body: "The main reading room will remain open until 10:00 PM with quiet study priority and additional desk support.",
      },
      {
        type: "Catalog",
        title: "New digital systems collection now available",
        date: "May 18, 2026",
        body: "Explore recent titles in distributed systems, databases, software architecture, and information retrieval.",
      },
      {
        type: "Circulation",
        title: "Return reminders and hold pickup notices",
        date: "May 15, 2026",
        body: "Members should check email notifications and the My Holds page for pickup deadlines.",
      },
      {
        type: "Space",
        title: "Quiet zone refresh on Level 2",
        date: "May 12, 2026",
        body: "New task lighting, power access, and seating improvements are being installed in phases.",
      },
    ],
    quickAccess: "Quick access",
    quickTitle: "Act on a notice",
    serviceCards: [
      ["Borrowing", "Current loans, holds, and fines remain available in member tools.", "/user/loans"],
      ["Staff desk", "Librarians can manage checkout, return, and hold pickup workflows.", "/staff/circulation"],
      ["Collections", "Catalog updates continue throughout the semester.", "/books"],
    ],
  },
  vi: {
    eyebrow: "Thông báo thư viện",
    title: "Cập nhật hiện tại từ The Athenaeum.",
    description: "Thông báo vận hành, thay đổi dịch vụ, điểm nổi bật bộ sưu tập và cập nhật không gian cho thành viên và nhân viên.",
    notices: [
      {
        type: "Dịch vụ",
        title: "Mở rộng giờ học trong tuần đánh giá",
        date: "20/05/2026",
        body: "Phòng đọc chính sẽ mở đến 22:00, ưu tiên không gian yên tĩnh và bổ sung hỗ trợ tại quầy.",
      },
      {
        type: "Danh mục",
        title: "Bộ sưu tập hệ thống số mới đã sẵn sàng",
        date: "18/05/2026",
        body: "Khám phá các đầu sách mới về hệ thống phân tán, cơ sở dữ liệu, kiến trúc phần mềm và truy xuất thông tin.",
      },
      {
        type: "Lưu thông",
        title: "Nhắc hạn trả và thông báo nhận sách đặt giữ",
        date: "15/05/2026",
        body: "Thành viên nên kiểm tra email và trang Lượt đặt giữ để nắm thời hạn nhận sách.",
      },
      {
        type: "Không gian",
        title: "Làm mới khu vực yên tĩnh tầng 2",
        date: "12/05/2026",
        body: "Đèn học, nguồn điện và khu vực ngồi mới đang được lắp đặt theo từng giai đoạn.",
      },
    ],
    quickAccess: "Truy cập nhanh",
    quickTitle: "Thao tác theo thông báo",
    serviceCards: [
      ["Mượn sách", "Các khoản mượn, đặt giữ và phí phạt hiện có trong công cụ thành viên.", "/user/loans"],
      ["Quầy nhân viên", "Thủ thư có thể quản lý mượn, trả và nhận sách đặt giữ.", "/staff/circulation"],
      ["Bộ sưu tập", "Cập nhật danh mục tiếp tục trong suốt học kỳ.", "/books"],
    ],
  },
};

export function NoticesPage() {
  const { locale } = useLanguage();
  const copy = noticesPageCopy[locale];

  return (
    <InstitutionalShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      imageUrl="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80"
    >
      <SectionBand>
        <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr]">
          <div className="grid gap-5">
            {copy.notices.map((notice) => (
              <article key={notice.title} className="rounded-2xl border border-[#DED5C8] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(43,39,35,0.10)]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[#2B2723]/8 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#2B2723]">{notice.type}</span>
                  <time className="text-sm font-semibold text-[#7A263A]">{notice.date}</time>
                </div>
                <h2 className="mt-4 font-serif text-3xl font-bold text-[#2B2723]">{notice.title}</h2>
                <p className="mt-3 leading-7 text-[#5F574F]">{notice.body}</p>
              </article>
            ))}
          </div>
          <aside className="rounded-2xl border border-[#DED5C8] bg-[#F7F3EA] p-6 lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-bold uppercase tracking-wide text-[#7A263A]">{copy.quickAccess}</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-[#2B2723]">{copy.quickTitle}</h2>
            <div className="mt-6 grid gap-4">
              {copy.serviceCards.map(([title, body, href]) => (
                <Link key={title} href={href} className="rounded-xl border border-[#DED5C8] bg-white p-4 transition hover:border-[#7A263A]/40">
                  <h3 className="font-bold text-[#2B2723]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5F574F]">{body}</p>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </SectionBand>
    </InstitutionalShell>
  );
}
