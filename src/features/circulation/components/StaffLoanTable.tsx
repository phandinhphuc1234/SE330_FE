"use client";

import Link from "next/link";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { StaffLoanRecord } from "../types/circulation.type";
import { formatDate, money, statusLabel } from "./circulationHelpers";

type StaffLoanTableProps = {
  loans: StaffLoanRecord[];
  emptyMessage?: string;
};

const copy = {
  en: {
    empty: "No loan records found.",
    headings: ["ID", "Type", "Member", "Book", "Item", "Borrowed", "Due / Expires", "Returned", "Status", "Renewals", "Fine"],
    member: "Member",
    openCopies: "Open physical copies",
    viewBook: "View book",
    payment: "Payment",
    daysOverdue: "days overdue",
    copy: "Copy",
    physical: "Physical",
    ebook: "Ebook",
    digitalAccess: "Digital access",
    dueDate: "Due date",
    expires: "Expires",
    notApplicable: "N/A",
    pagination: "Pagination",
    previous: "Previous",
    next: "Next",
  },
  vi: {
    empty: "Không tìm thấy lượt mượn.",
    headings: ["Mã", "Loại", "Người mượn", "Sách", "Định danh", "Ngày mượn", "Hạn / Hết hạn", "Ngày trả", "Trạng thái", "Gia hạn", "Phạt"],
    member: "Thành viên",
    openCopies: "Mở bản sao vật lý",
    viewBook: "Xem sách",
    payment: "Thanh toán",
    daysOverdue: "ngày quá hạn",
    copy: "Bản sao",
    physical: "Physical",
    ebook: "Ebook",
    digitalAccess: "Quyền đọc số",
    dueDate: "Hạn trả",
    expires: "Hết hạn",
    notApplicable: "Không áp dụng",
    pagination: "Phân trang",
    previous: "Trước",
    next: "Sau",
  },
};

