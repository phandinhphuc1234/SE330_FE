"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TableSkeleton } from "@/components/ui/TableRowSkeleton";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasStaffAccessFromToken } from "@/features/auth/utils/authRoles";
import { CatalogShell, Notice, SecondaryAction } from "@/features/catalog/components/CatalogShell";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { StaffHoldRecord, StaffHoldSearchParams, StaffPageResult } from "../types/circulation.type";
import { searchStaffHolds } from "../services/circulationService";
import { formatDate, statusLabel } from "./circulationHelpers";
import { StaffPagination } from "./StaffLoanTable";

const STAFF_PAGE_SIZE = "20";

function createHoldFilters(): StaffHoldSearchParams {
  return {
    status: "READY_FOR_PICKUP",
    page: "0",
    size: STAFF_PAGE_SIZE,
  };
}

const copy = {
  en: {
    loadError: "Could not load staff holds.",
    eyebrow: "Staff holds",
    title: "Reservation queue",
    description: "Review reservation status across the system and jump straight into reserved pickup checkout.",
    reservedPickup: "Reserved pickup",
    circulationDesk: "Circulation desk",
    accessDenied: "This workspace requires LIBRARIAN or ADMIN access.",
    showingPrefix: "Showing",
    showingSuffix: "holds",
    metrics: ["Visible holds", "Ready in view", "Assigned copies"],
    empty: "No holds found for this filter.",
    headings: ["Member", "Book", "Status", "Queue", "Assigned copy", "Reserved", "Notified", "Expires", "Action"],
    member: "Member",
    openCopies: "Open physical copies",
    copyNumber: "Copy",
    checkout: "Checkout",
    noDeskAction: "No desk action",
    statuses: {
      visible: "visible",
      READY_FOR_PICKUP: "ready for pickup",
      WAITING: "waiting",
      FULFILLED: "fulfilled",
      EXPIRED: "expired",
    },
  },
  vi: {
    loadError: "Không thể tải hàng đợi đặt giữ.",
    eyebrow: "Đặt giữ của staff",
    title: "Hàng đợi đặt giữ",
    description: "Xem trạng thái đặt giữ toàn hệ thống và đi thẳng tới pickup checkout khi sách sẵn sàng.",
    reservedPickup: "Nhận sách đặt giữ",
    circulationDesk: "Quầy lưu thông",
    accessDenied: "Khu vực này yêu cầu quyền LIBRARIAN hoặc ADMIN.",
    showingPrefix: "Đang hiển thị",
    showingSuffix: "lượt giữ",
    metrics: ["Lượt giữ hiển thị", "Sẵn sàng trong trang", "Bản sao đã gán"],
    empty: "Không tìm thấy lượt giữ phù hợp bộ lọc.",
    headings: ["Thành viên", "Sách", "Trạng thái", "Hàng đợi", "Bản sao đã gán", "Ngày đặt", "Đã báo", "Hết hạn", "Thao tác"],
    member: "Thành viên",
    openCopies: "Mở bản sao vật lý",
    copyNumber: "Bản sao",
    checkout: "Checkout",
    noDeskAction: "Không có thao tác quầy",
    statuses: {
      visible: "đang hiển thị",
      READY_FOR_PICKUP: "sẵn sàng nhận",
      WAITING: "đang chờ",
      FULFILLED: "đã nhận",
      EXPIRED: "đã hết hạn",
    },
  },
};

