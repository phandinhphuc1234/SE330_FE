"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogShell, Notice } from "@/features/catalog/components/CatalogShell";
import { Icon } from "@/components/ui/Icon";
import { PaymentReceiptResponse } from "../types/payment.type";
import { getMyReceipts } from "../services/paymentService";

export function UserReceiptListPage() {
  const { accessToken, refresh } = useAuth();
  const [receipts, setReceipts] = useState<PaymentReceiptResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  useEffect(() => {
    let active = true;

    getMyReceipts({ page: 0, size: 50 }, accessToken, refreshToken)
      .then((data) => {
        if (active) {
          setReceipts(data);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load receipts.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, refreshToken]);

  return (
    <CatalogShell
      protectedPage
      eyebrow="Billing"
      title="Payment Receipts"
      description="View and print invoices for your library purchases and ebook rentals."
    >
      <div className="grid gap-3 mb-6">
        {error && <Notice tone="error" message={error} />}
        {isLoading && <Notice message="Loading your receipts..." />}
      </div>

      {!isLoading && (
        <div className="overflow-x-auto rounded-2xl border border-[#D8DEE8] bg-white shadow-sm">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#D8DEE8]">
                {["Receipt #", "Item", "Amount", "Provider", "Paid at", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 font-black uppercase tracking-wider text-[#6B7280] text-[10px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8DEE8]">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#59637A] font-medium italic">
                    You do not have any payment receipts yet.
                  </td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr key={receipt.paymentId} className="hover:bg-[#F8FAFC] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-[#0B1026] bg-[#F1F5F9] px-2 py-1 rounded">
                        {receipt.receiptNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0B1026] truncate max-w-[240px]" title={receipt.itemTitle}>
                        {receipt.itemTitle}
                      </div>
                      <div className="text-[10px] font-black uppercase text-[#6B7280] mt-0.5">
                        {receipt.purpose.replace(/_/g, " ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-[#0B1026]">
                      {formatCurrency(receipt.amount, receipt.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F0F7FF] px-2 py-1 text-[10px] font-black text-[#0066FF] uppercase">
                        <Icon name="credit-card" size={12} />
                        {receipt.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#59637A] font-semibold">
                      {formatDateTime(receipt.paidAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/user/receipts/${receipt.paymentCode}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-black shadow-sm"
                      >
                        View Receipt
                        <Icon name="arrow-right" size={14} />
                      </Link>
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
