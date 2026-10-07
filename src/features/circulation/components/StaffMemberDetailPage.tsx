"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TableSkeleton } from "@/components/ui/TableRowSkeleton";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasStaffAccessFromToken } from "@/features/auth/utils/authRoles";
import { CatalogShell, Notice, SecondaryAction } from "@/features/catalog/components/CatalogShell";
import { StaffLoanRecord, StaffMemberDetail, StaffMemberLoansParams, StaffPageResult } from "../types/circulation.type";
import { getStaffMember, getStaffMemberLoans } from "../services/circulationService";
import { formatDate, money } from "./circulationHelpers";
import { StaffLoanTable, StaffPagination, StatusBadge } from "./StaffLoanTable";

const STAFF_PAGE_SIZE = "20";

type StaffMemberDetailPageProps = {
  memberId: string;
};

function createLoanFilters(): StaffMemberLoansParams {
  return {
    openOnly: "true",
    page: "0",
    size: STAFF_PAGE_SIZE,
  };
}

export function StaffMemberDetailPage({ memberId }: StaffMemberDetailPageProps) {
  const { accessToken, hasStaffAccess, refresh } = useAuth();
  const [member, setMember] = useState<StaffMemberDetail | null>(null);
  const [loans, setLoans] = useState<StaffLoanRecord[]>([]);
  const [loanFilters, setLoanFilters] = useState<StaffMemberLoansParams>(() => createLoanFilters());
  const [loanResult, setLoanResult] = useState<StaffPageResult<StaffLoanRecord>>({ items: [], page: 0, totalPages: 1, totalElements: 0 });
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [loanError, setLoanError] = useState("");
  const filterFormRef = useRef<HTMLFormElement | null>(null);
  const filterTimerRef = useRef<number | null>(null);
  const canUseStaffApi = hasStaffAccess || hasStaffAccessFromToken(accessToken);
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  useEffect(() => {
    if (!canUseStaffApi || !memberId) {
      return;
    }

    let isMounted = true;
    const loadingTimerId = window.setTimeout(() => {
      if (isMounted) {
        setIsLoadingMember(true);
      }
    }, 0);

    getStaffMember(memberId, accessToken, refreshAccessToken)
      .then((data) => {
        if (!isMounted) return;
        setMember(data);
        setMemberError("");
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setMemberError(fetchError instanceof Error ? fetchError.message : "Could not load borrower profile.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingMember(false);
        }
      });

    return () => {
      isMounted = false;
      window.clearTimeout(loadingTimerId);
    };
  }, [accessToken, canUseStaffApi, memberId, refreshAccessToken]);

  useEffect(() => {
    if (!canUseStaffApi || !memberId || !member) {
      return;
    }

    let isMounted = true;
    const loadingTimerId = window.setTimeout(() => {
      if (isMounted) {
        setIsLoadingLoans(true);
      }
    }, 0);

    if (shouldSkipLoanRequest(member, loanFilters)) {
      window.clearTimeout(loadingTimerId);
      window.setTimeout(() => {
        if (!isMounted) return;
        setLoans([]);
        setLoanResult({ items: [], page: Number(loanFilters.page ?? 0), totalPages: 1, totalElements: 0 });
        setLoanError("");
        setIsLoadingLoans(false);
      }, 0);

      return () => {
        isMounted = false;
      };
    }

    getStaffMemberLoans(memberId, loanFilters, accessToken, refreshAccessToken)
      .then((page) => {
        if (!isMounted) return;
        setLoans(page.items);
        setLoanResult(page);
        setLoanError("");
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setLoanError(fetchError instanceof Error ? fetchError.message : "Could not load borrower loans.");
        setLoans([]);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingLoans(false);
        }
      });

    return () => {
      isMounted = false;
      window.clearTimeout(loadingTimerId);
    };
  }, [accessToken, canUseStaffApi, loanFilters, member, memberId, refreshAccessToken]);

  useEffect(() => {
    return () => {
      if (filterTimerRef.current) {
        window.clearTimeout(filterTimerRef.current);
      }
    };
  }, []);

  const currentPage = Number(loanResult.page ?? loanFilters.page ?? 0);
  const pageSize = Number(loanResult.size ?? loanFilters.size ?? STAFF_PAGE_SIZE);
  const totalPages = useMemo(() => {
    if (loanResult.totalPages) return loanResult.totalPages;
    return loans.length >= pageSize ? currentPage + 2 : currentPage + 1;
  }, [currentPage, loanResult.totalPages, loans.length, pageSize]);

  function buildFilters(form: HTMLFormElement, page = "0"): StaffMemberLoansParams {
    const formData = new FormData(form);
    const scope = String(formData.get("scope") ?? "open");

    return {
      status: String(formData.get("status") ?? ""),
      openOnly: scope === "open" ? "true" : scope === "history" ? "false" : "",
      overdue: scope === "overdue" ? "true" : "",
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

    setLoanFilters(buildFilters(event.currentTarget));
  }

  function handleFilterChange() {
    const form = filterFormRef.current;
    if (!form) return;

    if (filterTimerRef.current) {
      window.clearTimeout(filterTimerRef.current);
    }

    filterTimerRef.current = window.setTimeout(() => {
      setLoanFilters(buildFilters(form));
      filterTimerRef.current = null;
    }, 250);
  }

  function handlePageChange(page: number) {
    const form = filterFormRef.current;
    const nextPage = String(Math.max(0, page));

    if (!form) {
      setLoanFilters((current) => ({ ...current, page: nextPage }));
      return;
    }

    if (filterTimerRef.current) {
      window.clearTimeout(filterTimerRef.current);
      filterTimerRef.current = null;
    }

    setLoanFilters(buildFilters(form, nextPage));
  }

  return (
    <CatalogShell
      protectedPage
      wide
      eyebrow="Borrower profile"
      title={member?.fullName || `Member ${memberId}`}
      description="Review member identity, circulation limits, open physical loans, ebook access, history, and overdue exposure from one staff view."
      actions={
        <>
          <SecondaryAction href="/staff/members">Back to borrowers</SecondaryAction>
          <SecondaryAction href="/staff/loans">Loan monitor</SecondaryAction>
        </>
      }
    >
      {!canUseStaffApi ? <Notice tone="error" message="This workspace requires LIBRARIAN or ADMIN access." /> : null}
      {memberError ? <Notice tone="error" message={memberError} /> : null}

      {isLoadingMember ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-skeleton rounded-xl bg-[#DED5C8]" />
          ))}
        </div>
      ) : member ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-[#DED5C8] bg-[#F7F3EA] p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#7A263A]">Member identity</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#2B2723]">{member.fullName || `Member ${memberId}`}</h2>
                  <p className="mt-2 text-sm font-semibold text-[#5F574F]">{member.email || "-"}</p>
                  <p className="mt-1 text-sm text-[#5F574F]/75">{member.phone || "-"}</p>
                </div>
                <StatusBadge status={member.status} />
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <Metric label="Role" value={member.role || "-"} />
                <Metric label="Borrow limit" value={String(member.maxBorrowLimit ?? "-")} />
                <Metric label="Membership expires" value={formatDate(member.membershipExpiresAt)} />
                <Metric label="Joined" value={formatDate(member.createdAt)} />
              </dl>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryCard label="Open loans/access" value={String(member.openLoansCount ?? member.activeLoansCount ?? 0)} />
              <SummaryCard label="Overdue loans" value={String(member.overdueLoansCount ?? 0)} danger={(member.overdueLoansCount ?? 0) > 0} />
              <SummaryCard label="Loan records" value={String(member.borrowHistoryCount ?? 0)} />
              <SummaryCard label="Unpaid fines" value={money(member.unpaidFineTotal)} danger={(member.unpaidFineTotal ?? 0) > 0} />
            </div>
          </section>

          <form ref={filterFormRef} onSubmit={handleSubmit} onChange={handleFilterChange} className="mt-6 rounded-2xl border border-[#DED5C8] bg-[#F7F3EA] p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(180px,0.8fr)_minmax(180px,0.8fr)]">
              <select name="scope" defaultValue="open" className="h-14 rounded-xl border border-[#D8CCBC] bg-white px-4 text-sm font-semibold text-[#2B2723] outline-none transition focus:border-[#7A263A]">
                <option value="open">Open loans</option>
                <option value="overdue">Overdue only</option>
                <option value="history">All loan records</option>
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
            </div>
          </form>

          <div className="mt-6">
            {isLoadingLoans ? (
              <TableSkeleton rows={6} columns={11} />
            ) : (
              <>
                {loanError ? <div className="mb-4"><Notice tone="error" message={loanError} /></div> : null}
                <StaffLoanTable loans={loans} emptyMessage="No loans found for this borrower and filter." />
                <StaffPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </>
            )}
          </div>
        </>
      ) : (
        <Notice message="Borrower profile was not found." />
      )}
    </CatalogShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#DED5C8] bg-white p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-[#7A263A]">{label}</dt>
      <dd className="mt-2 font-semibold text-[#2B2723]">{value}</dd>
    </div>
  );
}

