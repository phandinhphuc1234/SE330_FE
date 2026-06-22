"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogShell, Notice } from "@/features/catalog/components/CatalogShell";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { FineRecord } from "../types/circulation.type";
import { getMyFines } from "../services/circulationService";
import { formatDate, money } from "./circulationHelpers";
import { createPayment } from "@/features/payments/services/paymentService";

const copy = {
  en: {
    eyebrow: "My fines",
    title: "Fine ledger",
    description: "Detailed record of your library fines calculated from overdue returns.",
    loading: "Loading fines...",
    loadError: "Could not load fines.",
    empty: "You do not have any library fines. Great job returning books on time!",
    headings: ["Book", "Dates (Due vs Return)", "Amount", "Status", "Action"],
    payNow: "Pay Now",
    processing: "Processing...",
    viewReceipt: "View Receipt",
    paymentError: "Failed to initiate payment.",
  },
  vi: {
    eyebrow: "Sổ tiền phạt",
    title: "Lịch sử nợ phí",
    description: "Chi tiết các khoản tiền phạt do trả sách quá hạn.",
    loading: "Đang tải dữ liệu...",
    loadError: "Không thể tải danh sách tiền phạt.",
    empty: "Bạn chưa có khoản phạt nào. Rất cảm ơn bạn đã trả sách đúng hạn!",
    headings: ["Sách", "Thời gian (Hạn trả - Ngày trả)", "Số tiền", "Trạng thái", "Thao tác"],
    payNow: "Thanh toán",
    processing: "Đang xử lý...",
    viewReceipt: "Xem hóa đơn",
    paymentError: "Không thể khởi tạo thanh toán.",
  },
};

export function UserFinesPage() {
  const { locale } = useLanguage();
  const text = copy[locale];
  const { accessToken, refresh } = useAuth();
  const router = useRouter();
  const [fines, setFines] = useState<FineRecord[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  useEffect(() => {
    let isMounted = true;
    getMyFines({ page: 0, size: 50 }, accessToken, refreshAccessToken)
      .then((items) => {
        if (isMounted) setFines(items ?? []);
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

  const handlePayment = async (borrowId: number) => {
    if (!borrowId || processingId !== null) return;
    setProcessingId(borrowId);
    setError("");

    try {
      const payment = await createPayment(
        {
          purpose: "OVERDUE_FINE",
          targetType: "BORROW_RECORD",
          targetId: borrowId,
          provider: "VNPAY",
          locale: locale === "vi" ? "vn" : "en",
        },
        `fine-payment-${borrowId}-${Date.now()}`,
        accessToken,
        refreshAccessToken
      );

      if (payment.paymentUrl) {
        window.location.href = payment.paymentUrl;
      } else {
        setError(text.paymentError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : text.paymentError);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <CatalogShell
      protectedPage
      eyebrow={text.eyebrow}
      title={text.title}
      description={text.description}
    >
      <div className="grid gap-3">
        {isLoading ? <Notice message={text.loading} /> : null}
        {error ? <Notice tone="error" message={error} /> : null}
      </div>
      
      {!isLoading && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[#D8DEE8] bg-white shadow-sm">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-[#F8FAFC]">
              <tr>
                {text.headings.map((heading) => (
                  <th key={heading} className="px-6 py-4 font-black uppercase tracking-wider text-[#6B7280] text-[10px]">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8DEE8]">
              {fines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#59637A] font-medium italic">
                    {text.empty}
                  </td>
                </tr>
              ) : (
                fines.map((fine, idx) => (
                  <tr key={`${fine.borrowId}-${idx}`} className="hover:bg-[#F8FAFC] transition-colors group">
                    {/* Book Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600">
                          <Icon name="book" size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-[#0B1026] line-clamp-2 max-w-[240px]" title={fine.bookTitle}>
                            {fine.bookTitle || "Unknown Book"}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            {fine.itemBarcode && (
                              <span className="font-mono text-[10px] font-medium text-slate-500">
                                Barcode: {fine.itemBarcode}
                              </span>
                            )}
                            {fine.borrowId && (
                              <span className="font-mono text-[10px] font-medium text-slate-400 border-l border-slate-200 pl-2">
                                Borrow #{fine.borrowId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Dates Column */}
                    <td className="px-6 py-4">
                      <div className="grid gap-1.5 text-xs">
                        <div className="flex justify-between w-48">
                          <span className="text-slate-500 font-medium">Due:</span>
                          <span className="font-bold text-slate-700">{fine.dueDate ? formatDate(fine.dueDate, locale) : "–"}</span>
                        </div>
                        <div className="flex justify-between w-48">
                          <span className="text-slate-500 font-medium">Returned:</span>
                          <span className="font-bold text-red-600">{fine.returnedAt ? formatDate(fine.returnedAt, locale) : "Not returned"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Amount Column */}
                    <td className="px-6 py-4">
                      <span className="font-black text-lg text-[#B30D2D]">
                        {typeof fine.fineAmount === "number" ? (
                          <>
                            {fine.fineAmount.toLocaleString("vi-VN")} <span className="text-[0.7em] text-slate-500 font-bold">VND</span>
                          </>
                        ) : "-"}
                      </span>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      <FineStatusBadge status={fine.fineStatus} />
                      {/* Sub-status notes */}
                      <div className="mt-1.5 text-[10px] text-slate-500 font-medium max-w-[160px]">
                        {fine.fineStatus === "PAID" && fine.finePaidAt && (
                          <span>Paid {formatDate(fine.finePaidAt, locale)}</span>
                        )}
                        {fine.fineStatus === "WAIVED" && fine.fineWaivedReason && (
                          <span className="italic">
                            Lý do: {fine.fineWaivedReason.replace(/^MEMBER_HAS_UNPAID_FINES:\s*/i, "")}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {fine.fineStatus === "UNPAID" && fine.borrowId && (
                        <button
                          type="button"
                          onClick={() => handlePayment(fine.borrowId!)}
                          disabled={processingId !== null}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-black hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          <Icon name="credit-card" size={14} className={processingId === fine.borrowId ? "animate-pulse" : ""} />
                          {processingId === fine.borrowId ? text.processing : text.payNow}
                        </button>
                      )}
                      {fine.fineStatus === "PAID" && (
                         <Link
                          href={`/user/receipts`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#D9DCE8] bg-white px-4 py-2 text-xs font-bold text-[#000054] transition hover:-translate-y-0.5 hover:border-[#337AB7] hover:text-[#E60028]"
                       >
                         <Icon name="file-text" size={14} />
                         {text.viewReceipt}
                       </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </CatalogShell>
  );
}

function FineStatusBadge({ status }: { status?: string }) {
  switch (status) {
    case "PAID":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[10px] font-black text-[#059669] uppercase tracking-wider">
          <Icon name="check-circle" size={12} />
          Paid
        </span>
      );
    case "UNPAID":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] px-2.5 py-1 text-[10px] font-black text-[#DC2626] uppercase tracking-wider">
          <Icon name="alert-circle" size={12} />
          Unpaid
        </span>
      );
    case "WAIVED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[10px] font-black text-[#475569] uppercase tracking-wider">
          <Icon name="shield" size={12} />
          Waived
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-black text-[#6B7280] uppercase tracking-wider border border-[#E2E8F0]">
          {status || "Unknown"}
        </span>
      );
  }
}
