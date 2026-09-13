"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogShell, Notice, SecondaryAction } from "@/features/catalog/components/CatalogShell";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { BorrowRecord } from "../types/circulation.type";
import { getMyBorrows, renewMyBorrow } from "../services/circulationService";
import { formatDate, recordId, statusLabel, titleOf } from "./circulationHelpers";

const copy = {
  en: {
    eyebrow: "My borrows",
    title: "Current borrowed books",
    description: "Track active loans, due dates, renewals, and any fines attached to your current borrowing.",
    history: "Borrow history",
    loading: "Loading your current loans...",
    loadError: "Could not load loans.",
    renewed: "Borrow was renewed.",
    renewError: "Could not renew borrow.",
    empty: "You do not have active loans.",
    renewing: "Renewing...",
    renew: "Renew",
    headings: ["Book", "Borrowed", "Due", "Status", "Renewals"],
  },
  vi: {
    eyebrow: "Sách đang mượn",
    title: "Các sách bạn đang mượn",
    description: "Theo dõi sách đang mượn, hạn trả, lượt gia hạn và tiền phạt liên quan.",
    history: "Lịch sử mượn",
    loading: "Đang tải sách đang mượn...",
    loadError: "Không thể tải danh sách mượn.",
    renewed: "Đã gia hạn lượt mượn.",
    renewError: "Không thể gia hạn lượt mượn.",
    empty: "Bạn chưa có sách đang mượn.",
    renewing: "Đang gia hạn...",
    renew: "Gia hạn",
    headings: ["Sách", "Ngày mượn", "Hạn trả", "Trạng thái", "Gia hạn"],
  },
};

export function UserLoansPage() {
  const { locale } = useLanguage();
  const text = copy[locale];
  const { accessToken, refresh } = useAuth();
  const [loans, setLoans] = useState<BorrowRecord[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [renewingBorrowId, setRenewingBorrowId] = useState<string | null>(null);
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  useEffect(() => {
    let isMounted = true;
    getMyBorrows({}, accessToken, refreshAccessToken)
      .then((items) => {
        if (isMounted) {
          setLoans(items ?? []);
          setError("");
        }
      })
      .catch((fetchError) => {
        if (isMounted) setError(fetchError instanceof Error ? fetchError.message : text.loadError);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, message, refreshAccessToken, text.loadError]);

  async function handleRenew(borrowId: string) {
    if (!borrowId || renewingBorrowId) return;

    setRenewingBorrowId(borrowId);
    try {
      await renewMyBorrow(borrowId, accessToken, refreshAccessToken);
      setMessage(text.renewed);
      setError("");
    } catch (renewError) {
      setError(renewError instanceof Error ? renewError.message : text.renewError);
    } finally {
      setRenewingBorrowId(null);
    }
  }

  return (
    <CatalogShell
      protectedPage
      eyebrow={text.eyebrow}
      title={text.title}
      description={text.description}
      actions={<SecondaryAction href="/user/loans/history">{text.history}</SecondaryAction>}
    >
      <div className="grid gap-3">
        {isLoading ? <Notice message={text.loading} /> : null}
        {message ? <Notice tone="success" message={message} /> : null}
        {error ? <Notice tone="error" message={error} /> : null}
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-[#EDEDF2]">
        <table className="w-full min-w-[980px] border-collapse bg-white text-left text-sm">
          <thead className="bg-[#000054] text-white">
            <tr>
              {text.headings.map((heading) => (
                <th key={heading} className="px-4 py-3 font-bold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => {
              const id = recordId(loan);
              const isEbook = loan.loanType === "EBOOK";
              const isActive = loan.status === "ACTIVE";

              return (
                <tr key={id || loan.barcode || loan.ebookLoanId} className="border-t border-[#EDEDF2] hover:bg-[#F8FAFC] transition-colors group">
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isEbook ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                        <Icon name={isEbook ? "smartphone" : "book"} size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-[#0B1026] line-clamp-2 max-w-[280px]" title={titleOf(loan)}>
                          {titleOf(loan)}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${isEbook ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                            {isEbook ? 'Ebook' : 'Physical'}
                          </span>
                          {!isEbook && loan.barcode && (
                            <span className="font-mono text-[10px] font-medium text-slate-500">{loan.barcode}</span>
                          )}
                          {isEbook && isActive && loan.bookId && (
                            <Link
                              href={`/books/${loan.bookId}/read`}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#337AB7] hover:text-[#000054] transition hover:underline border-l border-slate-200 pl-2"
                            >
                              <Icon name="book-open" size={12} />
                              {locale === "vi" ? "Đọc ngay" : "Read now"}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-600">{formatDate(loan.borrowedAt ?? loan.checkoutAt, locale)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`font-semibold ${loan.overdue ? 'text-red-600' : 'text-slate-700'}`}>
                      {formatDate(loan.dueAt ?? loan.dueDate ?? loan.expiredAt, locale)}
                    </span>
                    {loan.overdue && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">OVERDUE</span>}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{statusLabel(loan.status, locale)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-center text-slate-600">
                    {!isEbook ? (
                      <div className="flex items-center justify-center gap-3">
                        <span className="font-mono">{loan.renewCount ?? 0} / {loan.maxRenewals ?? "-"}</span>
                        {isActive && id ? (
                          <button
                            type="button"
                            onClick={() => void handleRenew(id)}
                            disabled={Boolean(renewingBorrowId)}
                            className="rounded-lg border border-[#D8DEE8] bg-white px-3 py-1.5 text-xs font-bold text-[#0B1026] transition hover:border-[#337AB7] hover:text-[#337AB7] disabled:cursor-wait disabled:opacity-55"
                          >
                            {renewingBorrowId === id ? text.renewing : text.renew}
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!isLoading && !loans.length ? <div className="mt-5"><Notice message={text.empty} /></div> : null}
    </CatalogShell>
  );
}