export function StaffLoanTable({ loans, emptyMessage }: StaffLoanTableProps) {
  const { locale } = useLanguage();
  const text = copy[locale];
  if (!loans.length) {
    return (
      <div className="rounded-xl border border-[#DED5C8] bg-[#F7F3EA] p-5 text-sm font-semibold text-[#5F574F]">
        {emptyMessage ?? text.empty}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#DED5C8]">
      <table className="w-full min-w-[1360px] border-collapse bg-white text-left text-sm">
        <thead className="bg-[#2B2723] text-white">
          <tr>
            {text.headings.map((heading) => (
              <th key={heading} className="px-4 py-3 font-bold">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => {
            const memberId = idOf(loan.memberId);
            const bookId = idOf(loan.bookId);
            const isEbook = loan.loanType === "EBOOK";
            const dueValue = isEbook ? loan.expiredAt ?? loan.dueDate ?? loan.dueAt : loan.dueDate ?? loan.dueAt;

            return (
              <tr key={loanKey(loan)} className="border-t border-[#DED5C8] align-top transition hover:bg-[#F7F3EA]">
                <td className="px-4 py-4 font-mono text-xs font-black text-[#2B2723]">{renderLoanIdentifier(loan)}</td>
                <td className="px-4 py-4">
                  <LoanTypeBadge loanType={loan.loanType} />
                </td>
                <td className="px-4 py-4">
                  <div className="font-bold text-[#2B2723]">
                    {memberId ? (
                      <Link href={`/staff/members/${memberId}`} className="hover:text-[#7A263A]">
                        {loan.memberName || `${text.member} ${memberId}`}
                      </Link>
                    ) : (
                      loan.memberName || "-"
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#5F574F]/75">{loan.memberEmail || "-"}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="font-bold text-[#2B2723]">{loan.bookTitle ?? loan.title ?? "-"}</div>
                  {bookId && isEbook ? (
                    <Link href={`/books/${bookId}`} className="mt-1 inline-flex text-xs font-bold text-[#7A263A] hover:text-[#7A263A]">
                      {text.viewBook}
                    </Link>
                  ) : null}
                  {bookId && !isEbook ? (
                    <Link href={`/staff/books/${bookId}/copies`} className="mt-1 inline-flex text-xs font-bold text-[#7A263A] hover:text-[#7A263A]">
                      {text.openCopies}
                    </Link>
                  ) : null}
                  {isEbook && loan.paymentId ? (
                    <span className="ml-3 mt-1 inline-flex text-xs font-bold text-[#5F574F]/70">
                      {text.payment} #{loan.paymentId}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-4 font-mono text-xs font-semibold text-[#5F574F]">{renderItemCode(loan, text)}</td>
                <td className="px-4 py-4 text-[#5F574F]">{formatDate(loan.borrowedAt ?? loan.checkoutAt, locale)}</td>
                <td className="px-4 py-4">
                  <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-[#776D63]">
                    {isEbook ? text.expires : text.dueDate}
                  </p>
                  <span className={loan.overdue ? "font-bold text-[#7A263A]" : "text-[#5F574F]"}>
                    {formatDate(dueValue, locale)}
                  </span>
                  {loan.daysOverdue ? <p className="mt-1 text-xs font-bold text-[#7A263A]">{loan.daysOverdue} {text.daysOverdue}</p> : null}
                </td>
                <td className="px-4 py-4 text-[#5F574F]">{formatDate(loan.returnedAt, locale)}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={loan.status} overdue={loan.overdue} />
                  {!isEbook && loan.copyStatus ? <p className="mt-2 text-xs font-semibold text-[#5F574F]/75">{text.copy}: {statusLabel(loan.copyStatus, locale)}</p> : null}
                </td>
                <td className="px-4 py-4 font-semibold text-[#5F574F]">
                  {isEbook ? text.notApplicable : `${loan.renewCount ?? 0} / ${loan.maxRenewals ?? "-"}`}
                </td>
                <td className="px-4 py-4">
                  <span className="font-semibold text-[#5F574F]">{money(loan.fineAmount ?? loan.fine, locale)}</span>
                  {loan.fineStatus ? <p className="mt-1 text-xs font-bold uppercase text-[#7A263A]">{statusLabel(loan.fineStatus, locale)}</p> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function StaffPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const { locale } = useLanguage();
  const text = copy[locale];
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const pages = buildPaginationPages(currentPage, safeTotalPages);

  return (
    <nav className="mt-6 flex justify-center rounded-2xl border border-[#DED5C8] bg-white px-5 py-4 shadow-sm" aria-label={text.pagination}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 0}
          className="rounded-full border border-[#D8CCBC] px-4 py-2 text-sm font-bold text-[#2B2723] transition hover:border-[#7A263A] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {text.previous}
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition ${
              page === currentPage
                ? "bg-[#7A263A] text-white shadow-lg shadow-[#7A263A]/20"
                : "border border-[#D8CCBC] text-[#2B2723] hover:border-[#7A263A]"
            }`}
          >
            {page + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= safeTotalPages - 1}
          className="rounded-full border border-[#D8CCBC] px-4 py-2 text-sm font-bold text-[#2B2723] transition hover:border-[#7A263A] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {text.next}
        </button>
      </div>
    </nav>
  );
}

export function StatusBadge({ status, overdue }: { status?: string; overdue?: boolean }) {
  const { locale } = useLanguage();
  const normalizedStatus = (status || "UNKNOWN").toUpperCase();
  const classes =
    overdue || normalizedStatus === "OVERDUE"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : normalizedStatus === "BORROWED"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : normalizedStatus === "ACTIVE"
          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
          : normalizedStatus === "RETURNED"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : normalizedStatus === "LOST" || normalizedStatus === "REVOKED" || normalizedStatus === "EXPIRED"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-[#D8CCBC] bg-[#F7F3EA] text-[#5F574F]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${classes}`}>
      {statusLabel(normalizedStatus, locale)}
    </span>
  );
}

export function loanKey(loan: StaffLoanRecord) {
  return String(
    loan.loanType === "EBOOK" && loan.ebookLoanId
      ? `ebook-${loan.ebookLoanId}`
      : loan.borrowId ?? loan.id ?? `${loan.memberId ?? "member"}-${loan.bookCopyId ?? loan.itemBarcode ?? loan.ebookLoanId ?? "copy"}`,
  );
}

function idOf(value?: number) {
  return value === undefined || value === null ? "" : String(value);
}

function renderLoanIdentifier(loan: StaffLoanRecord) {
  if (loan.loanType === "EBOOK") {
    return loan.ebookLoanId ? `EBOOK-${loan.ebookLoanId}` : "EBOOK";
  }

  return loan.borrowId || loan.id ? `#${loan.borrowId ?? loan.id}` : "-";
}

function renderItemCode(loan: StaffLoanRecord, text: typeof copy.en) {
  return loan.loanType === "EBOOK" ? text.digitalAccess : loan.itemBarcode ?? loan.barcode ?? "-";
}

function LoanTypeBadge({ loanType }: { loanType?: string }) {
  const { locale } = useLanguage();
  const text = copy[locale];
  const isEbook = loanType === "EBOOK";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${
        isEbook ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      {isEbook ? text.ebook : text.physical}
    </span>
  );
}

function buildPaginationPages(currentPage: number, totalPages: number) {
  const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
  const end = Math.min(totalPages, start + 5);
  return Array.from({ length: end - start }, (_, index) => start + index);
}
