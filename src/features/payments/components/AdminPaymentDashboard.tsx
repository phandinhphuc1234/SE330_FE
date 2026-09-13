"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogShell, Notice } from "@/features/catalog/components/CatalogShell";
import { StatsCard } from "@/components/ui/StatsCard";
import { Icon } from "@/components/ui/Icon";
import { AdminPaymentRowResponse, PaymentDashboardSummaryResponse } from "../types/payment.type";
import { getAdminPayments, getAdminPaymentSummary } from "../services/paymentService";

export function AdminPaymentDashboard() {
  const { accessToken, refresh } = useAuth();
  const [summary, setSummary] = useState<PaymentDashboardSummaryResponse | null>(null);
  const [payments, setPayments] = useState<AdminPaymentRowResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [paidFrom, setPaidFrom] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [page, setPage] = useState(0);

  const refreshToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await getAdminPaymentSummary(accessToken, refreshToken);
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  }, [accessToken, refreshToken]);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminPayments({ q, status, paidFrom, paidTo, page, size: 20 }, accessToken, refreshToken);
      setPayments(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load payments.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, refreshToken, q, status, paidFrom, paidTo, page]);

  useEffect(() => {
    const summaryTimer = window.setTimeout(() => {
      void fetchSummary();
    }, 0);

    return () => window.clearTimeout(summaryTimer);
  }, [fetchSummary]);

  useEffect(() => {
    const paymentsTimer = window.setTimeout(() => {
      void fetchPayments();
    }, 0);

    return () => window.clearTimeout(paymentsTimer);
  }, [fetchPayments]);

  return (
    <CatalogShell
      protectedPage
      eyebrow="Management"
      title="Payment Dashboard"
      description="Monitor revenue, transactions, and payment statuses across the system."
    >
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
        <StatsCard
          label="Total Revenue"
          value={summary?.totalRevenue ?? 0}
          color="primary"
          icon={<Icon name="banknote" size={24} />}
          isCurrency
        />
        <StatsCard
          label="Today's Revenue"
          value={summary?.todayRevenue ?? 0}
          color="secondary"
          icon={<Icon name="trending-up" size={24} />}
          isCurrency
        />
        <StatsCard
          label="Success Payments"
          value={summary?.successPayments ?? 0}
          color="success"
          icon={<Icon name="check-circle" size={24} />}
          trend={{ value: summary?.todaySuccessPayments ?? 0, isPositive: true, label: "today" }}
        />
        <StatsCard
          label="Pending Payments"
          value={summary?.pendingPayments ?? 0}
          color="warning"
          icon={<Icon name="clock" size={24} />}
        />
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-[#D8DEE8] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[10px] font-black uppercase text-[#6B7280] mb-1.5 ml-1">Search</label>
            <div className="relative">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Code, email, title..."
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0); }}
                className="w-full rounded-xl border border-[#D8DEE8] bg-[#F8FAFC] py-2 pl-10 pr-4 text-sm font-semibold text-[#0B1026] outline-none transition focus:border-[#B30D2D] focus:ring-2 focus:ring-[#B30D2D]/10"
              />
            </div>
          </div>

          <div className="w-40">
            <label className="block text-[10px] font-black uppercase text-[#6B7280] mb-1.5 ml-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              className="w-full rounded-xl border border-[#D8DEE8] bg-[#F8FAFC] py-2 px-3 text-sm font-semibold text-[#0B1026] outline-none transition focus:border-[#B30D2D]"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-[10px] font-black uppercase text-[#6B7280] mb-1.5 ml-1">From</label>
            <input
              type="date"
              value={paidFrom}
              onChange={(e) => { setPaidFrom(e.target.value); setPage(0); }}
              className="w-full rounded-xl border border-[#D8DEE8] bg-[#F8FAFC] py-2 px-3 text-sm font-semibold text-[#0B1026] outline-none transition focus:border-[#B30D2D]"
            />
          </div>

          <div className="w-40">
            <label className="block text-[10px] font-black uppercase text-[#6B7280] mb-1.5 ml-1">To</label>
            <input
              type="date"
              value={paidTo}
              onChange={(e) => { setPaidTo(e.target.value); setPage(0); }}
              className="w-full rounded-xl border border-[#D8DEE8] bg-[#F8FAFC] py-2 px-3 text-sm font-semibold text-[#0B1026] outline-none transition focus:border-[#B30D2D]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="grid gap-3 mb-4">
        {error && <Notice tone="error" message={error} />}
        {isLoading && <Notice message="Updating payment list..." />}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#D8DEE8] bg-white shadow-sm">
        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#D8DEE8]">
              {["Code", "Member", "Item", "Amount", "Status", "Provider", "Paid At", "Actions"].map((h) => (
                <th key={h} className="px-6 py-4 font-black uppercase tracking-wider text-[#6B7280] text-[10px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8DEE8]">
            {payments.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-[#59637A] font-medium italic">
                  No payments found matching your filters.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.paymentId} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-[10px] font-bold text-[#0B1026] bg-[#F1F5F9] px-2 py-1 rounded">
                      {p.paymentCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#0B1026]">{p.memberName}</div>
                    <div className="text-[10px] font-semibold text-[#6B7280]">{p.memberEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#0B1026] truncate max-w-[180px]" title={p.itemTitle}>
                      {p.itemTitle}
                    </div>
                    <div className="text-[10px] font-black uppercase text-[#6B7280]">{p.purpose.replace(/_/g, " ")}</div>
                  </td>
                  <td className="px-6 py-4 font-black text-[#0B1026]">
                    {formatCurrency(p.amount, p.currency)}
                  </td>
                  <td className="px-6 py-4">
                    {statusBadge(p.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-black uppercase text-[#0066FF]">{p.provider}</div>
                    <div className="text-[10px] font-mono text-[#6B7280] truncate max-w-[100px]" title={p.providerTransactionId ?? ""}>
                      {p.providerTransactionId || "–"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#59637A] font-semibold">
                    {p.paidAt ? formatDateTime(p.paidAt) : "–"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/payments/receipts/${p.paymentCode}`}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-[#F8FAFC] border border-[#D8DEE8] text-[#0B1026] transition hover:border-[#B30D2D] hover:text-[#B30D2D]"
                        title="View Receipt"
                      >
                        <Icon name="file-text" size={16} />
                      </Link>
                      <Link
                        href={`/admin/members/${p.memberId}`}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-[#F8FAFC] border border-[#D8DEE8] text-[#0B1026] transition hover:border-[#B30D2D] hover:text-[#B30D2D]"
                        title="View Member"
                      >
                        <Icon name="user" size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D8DEE8] bg-white px-4 py-2 text-xs font-black text-[#0B1026] transition hover:border-[#B30D2D] disabled:opacity-40"
        >
          <Icon name="chevron-left" size={16} />
          Previous
        </button>
        <span className="text-xs font-black text-[#6B7280]">PAGE {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={payments.length < 20 || isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D8DEE8] bg-white px-4 py-2 text-xs font-black text-[#0B1026] transition hover:border-[#B30D2D] disabled:opacity-40"
        >
          Next
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    </CatalogShell>
  );
}

function statusBadge(status: string) {
  switch (status) {
    case "SUCCESS":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-black text-[#059669] uppercase">
          <Icon name="check" size={10} />
          Success
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-black text-[#D97706] uppercase">
          <Icon name="clock" size={10} />
          Pending
        </span>
      );
    case "FAILED":
    case "CANCELLED":
    case "EXPIRED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[10px] font-black text-[#DC2626] uppercase">
          <Icon name="x" size={10} />
          {status.toLowerCase()}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-black text-[#64748B] uppercase">
          {status}
        </span>
      );
  }
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
