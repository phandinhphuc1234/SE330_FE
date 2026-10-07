"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogShell, Notice } from "@/features/catalog/components/CatalogShell";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { HoldRecord } from "../types/circulation.type";
import { cancelHold, getMyHolds } from "../services/circulationService";
import { formatDate, recordId, statusLabel, titleOf } from "./circulationHelpers";

const copy = {
  en: {
    eyebrow: "My holds",
    title: "Reserved and queued books",
    description: "Follow active reservations and review completed pickup history from one place.",
    loading: "Loading holds...",
    loadError: "Could not load holds.",
    cancelConfirm: "Cancel this hold?",
    cancelled: "Hold was cancelled.",
    cancelError: "Could not cancel hold.",
    activeTab: "Active holds",
    historyTab: "History",
    emptyActive: "No active holds right now.",
    emptyHistory: "No hold history found.",
    headings: ["Book", "Status", "Queue", "Assigned barcode", "Placed", "Pickup expires", "Action"],
    cancelling: "Cancelling",
    cancel: "Cancel",
    viewLoan: "View loan",
    reserveAgain: "Reserve again",
    expired: "Expired",
    noAction: "No action",
  },
  vi: {
    eyebrow: "Lượt đặt giữ",
    title: "Sách đã đặt giữ và đang xếp hàng",
    description: "Theo dõi lượt giữ đang hoạt động và xem lại lịch sử nhận sách.",
    loading: "Đang tải lượt đặt giữ...",
    loadError: "Không thể tải danh sách đặt giữ.",
    cancelConfirm: "Bạn muốn hủy lượt giữ này?",
    cancelled: "Đã hủy lượt giữ.",
    cancelError: "Không thể hủy lượt giữ.",
    activeTab: "Đang hoạt động",
    historyTab: "Lịch sử",
    emptyActive: "Hiện không có lượt giữ đang hoạt động.",
    emptyHistory: "Chưa có lịch sử đặt giữ.",
    headings: ["Sách", "Trạng thái", "Hàng đợi", "Mã bản sao", "Ngày đặt", "Hết hạn nhận", "Thao tác"],
    cancelling: "Đang hủy",
    cancel: "Hủy",
    viewLoan: "Xem lượt mượn",
    reserveAgain: "Đặt lại",
    expired: "Đã hết hạn",
    noAction: "Không có thao tác",
  },
};

