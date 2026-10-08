"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { InstitutionalShell } from "./InstitutionalShell";

type GuideLocale = "en" | "vi";
type Localized<T> = Record<GuideLocale, T>;

const guideText = {
  eyebrow: { en: "Borrowing guide", vi: "Hướng dẫn mượn" },
  title: {
    en: "Clear rules for borrowing, renewal, holds, and returns.",
    vi: "Quy định rõ ràng cho mượn sách, gia hạn, đặt giữ và trả sách.",
  },
  description: {
    en: "A practical guide for using The Athenaeum collection with confidence, from first checkout to final return.",
    vi: "Hướng dẫn thực tế để sử dụng bộ sưu tập The Athenaeum tự tin từ lần mượn đầu đến khi hoàn trả.",
  },
  summaryEyebrow: { en: "The Athenaeum", vi: "The Athenaeum" },
  summaryTitle: { en: "Borrowing at a glance", vi: "Thông tin mượn sách tổng quan" },
  summaryDescription: {
    en: "Generous access, clear policies, and friendly support — so you can focus on what’s next.",
    vi: "Quyền truy cập thuận tiện, chính sách rõ ràng và hỗ trợ thân thiện để bạn an tâm đọc sách.",
  },
  stats: [
    {
      en: ["Standard loan", "21 days", "Most books and circulating materials."],
      vi: ["Thời hạn mượn chuẩn", "21 ngày", "Áp dụng cho hầu hết sách và tài liệu lưu thông."],
    },
    {
      en: ["Renewals", "2x", "Most eligible items can be renewed twice."],
      vi: ["Gia hạn", "2 lần", "Phần lớn tài liệu hợp lệ có thể được gia hạn hai lần."],
    },
    {
      en: ["Hold pickup", "3 days", "Items are held for 3 days after notification."],
      vi: ["Nhận sách đặt giữ", "3 ngày", "Sách được giữ trong 3 ngày sau khi có thông báo."],
    },
    {
      en: ["Desk support", "Daily", "Get help from our team every day."],
      vi: ["Hỗ trợ tại quầy", "Hằng ngày", "Nhận hỗ trợ từ đội ngũ thư viện mỗi ngày."],
    },
  ],
  loanEyebrow: { en: "Loan periods", vi: "Thời hạn mượn" },
  loanTitle: { en: "Borrow by material type", vi: "Mượn theo loại tài liệu" },
  loanDescription: {
    en: "Loan policies are built to balance generous access with fair circulation for high-demand materials.",
    vi: "Chính sách mượn được thiết kế để cân bằng quyền truy cập rộng rãi và lưu thông công bằng cho tài liệu có nhu cầu cao.",
  },
  myLoans: { en: "My Borrows", vi: "Sách đang mượn" },
  myHolds: { en: "My Holds", vi: "Lượt đặt giữ" },
  headings: {
    en: ["Material", "Loan period", "Renewal", "Notes"],
    vi: ["Tài liệu", "Thời hạn mượn", "Gia hạn", "Ghi chú"],
  },
  loanRules: [
    {
      en: ["Books", "21 days", "2 renewals", "Place holds when all copies are out."],
      vi: ["Sách", "21 ngày", "2 lần gia hạn", "Đặt giữ khi tất cả bản sao đã được mượn."],
    },
    {
      en: ["Reference", "In library", "No renewals", "Ask staff for scans or support."],
      vi: ["Tài liệu tham khảo", "Tại thư viện", "Không gia hạn", "Hỏi thủ thư để được hỗ trợ quét hoặc tra cứu."],
    },
    {
      en: ["Course reserve", "2 hours", "No renewals", "High-demand access at the desk."],
      vi: ["Tài liệu học phần", "2 giờ", "Không gia hạn", "Truy cập tài liệu nhu cầu cao tại quầy."],
    },
    {
      en: ["Media kits", "7 days", "1 renewal", "Return directly to circulation."],
      vi: ["Bộ media", "7 ngày", "1 lần gia hạn", "Trả trực tiếp tại quầy lưu thông."],
    },
  ],
  stepsEyebrow: { en: "How it works", vi: "Cách hoạt động" },
  stepsTitle: { en: "From discovery to return", vi: "Từ tìm kiếm đến hoàn trả" },
  browseCatalog: { en: "Browse catalog", vi: "Duyệt danh mục" },
  steps: [
    {
      en: ["Find", "Search the catalog by title, author, ISBN, or subject."],
      vi: ["Tìm", "Tìm trong danh mục theo tên sách, tác giả, ISBN hoặc chủ đề."],
    },
    {
      en: ["Borrow", "Bring available copies to the desk or ask a librarian for checkout support."],
      vi: ["Mượn", "Mang bản sao có sẵn đến quầy hoặc nhờ thủ thư hỗ trợ làm thủ tục."],
    },
    {
      en: ["Renew", "Extend eligible loans before the due date from your account."],
      vi: ["Gia hạn", "Gia hạn các khoản mượn đủ điều kiện trước ngày đến hạn từ tài khoản của bạn."],
    },
    {
      en: ["Return", "Return books on time so the next reader can access them."],
      vi: ["Trả", "Trả sách đúng hạn để người đọc tiếp theo có thể sử dụng."],
    },
  ],
} satisfies Record<string, Localized<string | string[]> | Array<Localized<string[]>>>;

