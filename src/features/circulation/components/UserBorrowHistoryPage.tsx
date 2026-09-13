"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogShell, Notice, SecondaryAction } from "@/features/catalog/components/CatalogShell";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { BorrowRecord } from "../types/circulation.type";
import { getMyBorrowHistory } from "../services/circulationService";
import { formatDate, recordId, statusLabel, titleOf } from "./circulationHelpers";

const copy = {
  en: {
    eyebrow: "History",
    title: "Your borrowing history",
    description: "A complete record of books you have returned or whose access has ended.",
    currentLoans: "Active borrows",
    loading: "Loading history...",
    loadError: "Could not load borrowing history.",
    empty: "You do not have any past borrowing records.",
    headings: ["Book", "Borrowed", "Returned", "Status", "Fine"],
  },
  vi: {
    eyebrow: "Lịch sử",
    title: "Lịch sử mượn sách",
    description: "Bản ghi đầy đủ các cuốn sách bạn đã trả hoặc đã hết hạn truy cập.",
    currentLoans: "Sách đang mượn",
    loading: "Đang tải lịch sử...",
    loadError: "Không thể tải lịch sử mượn.",
    empty: "Bạn chưa có lịch sử mượn sách nào.",
    headings: ["Sách", "Ngày mượn", "Ngày trả", "Trạng thái", "Phạt"],
  },
};

export function UserBorrowHistoryPage() {
  const { locale } = useLanguage();
  const text = copy[locale];
  const { accessToken, refresh } = useAuth();
  const [history, setHistory] = useState<BorrowRecord[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  useEffect(() => {
    let isMounted = true;
    getMyBorrowHistory({}, accessToken, refreshAccessToken)
      .then((items) => {
        if (isMounted) {
          setHistory(items ?? []);
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
  }, [accessToken, refreshAccessToken, text.loadError]);

  return (
    <CatalogShell
      protectedPage
      eyebrow={text.eyebrow}
      title={text.title}
      description={text.description}
      actions={<SecondaryAction href="/user/loans">{text.currentLoans}</SecondaryAction>}
    >
      <div className="grid gap-3">
        {isLoading ? <Notice message={text.loading} /> : null}
        {error ? <Notice tone="error" message={error} /> : null}
      </div>

      {!isLoading && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[#D8DEE8] bg-white shadow-sm">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#D8DEE8]">
                {text.headings.map((heading) => (
                  <th key={heading} className="px-6 py-4 font-black uppercase tracking-wider text-[#6B7280] text-[10px]">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8DEE8]">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#59637A] font-medium italic">
                    {text.empty}
                  </td>
                </tr>
              ) : (
                history.map((loan, index) => {
                  const id = recordId(loan);
                  const isEbook = loan.loanType === "EBOOK";
                  
                  return (
                    <tr 
                      key={`${id}-${loan.loanType || 'PHYSICAL'}-${index}`} 
                      className="hover:bg-[#F8FAFC] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isEbook ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                            <Icon name={isEbook ? "smartphone" : "book"} size={16} />
                          </div>
                          <div>
                            <div className="font-bold text-[#0B1026] line-clamp-2 max-w-[280px]" title={titleOf(loan)}>
                              {titleOf(loan)}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${isEbook ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                {isEbook ? 'Ebook' : 'Physical'}
                              </span>
                              {!isEbook && loan.barcode && (
                                <span className="font-mono text-[10px] font-medium text-slate-500">{loan.barcode}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-semibold">
                        {formatDate(loan.borrowedAt ?? loan.checkoutAt, locale)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-semibold">
                        {formatDate(loan.returnedAt ?? loan.expiredAt, locale)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[10px] font-black text-[#64748B] uppercase tracking-wider">
                          {statusLabel(loan.status, locale)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-black text-[#0B1026]">
                        {typeof loan.fineAmount === "number" || typeof loan.fine === "number" ? (
                          <>
                            {(loan.fineAmount ?? loan.fine ?? 0).toLocaleString("vi-VN")} <span className="text-[0.7em] text-slate-400 font-bold italic">VND</span>
                          </>
                        ) : "–"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </CatalogShell>
  );
}
