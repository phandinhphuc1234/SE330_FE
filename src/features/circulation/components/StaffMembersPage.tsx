"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TableSkeleton } from "@/components/ui/TableRowSkeleton";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasStaffAccessFromToken } from "@/features/auth/utils/authRoles";
import { CatalogShell, Notice, SecondaryAction } from "@/features/catalog/components/CatalogShell";
import { StaffMemberSearchParams, StaffMemberSummary, StaffPageResult } from "../types/circulation.type";
import { searchStaffMembers } from "../services/circulationService";
import { formatDate, money } from "./circulationHelpers";
import { StaffPagination, StatusBadge } from "./StaffLoanTable";

const STAFF_PAGE_SIZE = "20";

function createMemberFilters(): StaffMemberSearchParams {
  return {
    page: "0",
    size: STAFF_PAGE_SIZE,
  };
}

export function StaffMembersPage() {
  const { accessToken, hasStaffAccess, refresh } = useAuth();
  const [filters, setFilters] = useState<StaffMemberSearchParams>(() => createMemberFilters());
  const [members, setMembers] = useState<StaffMemberSummary[]>([]);
  const [result, setResult] = useState<StaffPageResult<StaffMemberSummary>>({ items: [], page: 0, totalPages: 1, totalElements: 0 });
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

    searchStaffMembers(filters, accessToken, refreshAccessToken)
      .then((page) => {
        if (!isMounted) return;
        setMembers(page.items);
        setResult(page);
        setError("");
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Could not load members.");
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
    return members.length >= pageSize ? currentPage + 2 : currentPage + 1;
  }, [currentPage, members.length, pageSize, result.totalPages]);
  const pageStats = useMemo(() => ({
    visible: members.length,
    activeLoans: members.reduce((total, member) => total + (member.activeLoansCount ?? 0), 0),
    overdueMembers: members.filter((member) => (member.overdueLoansCount ?? 0) > 0).length,
  }), [members]);

  function buildFilters(form: HTMLFormElement, page = "0"): StaffMemberSearchParams {
    const formData = new FormData(form);

    return {
      q: String(formData.get("q") ?? ""),
      status: String(formData.get("status") ?? ""),
      hasOverdue: formData.get("hasOverdue") ? "true" : "",
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
      eyebrow="Staff borrowers"
      title="Borrower registry"
      description="Search library members and review physical loan plus ebook access counts before opening a borrower profile."
      actions={
        <>
          <SecondaryAction href="/staff/loans">Loan monitor</SecondaryAction>
          <SecondaryAction href="/staff/circulation">Circulation desk</SecondaryAction>
        </>
      }
    >
      {!canUseStaffApi ? <Notice tone="error" message="This workspace requires LIBRARIAN or ADMIN access." /> : null}

      <form ref={filterFormRef} onSubmit={handleSubmit} onChange={handleFilterChange} className="rounded-2xl border border-[#DED5C8] bg-[#F7F3EA] p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(320px,2fr)_minmax(170px,0.8fr)_minmax(180px,0.9fr)]">
          <label className="relative min-w-0">
            <span className="sr-only">Search members</span>
            <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7A263A]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
              </svg>
            </span>
            <input name="q" placeholder="Search member ID, name, email, phone..." className="h-14 w-full rounded-xl border border-[#D8CCBC] bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#7A263A]" />
          </label>
          <select name="status" className="h-14 rounded-xl border border-[#D8CCBC] bg-white px-4 text-sm font-semibold text-[#2B2723] outline-none transition focus:border-[#7A263A]">
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_VERIFICATION">Pending verification</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <label className="flex h-14 items-center justify-center gap-2 rounded-xl border border-[#D8CCBC] bg-white px-4 text-sm font-bold text-[#2B2723]">
            <input name="hasOverdue" type="checkbox" className="h-4 w-4 accent-[#7A263A]" />
            Has overdue loans
          </label>
        </div>
      </form>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <MetricCard label="Visible borrowers" value={String(pageStats.visible)} />
        <MetricCard label="Active loans/access" value={String(pageStats.activeLoans)} />
        <MetricCard label="Overdue borrowers" value={String(pageStats.overdueMembers)} tone={pageStats.overdueMembers ? "danger" : "normal"} />
      </div>

      {error ? <div className="mt-5"><Notice tone="error" message={error} /></div> : null}

      {isLoading ? (
        <div className="mt-6">
          <TableSkeleton rows={8} columns={8} />
        </div>
      ) : (
        <div className="mt-6">
          <MembersTable members={members} />
          <StaffPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </CatalogShell>
  );
}

function MembersTable({ members }: { members: StaffMemberSummary[] }) {
  if (!members.length) {
    return (
      <div className="rounded-xl border border-[#DED5C8] bg-[#F7F3EA] p-5 text-sm font-semibold text-[#5F574F]">
        No borrower records found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#DED5C8]">
      <table className="w-full min-w-[1060px] border-collapse bg-white text-left text-sm">
        <thead className="bg-[#2B2723] text-white">
          <tr>
            {["Borrower", "Contact", "Role", "Status", "Loans/access", "Holds", "Unpaid fines", "Action"].map((heading) => (
              <th key={heading} className="px-4 py-3 font-bold">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const id = memberIdOf(member);

            return (
              <tr key={id || member.email} className="border-t border-[#DED5C8] align-top transition hover:bg-[#F7F3EA]">
                <td className="px-4 py-4">
                  <p className="font-bold text-[#2B2723]">{member.fullName || `Member ${id}`}</p>
                  <p className="mt-1 text-xs font-semibold text-[#5F574F]/70">ID {id || "-"}</p>
                  <p className="mt-1 text-xs text-[#5F574F]/70">Joined {formatDate(member.createdAt)}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-[#5F574F]">{member.email || "-"}</p>
                  <p className="mt-1 text-xs text-[#5F574F]/75">{member.phone || "-"}</p>
                </td>
                <td className="px-4 py-4 font-semibold text-[#5F574F]">{member.role || "-"}</td>
                <td className="px-4 py-4"><StatusBadge status={member.status} /></td>
                <td className="px-4 py-4">
                  <p className="font-bold text-[#2B2723]">{member.activeLoansCount ?? 0} active</p>
                  <p className={`mt-1 text-xs font-bold ${(member.overdueLoansCount ?? 0) > 0 ? "text-[#7A263A]" : "text-[#5F574F]/70"}`}>
                    {member.overdueLoansCount ?? 0} overdue
                  </p>
                </td>
                <td className="px-4 py-4 font-semibold text-[#5F574F]">{member.activeHoldsCount ?? 0}</td>
                <td className="px-4 py-4 font-semibold text-[#5F574F]">{money(member.unpaidFineTotal)}</td>
                <td className="px-4 py-4">
                  {id ? (
                    <Link href={`/staff/members/${id}`} className="rounded-full border border-[#D8CCBC] px-4 py-2 text-sm font-bold text-[#2B2723] transition hover:border-[#7A263A] hover:text-[#7A263A]">
                      Open profile
                    </Link>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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

function memberIdOf(member: StaffMemberSummary) {
  return String(member.memberId ?? member.id ?? "");
}