function getBorrowingGuideCopy(locale: GuideLocale) {
  return {
    eyebrow: guideText.eyebrow[locale],
    title: guideText.title[locale],
    description: guideText.description[locale],
    summaryEyebrow: guideText.summaryEyebrow[locale],
    summaryTitle: guideText.summaryTitle[locale],
    summaryDescription: guideText.summaryDescription[locale],
    stats: guideText.stats.map((item) => item[locale]),
    loanEyebrow: guideText.loanEyebrow[locale],
    loanTitle: guideText.loanTitle[locale],
    loanDescription: guideText.loanDescription[locale],
    myLoans: guideText.myLoans[locale],
    myHolds: guideText.myHolds[locale],
    headings: guideText.headings[locale],
    loanRules: guideText.loanRules.map((item) => item[locale]),
    stepsEyebrow: guideText.stepsEyebrow[locale],
    stepsTitle: guideText.stepsTitle[locale],
    browseCatalog: guideText.browseCatalog[locale],
    steps: guideText.steps.map((item) => item[locale]),
  };
}

const statIcons = ["book-open", "refresh-cw", "calendar", "users"] as const;
const materialIcons = ["book-open", "file-text", "book", "database"] as const;
const stepIcons = ["search", "book", "refresh-cw", "upload"] as const;

