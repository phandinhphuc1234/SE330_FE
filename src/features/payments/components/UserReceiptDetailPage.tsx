"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogShell, Notice } from "@/features/catalog/components/CatalogShell";
import { Icon } from "@/components/ui/Icon";
import { PaymentReceiptResponse } from "../types/payment.type";
import { getReceiptByCode } from "../services/paymentService";

export function UserReceiptDetailPage() {
  const { paymentCode } = useParams<{ paymentCode: string }>();
  const { accessToken, refresh } = useAuth();
  const [receipt, setReceipt] = useState<PaymentReceiptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  useEffect(() => {
    if (!paymentCode) return;

    let active = true;

    getReceiptByCode(paymentCode, accessToken, refreshToken)
      .then((data) => {
        if (active) {
          setReceipt(data);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Receipt not found. It may not be completed yet.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [paymentCode, accessToken, refreshToken]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <CatalogShell
      protectedPage
      eyebrow="Receipt Detail"
      title={receipt ? `Receipt ${receipt.receiptNumber}` : "View Receipt"}
      description="Official payment confirmation for your library account."
      actions={
        <div className="flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            disabled={!receipt}
            className="inline-flex items-center gap-2 rounded-full border border-[#D9DCE8] bg-white px-5 py-3 text-sm font-bold text-[#000054] transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
          >
            <Icon name="printer" size={17} />
            Print Receipt
          </button>
          <Link
            href="/user/receipts"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111827] px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-black"
          >
            Back to List
          </Link>
        </div>
      }
    >
      <div className="grid gap-3 mb-6 print:hidden">
        {error && <Notice tone="error" message={error} />}
        {isLoading && <Notice message="Loading receipt details..." />}
      </div>

      {!isLoading && receipt && (
        <div className="print-area">
          <style jsx global>{`
            @media print {
              header, footer, nav, aside, .print-hidden, [role="banner"], [role="navigation"] {
                display: none !important;
              }
              body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              main {
                margin: 0 !important;
                padding: 0 !important;
              }
              .print-area {
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `}</style>

          <div className="mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-[#D8DEE8] bg-white p-8 shadow-[0_26px_80px_rgba(15,23,42,0.08)] md:p-12">
            {/* Invoice Header */}
            <div className="flex flex-col justify-between gap-6 border-b border-[#E1E6F0] pb-8 md:flex-row md:items-start">
              <div>
                <div className="flex items-center gap-2 text-[#B30D2D]">
                  <Icon name="book-open" size={32} />
                  <span className="font-serif text-2xl font-black tracking-tight text-[#0B1026]">ATHENAEUM</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#59637A]">Secure Library Management System</p>
              </div>
              <div className="text-left md:text-right">
                <h1 className="font-serif text-3xl font-bold text-[#0B1026]">OFFICIAL RECEIPT</h1>
                <p className="mt-1 font-mono text-sm font-bold text-[#6B7280]">#{receipt.receiptNumber}</p>
              </div>
            </div>

            {/* Bill To / Info */}
            <div className="grid gap-8 py-8 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#6B7280]">Billed To</p>
                <div className="mt-2">
                  <p className="text-lg font-bold text-[#0B1026]">{receipt.memberName}</p>
                  <p className="text-sm font-medium text-[#59637A]">{receipt.memberEmail}</p>
                  <p className="text-xs font-semibold text-[#6B7280] mt-1">Member ID: #{receipt.memberId}</p>
                </div>
              </div>
              <div className="md:text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#6B7280]">Payment Details</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-semibold text-[#59637A]">
                    Date: <span className="text-[#0B1026]">{formatDateTime(receipt.paidAt)}</span>
                  </p>
                  <p className="text-sm font-semibold text-[#59637A]">
                    Code: <span className="text-[#0B1026]">{receipt.paymentCode}</span>
                  </p>
                  <p className="text-sm font-semibold text-[#59637A]">
                    Provider: <span className="text-[#0B1026] uppercase">{receipt.provider}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Item Table */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#D8DEE8]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#D8DEE8]">
                    <th className="px-6 py-4 font-black uppercase tracking-wider text-[#6B7280] text-[10px]">Description</th>
                    <th className="px-6 py-4 text-right font-black uppercase tracking-wider text-[#6B7280] text-[10px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8DEE8]">
                  <tr>
                    <td className="px-6 py-6">
                      <p className="font-bold text-[#0B1026] text-base">{receipt.itemTitle}</p>
                      <p className="text-xs font-semibold text-[#59637A] mt-1">
                        Purpose: {receipt.purpose.replace(/_/g, " ")} • {receipt.targetType} #{receipt.targetId}
                      </p>
                    </td>
                    <td className="px-6 py-6 text-right font-black text-[#0B1026] text-lg">
                      {formatCurrency(receipt.amount, receipt.currency)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-[#F8FAFC]">
                    <td className="px-6 py-4 text-right font-black uppercase tracking-wider text-[#6B7280] text-[10px]">Total Paid</td>
                    <td className="px-6 py-4 text-right font-black text-[#B30D2D] text-xl">
                      {formatCurrency(receipt.amount, receipt.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer / Status */}
            <div className="mt-12 flex flex-col justify-between gap-6 border-t border-[#E1E6F0] pt-8 md:flex-row md:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#ECFDF5] px-4 py-2 text-xs font-black text-[#059669] uppercase">
                  <Icon name="check-circle" size={14} />
                  Payment {receipt.status}
                </span>
                <p className="mt-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">
                  Transaction ID: {receipt.providerTransactionId || "N/A"}
                </p>
              </div>
              <div className="text-sm font-medium italic text-[#59637A]">
                Thank you for using our library services.
              </div>
            </div>

            <div className="mt-8 text-center md:mt-16 print:mt-12">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#94A3B8]">
                Computer Generated Receipt • No Signature Required
              </p>
            </div>
          </div>
        </div>
      )}
    </CatalogShell>
  );
}

function formatCurrency(amount: number, currency = "VND") {
  return (
    <>
      {amount.toLocaleString("vi-VN")} <span className="text-[0.7em] text-slate-500 font-bold uppercase">{currency}</span>
    </>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