export function UserHoldsPage() {
  const { locale } = useLanguage();
  const text = copy[locale];
  const { accessToken, refresh } = useAuth();
  const [holds, setHolds] = useState<HoldRecord[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingHoldId, setCancellingHoldId] = useState("");
  const [holdView, setHoldView] = useState<"active" | "history">("active");
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);
  const visibleHolds = useMemo(() => holds.filter((hold) => !isCancelledHold(hold)), [holds]);
  const activeHolds = useMemo(() => visibleHolds.filter(canCancelHold), [visibleHolds]);
  const historyHolds = useMemo(() => visibleHolds.filter((hold) => !canCancelHold(hold)), [visibleHolds]);
  const displayedHolds = holdView === "active" ? activeHolds : historyHolds;
  const emptyMessage = holdView === "active" ? text.emptyActive : text.emptyHistory;

  useEffect(() => {
    let isMounted = true;
    getMyHolds(accessToken, refreshAccessToken)
      .then((items) => {
        if (isMounted) {
          setHolds((items ?? []).filter((hold) => !isCancelledHold(hold)));
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

  async function handleCancel(holdId: string) {
    if (!holdId || cancellingHoldId) return;
    if (!window.confirm(text.cancelConfirm)) return;

    try {
      setCancellingHoldId(holdId);
      await cancelHold(holdId, accessToken, refreshAccessToken);
      setHolds((currentHolds) => currentHolds.filter((hold) => recordId(hold) !== holdId));
      setMessage(text.cancelled);
      setError("");
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : text.cancelError);
    } finally {
      setCancellingHoldId("");
    }
  }

  return (
    <CatalogShell
      protectedPage
      eyebrow={text.eyebrow}
      title={text.title}
      description={text.description}
    >
      <div className="grid gap-3">
        {isLoading ? <Notice message={text.loading} /> : null}
        {message ? <Notice tone="success" message={message} /> : null}
        {error ? <Notice tone="error" message={error} /> : null}
      </div>
      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-[#DED5C8] bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setHoldView("active")}
          className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
            holdView === "active"
              ? "bg-[#2B2723] text-white shadow-lg shadow-[#2B2723]/15"
              : "text-[#5F574F] hover:bg-[#F7F3EA] hover:text-[#2B2723]"
          }`}
        >
          {text.activeTab}
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${holdView === "active" ? "bg-white/15 text-white" : "bg-[#DED5C8] text-[#2B2723]"}`}>
            {activeHolds.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setHoldView("history")}
          className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
            holdView === "history"
              ? "bg-[#2B2723] text-white shadow-lg shadow-[#2B2723]/15"
              : "text-[#5F574F] hover:bg-[#F7F3EA] hover:text-[#2B2723]"
          }`}
        >
          {text.historyTab}
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${holdView === "history" ? "bg-white/15 text-white" : "bg-[#DED5C8] text-[#2B2723]"}`}>
            {historyHolds.length}
          </span>
        </button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-[#DED5C8]">
        <table className="w-full min-w-[980px] border-collapse bg-white text-left text-sm">
          <thead className="bg-[#2B2723] text-white">
            <tr>{text.headings.map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {displayedHolds.map((hold) => {
              const id = recordId(hold);
              const isCancelling = cancellingHoldId === id;
              const canCancel = canCancelHold(hold);
              const fallbackAction = holdFallbackAction(hold, locale);
              return (
                <tr key={id} className={`border-t border-[#DED5C8] transition ${isCancelling ? "bg-rose-50/45" : "hover:bg-[#F7F3EA]"}`}>
                  <td className="px-4 py-4 font-bold text-[#2B2723]">{titleOf(hold)}</td>
                  <td className="px-4 py-4">{statusLabel(hold.status, locale)}</td>
                  <td className="px-4 py-4">{hold.queuePosition ?? "-"}</td>
                  <td className="px-4 py-4">{hold.assignedBarcode ?? hold.barcode ?? "-"}</td>
                  <td className="px-4 py-4">{formatDate(hold.placedAt ?? hold.createdAt, locale)}</td>
                  <td className="px-4 py-4">{formatDate(hold.pickupExpiresAt ?? hold.expiresAt, locale)}</td>
                  <td className="px-4 py-4">
                    {canCancel ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(id)}
                        disabled={!id || Boolean(cancellingHoldId)}
                        className="group relative inline-flex min-w-28 items-center justify-center gap-2 overflow-hidden rounded-full border border-rose-200 bg-white px-4 py-2 font-bold text-rose-700 shadow-sm outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:shadow-lg hover:shadow-rose-200/50 active:translate-y-0 active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:shadow-sm"
                      >
                        <span className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-rose-200/35 opacity-0 transition-all duration-500 group-hover:left-[125%] group-hover:opacity-100" />
                        {isCancelling ? (
                          <span className="relative inline-flex items-center gap-2">
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-300 border-t-rose-700" />
                            {text.cancelling}
                          </span>
                        ) : (
                          <span className="relative inline-flex items-center gap-2">
                            {text.cancel}
                            <span aria-hidden="true" className="transition-transform duration-200 group-hover:rotate-90 group-hover:scale-110">
                              ×
                            </span>
                          </span>
                        )}
                      </button>
                    ) : fallbackAction.href ? (
                      <Link
                        href={fallbackAction.href}
                        className={`inline-flex min-w-28 items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-md ${fallbackAction.className}`}
                      >
                        {fallbackAction.label}
                      </Link>
                    ) : (
                      <span className={`inline-flex min-w-28 items-center justify-center rounded-full border px-4 py-2 text-sm font-bold ${fallbackAction.className}`}>
                        {fallbackAction.label}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!isLoading && !displayedHolds.length ? <div className="mt-5"><Notice message={emptyMessage} /></div> : null}
    </CatalogShell>
  );
}

function isCancelledHold(hold: HoldRecord) {
  const status = normalizeHoldStatus(hold);
  return status === "CANCELLED" || status === "CANCELED" || status === "CANCELLED_BY_MEMBER";
}

function canCancelHold(hold: HoldRecord) {
  const status = normalizeHoldStatus(hold);
  return status === "WAITING" || status === "READY_FOR_PICKUP" || status === "NOTIFIED";
}

function normalizeHoldStatus(hold: HoldRecord) {
  return hold.status?.trim().toUpperCase();
}

function holdFallbackAction(hold: HoldRecord, locale: "en" | "vi") {
  const status = normalizeHoldStatus(hold);
  const text = copy[locale];
  if (status === "FULFILLED") {
    return {
      label: text.viewLoan,
      href: "/user/loans",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100",
    };
  }
  if (status === "EXPIRED" && hold.bookId) {
    return {
      label: text.reserveAgain,
      href: `/books/${hold.bookId}`,
      className: "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100",
    };
  }
  if (status === "EXPIRED") {
    return {
      label: text.expired,
      href: "",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }
  return {
    label: text.noAction,
    href: "",
    className: "border-[#D8CCBC] bg-[#F7F3EA] text-[#776D63]",
  };
}