function BotanicalSprig({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 180 240" fill="none" className={className}>
      <path d="M28 228C62 183 82 127 92 25" stroke="currentColor" strokeWidth="2" />
      <path d="M78 132C42 127 25 104 18 78C48 84 71 101 78 132Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M88 87C122 77 142 55 151 29C119 33 96 53 88 87Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M65 172C35 170 17 153 7 131C34 133 55 147 65 172Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M84 116C113 110 135 93 149 70C119 70 96 86 84 116Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function BorrowingGuidePage() {
  const { locale } = useLanguage();
  const copy = getBorrowingGuideCopy(locale);

  return (
    <InstitutionalShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      imageUrl="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1800&q=80"
    >
      <section className="relative isolate min-h-screen overflow-hidden bg-[#F8F1E7] px-5 py-16 text-[#201916] sm:py-20 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_2%,rgba(201,155,112,0.20),transparent_31%),radial-gradient(circle_at_5%_78%,rgba(190,148,101,0.14),transparent_27%),linear-gradient(115deg,#FFFDF8_0%,#F7EEE2_100%)]" />
        <div className="pointer-events-none absolute -right-14 top-10 -z-10 h-72 w-72 rounded-full border border-[#D8BCA0]/40" />
        <div className="pointer-events-none absolute -right-28 top-24 -z-10 h-96 w-96 rounded-full border border-[#D8BCA0]/25" />
        <BotanicalSprig className="pointer-events-none absolute -left-8 bottom-2 -z-10 w-40 -rotate-12 text-[#B98B64]/35 sm:w-52" />
        <BotanicalSprig className="pointer-events-none absolute -right-6 top-28 -z-10 w-40 rotate-12 text-[#B98B64]/30 sm:w-52" />

        <div className="mx-auto max-w-[92rem]">
          <header>
            <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.34em] text-[#8B203B] sm:text-xs">
              <span>{copy.summaryEyebrow}</span>
              <span className="h-px w-20 bg-[#B98B64]/60" />
            </div>
            <h2 className="mt-4 max-w-5xl font-serif text-[clamp(3.15rem,6vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-[#201416]">
              {copy.summaryTitle}
            </h2>
            <p className="mt-5 max-w-4xl font-serif text-lg leading-8 text-[#5D514B] sm:text-xl lg:text-2xl">
              {copy.summaryDescription}
            </p>
          </header>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {copy.stats.map(([label, value, detail], index) => (
              <article
                key={label}
                className="group relative min-h-48 overflow-hidden rounded-[1.5rem] border border-[#DCCEBE] bg-white/72 p-5 shadow-[0_18px_45px_rgba(78,51,37,0.08)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#C9AC91] hover:shadow-[0_22px_55px_rgba(78,51,37,0.13)] sm:p-6"
              >
                <div className="absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(193,142,102,0.18),transparent_68%)]" />
                <div className="relative flex items-start gap-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#F7E4E3] text-[#8B203B] ring-1 ring-white/80">
                    <Icon name={statIcons[index]} size={30} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8B203B]">{label}</p>
                    <p className="mt-2 font-serif text-4xl font-semibold leading-none text-[#201416] sm:text-5xl">{value}</p>
                    <p className="mt-3 text-sm leading-5 text-[#62564F]">{detail}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="my-12 flex items-center gap-5 text-[#A96D51]/55" aria-hidden="true">
            <span className="h-px flex-1 bg-current" />
            <Icon name="book-open" size={27} />
            <span className="h-px flex-1 bg-current" />
          </div>

          <div className="grid gap-10 xl:grid-cols-[0.72fr_1.6fr] xl:items-center">
            <div className="max-w-xl xl:pl-12">
              <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.32em] text-[#8B203B] sm:text-xs">
                <span>{copy.loanEyebrow}</span>
                <span className="h-px w-24 bg-[#B98B64]/55" />
              </div>
              <h3 className="mt-4 font-serif text-[clamp(3rem,5vw,5.6rem)] font-medium leading-[0.91] tracking-[-0.045em] text-[#201416]">
                {copy.loanTitle}
              </h3>
              <p className="mt-5 text-lg leading-8 text-[#62564F]">{copy.loanDescription}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/user/loans"
                  className="group inline-flex min-h-14 items-center gap-5 rounded-full bg-[linear-gradient(135deg,#9E1F40,#741A31)] px-7 text-sm font-bold text-white shadow-[0_14px_32px_rgba(122,38,58,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(122,38,58,0.3)]"
                >
                  {copy.myLoans}
                  <Icon name="arrow-right" size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href="/user/holds"
                  className="inline-flex min-h-14 items-center rounded-full border border-[#B98B64] bg-white/45 px-7 text-sm font-bold text-[#342824] transition hover:bg-white/80"
                >
                  {copy.myHolds}
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.6rem] border border-[#D8C7B6] bg-white/80 shadow-[0_24px_65px_rgba(78,51,37,0.12)] backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <caption className="sr-only">{copy.loanTitle}</caption>
                  <thead className="bg-[linear-gradient(110deg,#762037,#9B4454)] text-white">
                    <tr>
                      {copy.headings.map((heading) => (
                        <th key={heading} className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] first:pl-8">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {copy.loanRules.map((row, rowIndex) => (
                      <tr key={row[0]} className="border-t border-[#E2D5C8] transition-colors hover:bg-[#FFF9F2]">
                        <td className="px-6 py-5 pl-8">
                          <div className="flex items-center gap-4">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F7E4E3] text-[#8B203B]">
                              <Icon name={materialIcons[rowIndex]} size={22} aria-hidden="true" />
                            </span>
                            <span className="font-serif text-lg font-semibold text-[#211817]">{row[0]}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex min-w-28 justify-center rounded-full bg-[#E7EBDC] px-4 py-2 text-sm font-semibold text-[#403D31]">
                            {row[1]}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex min-w-28 justify-center rounded-full bg-[#F4E0E4] px-4 py-2 text-sm font-semibold text-[#6E2D3C]">
                            {row[2]}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm leading-6 text-[#62564F]">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate min-h-screen overflow-hidden bg-[#FFFDF9] px-5 py-16 text-[#211A1D] sm:py-20 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_88%_8%,rgba(205,178,147,0.25),transparent_30%),radial-gradient(circle_at_0%_100%,rgba(203,169,132,0.18),transparent_30%),linear-gradient(130deg,#FFFDF9_0%,#F8F0E5_100%)]" />
        <div className="pointer-events-none absolute -right-20 -top-44 -z-10 h-[34rem] w-[34rem] rounded-full border border-[#D2B79D]/35" />
        <div className="pointer-events-none absolute -right-4 -top-28 -z-10 h-[27rem] w-[27rem] rounded-full border border-[#D2B79D]/25" />
        <BotanicalSprig className="pointer-events-none absolute -left-8 bottom-24 -z-10 w-48 -rotate-12 text-[#BD936D]/30" />
        <BotanicalSprig className="pointer-events-none absolute right-[31%] top-24 -z-10 hidden w-40 rotate-6 text-[#BD936D]/28 xl:block" />

        <div className="mx-auto max-w-[94rem]">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.36em] text-[#8B203B] sm:text-xs">
                <span>{copy.stepsEyebrow}</span>
                <span className="h-px w-24 bg-[#B98B64]/55" />
              </div>
              <h2 className="mt-5 max-w-5xl font-serif text-[clamp(3.2rem,6vw,6.25rem)] font-medium leading-[0.94] tracking-[-0.045em] text-[#20172B]">
                {copy.stepsTitle}
              </h2>
            </div>
            <Link
              href="/books"
              className="group inline-flex min-h-14 w-fit items-center gap-7 rounded-full border border-[#C8A98D] bg-white/50 px-7 text-sm font-bold text-[#211A1D] backdrop-blur-sm transition hover:bg-white"
            >
              {copy.browseCatalog}
              <Icon name="arrow-right" size={19} className="text-[#8B203B] transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>

          <div className="relative mt-12 grid gap-6 md:grid-cols-2 lg:mt-16 xl:grid-cols-4 xl:gap-10 xl:pb-24">
            {copy.steps.map(([title, body], index) => (
              <div
                key={title}
                className={`relative ${index % 2 === 1 ? "xl:translate-y-20" : ""}`}
              >
                <article className="group relative flex min-h-[26rem] flex-col overflow-hidden rounded-[1.7rem] border border-[#DED0C3] bg-white/70 p-6 shadow-[0_22px_55px_rgba(74,50,38,0.1)] backdrop-blur-sm transition duration-300 hover:-translate-y-2 hover:border-[#C8A98D] hover:shadow-[0_28px_65px_rgba(74,50,38,0.15)] sm:p-8">
                  <div className="flex items-start justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-[linear-gradient(145deg,#A22B4C,#75182F)] text-lg font-bold text-white shadow-[0_10px_24px_rgba(122,38,58,0.25)]">
                      {index + 1}
                    </span>
                    <span className="grid h-20 w-20 place-items-center rounded-full bg-[#F8E4E3] text-[#8B203B] transition-transform duration-300 group-hover:scale-105">
                      <Icon name={stepIcons[index]} size={34} aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-7 font-serif text-4xl font-semibold tracking-[-0.025em] text-[#21172B]">{title}</h3>
                  <p className="mt-3 max-w-sm text-base leading-7 text-[#655B61] sm:text-lg">{body}</p>
                  <div className="relative mt-auto h-28 overflow-hidden rounded-[1.25rem] bg-[linear-gradient(145deg,#F7EBE4,#EEE0D1)]">
                    <div className="absolute -bottom-16 -right-8 h-40 w-40 rounded-full border border-[#C9A98B]/45" />
                    <div className="absolute -bottom-10 right-12 h-28 w-28 rounded-full bg-white/35" />
                    <BotanicalSprig className="absolute -bottom-20 -left-8 w-32 rotate-[68deg] text-[#B88B66]/35" />
                    <Icon name={stepIcons[index]} size={48} className="absolute bottom-6 right-7 text-[#8B203B]/70" aria-hidden="true" />
                  </div>
                </article>

                {index < copy.steps.length - 1 ? (
                  <span className="pointer-events-none absolute -right-8 top-28 z-20 hidden h-12 w-12 place-items-center rounded-full border border-[#E4D7C9] bg-[#FFFDF8] text-[#8B203B] shadow-[0_8px_20px_rgba(74,50,38,0.12)] xl:grid">
                    <Icon name="arrow-right" size={20} aria-hidden="true" />
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </InstitutionalShell>
  );
}
