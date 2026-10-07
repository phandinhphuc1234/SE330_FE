"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TableSkeleton } from "@/components/ui/TableRowSkeleton";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasStaffAccessFromToken } from "@/features/auth/utils/authRoles";
import { CatalogShell, Notice, SecondaryAction } from "@/features/catalog/components/CatalogShell";
import { StaffLoanRecord, StaffLoanSearchParams, StaffPageResult } from "../types/circulation.type";
import { searchStaffLoans } from "../services/circulationService";
import { StaffLoanTable, StaffPagination } from "./StaffLoanTable";

const STAFF_PAGE_SIZE = "20";

function createLoanFilters(): StaffLoanSearchParams {
  return {
    openOnly: "true",
    page: "0",
    size: STAFF_PAGE_SIZE,
  };
}

export function StaffLoansPage() {
  const { accessToken, hasStaffAccess, refresh } = useAuth();
  const [filters, setFilters] = useState<StaffLoanSearchParams>(() => createLoanFilters());
  const [result, setResult] = useState<StaffPageResult<StaffLoanRecord>>({ items: [], page: 0, totalPages: 1, totalElements: 0 });
  const [loans, setLoans] = useState<StaffLoanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const filterFormRef = useRef<HTMLFormElement | null>(null);
  const filterTimerRef = useRef<number | null>(null);
  const canUseStaffApi = hasStaffAccess || hasStaffAccessFromToken(accessToken);
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  useEffect(() => {
    if (!canUseStaffApi) {
      return;
    }

    let isMounted = true;
    const loadingTimerId = window.setTimeout(() => {
      if (isMounted) {
        setIsLoading(true);
      }
    }, 0);

    searchStaffLoans(filters, accessToken, refreshAccessToken)
      .then((page) => {
        if (!isMounted) return;
        setLoans(page.items);
        setResult(page);
        setError("");
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Could not load staff loans.");
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
  }, [accessToken, canUseStaffApi, filters, refreshAccessToken]);

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
    return loans.length >= pageSize ? currentPage + 2 : currentPage + 1;
  }, [currentPage, loans.length, pageSize, result.totalPages]);

  const pageStats = useMemo(() => {
    return {
      visible: loans.length,
      overdue: loans.filter((loan) => loan.overdue || loan.status === "OVERDUE").length,
      open: loans.filter((loan) => ["BORROWED", "OVERDUE", "LOST", "ACTIVE"].includes((loan.status ?? "").toUpperCase())).length,
    };
  }, [loans]);

  function buildFilters(form: HTMLFormElement, page = "0"): StaffLoanSearchParams {
    const formData = new FormData(form);
    const scope = String(formData.get("scope") ?? "open");

    return {
      q: String(formData.get("q") ?? ""),
      status: String(formData.get("status") ?? ""),
      openOnly: scope === "open" ? "true" : "",
      overdue: scope === "overdue" ? "true" : "",
      dueFrom: String(formData.get("dueFrom") ?? ""),
      dueTo: String(formData.get("dueTo") ?? ""),
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
    }, 350);
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
      eyebrow="Staff loans"
      title="Loan activity monitor"
      description="Search physical loans and ebook access by member, title, ISBN, or barcode, then focus on open, overdue, or historical records."
      actions={
        <>
          <SecondaryAction href="/staff/members">Borrowers</SecondaryAction>
          <SecondaryAction href="/staff/circulation">Circulation desk</SecondaryAction>
        </>
      }
    >
      {!canUseStaffApi ? <Notice tone="error" message="This workspace requires LIBRARIAN or ADMIN access." /> : null}

      <form ref={filterFormRef} onSubmit={handleSubmit} onChange={handleFilterChange} className="rounded-2xl border border-[#DED5C8] bg-[#F7F3EA] p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(320px,2fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)]">
          <label className="relative min-w-0">
            <span className="sr-only">Search loans</span>
            <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7A263A]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
              </svg>
            </span>
            <input name="q" placeholder="Search member, title, ISBN, barcode..." className="h-14 w-full rounded-xl border border-[#D8CCBC] bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#7A263A]" />
          </label>
          <select name="scope" defaultValue="open" className="h-14 rounded-xl border border-[#D8CCBC] bg-white px-4 text-sm font-semibold text-[#2B2723] outline-none transition focus:border-[#7A263A]">
            <option value="open">Open loans</option>
            <option value="overdue">Overdue only</option>
            <option value="all">All history</option>
          </select>
          <select name="status" className="h-14 rounded-xl border border-[#D8CCBC] bg-white px-4 text-sm font-semibold text-[#2B2723] outline-none transition focus:border-[#7A263A]">
            <option value="">Any status</option>
            <option value="BORROWED">Borrowed</option>
            <option value="OVERDUE">Overdue</option>
            <option value="RETURNED">Returned</option>
            <option value="LOST">Lost</option>
            <option value="ACTIVE">Active ebook</option>
            <option value="EXPIRED">Expired ebook</option>
            <option value="REVOKED">Revoked ebook</option>
          </select>
          <input name="dueFrom" type="date" aria-label="Due from" className="h-14 rounded-xl border border-[#D8CCBC] bg-white px-4 text-sm outline-none transition focus:border-[#7A263A]" />
          <input name="dueTo" type="date" aria-label="Due to" className="h-14 rounded-xl border border-[#D8CCBC] bg-white px-4 text-sm outline-none transition focus:border-[#7A263A]" />
        </div>
      </form>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <MetricCard label="Visible loans" value={String(pageStats.visible)} />
        <MetricCard label="Open loans/access" value={String(pageStats.open)} />
        <MetricCard label="Overdue in view" value={String(pageStats.overdue)} tone={pageStats.overdue ? "danger" : "normal"} />
      </div>

      {error ? <div className="mt-5"><Notice tone="error" message={error} /></div> : null}

      {isLoading ? (
        <div className="mt-6">
          <TableSkeleton rows={8} columns={11} />
        </div>
      ) : (
        <div className="mt-6">
          <StaffLoanTable loans={loans} />
          <StaffPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </CatalogShell>
  );
}

function MetricCard({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "danger" }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "danger" ? "border-rose-200 bg-rose-50" : "border-[#DED5C8] bg-white"}`}>
      <p className={`text-xs font-bold uppercase tracking-wide ${tone === "danger" ? "text-rose-700" : "text-[#7A263A]"}`}>{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#2B2723]">{value}</p>
    </div>
  );
}