export function StaffHoldsPage() {
  const { locale } = useLanguage();
  const text = copy[locale];
  const { accessToken, hasStaffAccess, refresh } = useAuth();
  const [filters, setFilters] = useState<StaffHoldSearchParams>(() => createHoldFilters());
  const [result, setResult] = useState<StaffPageResult<StaffHoldRecord>>({ items: [], page: 0, totalPages: 1, totalElements: 0 });
  const [holds, setHolds] = useState<StaffHoldRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const filterFormRef = useRef<HTMLFormElement | null>(null);
  const filterTimerRef = useRef<number | null>(null);
  const canUseStaffApi = hasStaffAccess || hasStaffAccessFromToken(accessToken);
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  useEffect(() => {
    if (!canUseStaffApi) return;

    let isMounted = true;
    const loadingTimerId = window.setTimeout(() => {
      if (isMounted) {
        setIsLoading(true);
      }
    }, 0);

    searchStaffHolds(filters, accessToken, refreshAccessToken)
      .then((page) => {
        if (!isMounted) return;
        const visibleHolds = page.items.filter((hold) => !isCancelledHold(hold));
        setHolds(visibleHolds);
        setResult({ ...page, items: visibleHolds });
        setError("");
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : text.loadError);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      window.clearTimeout(loadingTimerId);
    };
  }, [accessToken, canUseStaffApi, filters, refreshAccessToken, text.loadError]);

  useEffect(() => {
    return () => {
      if (filterTimerRef.current) {
        window.clearTimeout(filterTimerRef.current);
      }
    };
  }, []);

  const currentPage = Number(result.page ?? filters.page ?? 0);
  const pageSize = Number(result.size ?? filters.size ?? STAFF_PAGE_SIZE);
  const totalPages = useMemo(() => {
    if (result.totalPages) return result.totalPages;
    return holds.length >= pageSize ? currentPage + 2 : currentPage + 1;
  }, [currentPage, holds.length, pageSize, result.totalPages]);

  const pageStats = useMemo(() => {
    return {
      visible: holds.length,
      ready: holds.filter((hold) => normalizeStatus(hold.status) === "READY_FOR_PICKUP").length,
      assigned: holds.filter((hold) => hold.assignedCopyId || hold.assignedCopyBarcode || hold.assignedBarcode || hold.barcode).length,
    };
  }, [holds]);

  function buildFilters(form: HTMLFormElement, page = "0"): StaffHoldSearchParams {
    const formData = new FormData(form);

    return {
      status: String(formData.get("status") ?? ""),
      page,
      size: STAFF_PAGE_SIZE,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (filterTimerRef.current) {
      window.clearTimeout(filterTimerRef.current);
      filterTimerRef.current = null;
    }

    setFilters(buildFilters(event.currentTarget));
  }

  function handleFilterChange() {
    const form = filterFormRef.current;
    if (!form) return;

    if (filterTimerRef.current) {
      window.clearTimeout(filterTimerRef.current);
    }

    filterTimerRef.current = window.setTimeout(() => {
      setFilters(buildFilters(form));
      filterTimerRef.current = null;
    }, 250);
  }

  function handlePageChange(page: number) {
    const form = filterFormRef.current;
    const nextPage = String(Math.max(0, page));

    if (!form) {
      setFilters((current) => ({ ...current, page: nextPage }));
      return;
    }

    if (filterTimerRef.current) {
      window.clearTimeout(filterTimerRef.current);
      filterTimerRef.current = null;
    }

    setFilters(buildFilters(form, nextPage));
  }

  return (
    <CatalogShell
      protectedPage
      wide
      eyebrow={text.eyebrow}
      title={text.title}
      description={text.description}
      actions={
        <>
          <SecondaryAction href="/staff/holds/pickup">{text.reservedPickup}</SecondaryAction>
          <SecondaryAction href="/staff/circulation">{text.circulationDesk}</SecondaryAction>
        </>
      }
    >
      {!canUseStaffApi ? <Notice tone="error" message={text.accessDenied} /> : null}

      <form ref={filterFormRef} onSubmit={handleSubmit} onChange={handleFilterChange} className="rounded-2xl border border-[#DED5C8] bg-[#F7F3EA] p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(260px,0.5fr)_1fr]">
          <select name="status" defaultValue="READY_FOR_PICKUP" className="h-14 rounded-xl border border-[#D8CCBC] bg-white px-4 text-sm font-semibold text-[#2B2723] outline-none transition focus:border-[#7A263A]">
            <option value="READY_FOR_PICKUP">{statusLabel("READY_FOR_PICKUP", locale)}</option>
            <option value="WAITING">{statusLabel("WAITING", locale)}</option>
            <option value="FULFILLED">{statusLabel("FULFILLED", locale)}</option>
            <option value="EXPIRED">{statusLabel("EXPIRED", locale)}</option>
          </select>
          <div className="flex items-center rounded-xl border border-[#D8CCBC] bg-white px-4 text-sm font-semibold text-[#5F574F]">
            {text.showingPrefix} {holdStatusLabel(filters.status, locale)} {text.showingSuffix}
          </div>
        </div>
      </form>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <MetricCard label={text.metrics[0]} value={String(pageStats.visible)} />
        <MetricCard label={text.metrics[1]} value={String(pageStats.ready)} tone={pageStats.ready ? "success" : "normal"} />
        <MetricCard label={text.metrics[2]} value={String(pageStats.assigned)} />
      </div>

      {error ? <div className="mt-5"><Notice tone="error" message={error} /></div> : null}

      {isLoading ? (
        <div className="mt-6">
          <TableSkeleton rows={8} columns={9} />
        </div>
      ) : (
        <div className="mt-6">
          <StaffHoldTable holds={holds} />
          <StaffPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </CatalogShell>
  );
}

function StaffHoldTable({ holds }: { holds: StaffHoldRecord[] }) {
  const { locale } = useLanguage();
  const text = copy[locale];

  if (!holds.length) {
    return (
      <div className="rounded-xl border border-[#DED5C8] bg-[#F7F3EA] p-5 text-sm font-semibold text-[#5F574F]">
        {text.empty}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#DED5C8]">
      <table className="w-full min-w-[1180px] border-collapse bg-white text-left text-sm">
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
          {holds.map((hold) => {
            const holdId = idOf(hold.holdId ?? hold.id);
            const memberId = idOf(hold.memberId);
            const bookId = idOf(hold.bookId);
            const status = normalizeStatus(hold.status);

            return (
              <tr key={holdId || `${memberId}-${bookId}-${hold.queuePosition ?? "queue"}`} className="border-t border-[#DED5C8] align-top transition hover:bg-[#F7F3EA]">
                <td className="px-4 py-4">
                  <div className="font-bold text-[#2B2723]">
                    {memberId ? (
                      <Link href={`/staff/members/${memberId}`} className="hover:text-[#7A263A]">
                        {hold.memberName || `${text.member} ${memberId}`}
                      </Link>
                    ) : (
                      hold.memberName || "-"
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#5F574F]/75">{hold.memberEmail || "-"}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="font-bold text-[#2B2723]">{hold.bookTitle ?? hold.title ?? "-"}</div>
                  {bookId ? (
                    <Link href={`/staff/books/${bookId}/copies`} className="mt-1 inline-flex text-xs font-bold text-[#7A263A] hover:text-[#7A263A]">
                      {text.openCopies}
                    </Link>
                  ) : null}
                </td>
                <td className="px-4 py-4"><HoldStatusBadge status={hold.status} /></td>
                <td className="px-4 py-4 font-semibold text-[#5F574F]">{hold.queuePosition ?? "-"}</td>
                <td className="px-4 py-4">
                  <p className="font-mono text-xs font-semibold text-[#5F574F]">{hold.assignedCopyBarcode ?? hold.assignedBarcode ?? hold.barcode ?? "-"}</p>
                  {hold.assignedCopyId ? <p className="mt-1 text-xs font-bold text-[#7A263A]">{text.copyNumber} #{hold.assignedCopyId}</p> : null}
                </td>
                <td className="px-4 py-4 text-[#5F574F]">{formatDate(hold.reservedAt, locale)}</td>
                <td className="px-4 py-4 text-[#5F574F]">{formatDate(hold.notifiedAt, locale)}</td>
                <td className="px-4 py-4 text-[#5F574F]">{formatDate(hold.expiresAt, locale)}</td>
                <td className="px-4 py-4">
                  {holdId && status === "READY_FOR_PICKUP" ? (
                    <Link href={`/staff/holds/pickup?holdId=${holdId}`} className="inline-flex rounded-full bg-[#7A263A] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                      {text.checkout}
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-[#5F574F]/70">{text.noDeskAction}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HoldStatusBadge({ status }: { status?: string }) {
  const { locale } = useLanguage();
  const normalizedStatus = normalizeStatus(status) || "UNKNOWN";
  const classes =
    normalizedStatus === "READY_FOR_PICKUP"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalizedStatus === "EXPIRED" || normalizedStatus.includes("CANCEL")
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : normalizedStatus === "FULFILLED"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-[#D8CCBC] bg-[#F7F3EA] text-[#5F574F]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${classes}`}>
      {statusLabel(normalizedStatus, locale)}
    </span>
  );
}

function MetricCard({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "success" }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "success" ? "border-emerald-200 bg-emerald-50" : "border-[#DED5C8] bg-white"}`}>
      <p className={`text-xs font-bold uppercase tracking-wide ${tone === "success" ? "text-emerald-700" : "text-[#7A263A]"}`}>{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#2B2723]">{value}</p>
    </div>
  );
}

function normalizeStatus(status?: string) {
  return (status ?? "").trim().toUpperCase();
}

function isCancelledHold(hold: StaffHoldRecord) {
  const status = normalizeStatus(hold.status);
  return status === "CANCELLED" || status === "CANCELED" || status === "CANCELLED_BY_MEMBER";
}

function holdStatusLabel(status: string | undefined, locale: "en" | "vi") {
  const normalizedStatus = normalizeStatus(status);
  const labels = copy[locale].statuses;

  return labels[normalizedStatus as keyof typeof labels] ?? labels.visible;
}

function idOf(value?: number | null) {
  return value === undefined || value === null ? "" : String(value);
}