function SummaryCard({ danger = false, label, value }: { danger?: boolean; label: string; value: string }) {
  return (
    <div className={`rounded-xl border p-4 ${danger ? "border-rose-200 bg-rose-50" : "border-[#DED5C8] bg-white"}`}>
      <p className={`text-xs font-bold uppercase tracking-wide ${danger ? "text-rose-700" : "text-[#7A263A]"}`}>{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#2B2723]">{value}</p>
    </div>
  );
}

function shouldSkipLoanRequest(member: StaffMemberDetail, filters: StaffMemberLoansParams) {
  const openCount = member.openLoansCount ?? member.activeLoansCount ?? 0;
  const overdueCount = member.overdueLoansCount ?? 0;
  const historyCount = member.borrowHistoryCount ?? 0;
  const status = filters.status ?? "";

  if (filters.overdue === "true") {
    return overdueCount === 0;
  }

  if (filters.openOnly === "false") {
    if (status === "RETURNED") {
      return historyCount === 0;
    }

    if (status === "OVERDUE") {
      return overdueCount === 0;
    }

    if (["BORROWED", "LOST", "ACTIVE", "EXPIRED", "REVOKED"].includes(status)) {
      return openCount === 0;
    }

    return openCount === 0 && historyCount === 0;
  }

  if (filters.openOnly === "true") {
    if (status === "OVERDUE") {
      return overdueCount === 0;
    }

    if (["", "BORROWED", "LOST", "ACTIVE"].includes(status)) {
      return openCount === 0;
    }
  }

  if (status === "RETURNED") {
    return historyCount === 0;
  }

  return false;
}
