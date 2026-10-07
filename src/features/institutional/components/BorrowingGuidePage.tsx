"use client";

import Link from "next/link";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { InstitutionalShell, SectionBand, StatTile } from "./InstitutionalShell";

const borrowingGuideCopy = {
  en: {
    eyebrow: "Borrowing guide",
    title: "Clear rules for borrowing, renewal, holds, and returns.",
    description: "A practical guide for using The Athenaeum collection with confidence, from first checkout to final return.",
    stats: [
      ["Standard loan", "21 days"],
      ["Renewals", "2x"],
      ["Hold pickup", "3 days"],
      ["Desk support", "Daily"],
    ],
    loanEyebrow: "Loan periods",
    loanTitle: "Borrow by material type",
    loanDescription: "Loan policies are built to balance generous access with fair circulation for high-demand materials.",
    myLoans: "My Borrows",
    myHolds: "My Holds",
    headings: ["Material", "Loan period", "Renewal", "Notes"],
    loanRules: [
      ["Books", "21 days", "2 renewals", "Place holds when all copies are out"],
      ["Reference", "In library", "No renewals", "Ask staff for scans or support"],
      ["Course reserve", "2 hours", "No renewals", "High-demand access at the desk"],
      ["Media kits", "7 days", "1 renewal", "Return directly to circulation"],
    ],
    stepsEyebrow: "How it works",
    stepsTitle: "From discovery to return",
    browseCatalog: "Browse catalog",
    steps: [
      ["Find", "Search the catalog by title, author, ISBN, or subject."],
      ["Borrow", "Bring available copies to the desk or ask a librarian for checkout support."],
      ["Renew", "Extend eligible loans before the due date from your account."],
      ["Return", "Return books on time so the next reader can access them."],
    ],
  },
  vi: {
    eyebrow: "Hướng dẫn mượn",
    title: "Quy định rõ ràng cho mượn sách, gia hạn, đặt giữ và trả sách.",
    description: "Hướng dẫn thực tế để sử dụng bộ sưu tập The Athenaeum tự tin từ lần mượn đầu đến khi hoàn trả.",
    stats: [
      ["Thời hạn mượn chuẩn", "21 ngày"],
      ["Gia hạn", "2 lần"],
      ["Nhận sách đặt giữ", "3 ngày"],
      ["Hỗ trợ tại quầy", "Hằng ngày"],
    ],
    loanEyebrow: "Thời hạn mượn",
    loanTitle: "Mượn theo loại tài liệu",
    loanDescription: "Chính sách mượn được thiết kế để cân bằng quyền truy cập rộng rãi và lưu thông công bằng cho tài liệu có nhu cầu cao.",
    myLoans: "Sách đang mượn",
    myHolds: "Lượt đặt giữ",
    headings: ["Tài liệu", "Thời hạn mượn", "Gia hạn", "Ghi chú"],
    loanRules: [
      ["Sách", "21 ngày", "2 lần gia hạn", "Đặt giữ khi tất cả bản sao đã được mượn"],
      ["Tài liệu tham khảo", "Tại thư viện", "Không gia hạn", "Hỏi thủ thư để được hỗ trợ quét hoặc tra cứu"],
      ["Tài liệu học phần", "2 giờ", "Không gia hạn", "Truy cập tài liệu nhu cầu cao tại quầy"],
      ["Bộ media", "7 ngày", "1 lần gia hạn", "Trả trực tiếp tại quầy lưu thông"],
    ],
    stepsEyebrow: "Cách hoạt động",
    stepsTitle: "Từ tìm kiếm đến hoàn trả",
    browseCatalog: "Duyệt danh mục",
    steps: [
      ["Tìm", "Tìm trong danh mục theo tên sách, tác giả, ISBN hoặc chủ đề."],
      ["Mượn", "Mang bản sao có sẵn đến quầy hoặc nhờ thủ thư hỗ trợ làm thủ tục."],
      ["Gia hạn", "Gia hạn các khoản mượn đủ điều kiện trước ngày đến hạn từ tài khoản của bạn."],
      ["Trả", "Trả sách đúng hạn để người đọc tiếp theo có thể sử dụng."],
    ],
  },
};

export function BorrowingGuidePage() {
  const { locale } = useLanguage();
  const copy = borrowingGuideCopy[locale];

  return (
    <InstitutionalShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      imageUrl="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1800&q=80"
    >
      <SectionBand>
        <div className="grid gap-5 md:grid-cols-4">
          {copy.stats.map(([label, value]) => <StatTile key={label} label={label} value={value} />)}
        </div>
      </SectionBand>

      <SectionBand tone="soft">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#7A263A]">{copy.loanEyebrow}</p>
            <h2 className="mt-3 font-serif text-4xl font-bold text-[#2B2723]">{copy.loanTitle}</h2>
            <p className="mt-4 leading-7 text-[#5F574F]">
              {copy.loanDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/user/loans" className="rounded-full bg-[#7A263A] px-5 py-3 text-sm font-bold text-white">{copy.myLoans}</Link>
              <Link href="/user/holds" className="rounded-full border border-[#D8CCBC] px-5 py-3 text-sm font-bold text-[#2B2723]">{copy.myHolds}</Link>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#DED5C8] bg-white">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-[#2B2723] text-white">
                <tr>{copy.headings.map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {copy.loanRules.map((row) => (
                  <tr key={row[0]} className="border-t border-[#DED5C8]">
                    {row.map((cell, index) => <td key={cell} className={`px-4 py-4 ${index === 0 ? "font-bold text-[#2B2723]" : "text-[#5F574F]"}`}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionBand>

      <SectionBand>
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#7A263A]">{copy.stepsEyebrow}</p>
            <h2 className="mt-3 font-serif text-4xl font-bold text-[#2B2723]">{copy.stepsTitle}</h2>
          </div>
          <Link href="/books" className="rounded-full border border-[#D8CCBC] px-5 py-3 text-sm font-bold text-[#2B2723]">{copy.browseCatalog}</Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-4">
          {copy.steps.map(([title, body], index) => (
            <article key={title} className="rounded-xl border border-[#DED5C8] bg-[#F7F3EA] p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#7A263A] text-sm font-bold text-white">{index + 1}</span>
              <h3 className="mt-5 text-xl font-bold text-[#2B2723]">{title}</h3>
              <p className="mt-3 leading-7 text-[#5F574F]">{body}</p>
            </article>
          ))}
        </div>
      </SectionBand>
    </InstitutionalShell>
  );
}
