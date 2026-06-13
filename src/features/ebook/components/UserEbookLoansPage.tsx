"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogShell, Notice, SecondaryAction } from "@/features/catalog/components/CatalogShell";
import { EbookLoan } from "../types/ebook.type";
import { getMyEbookLoans, renewEbook, returnEbook } from "../services/ebookService";

// ── Helpers ──────────────────────────────────────────────────────
function loanId(loan: EbookLoan): number {
  return (loan.loanId ?? loan.id) as number;
}

function formatDate(value?: string | null) {
  if (!value) return "–";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function daysLeft(expiresAt?: string): string {
  if (!expiresAt) return "–";
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return "Expired";
  if (diff === 0) return "Expires today";
  return `${diff} days left`;
}

function statusBadge(status?: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
          Active
        </span>
      );
    case "EXPIRED":
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
          Expired
        </span>
      );
    case "RETURNED":
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          Returned
        </span>
      );
    default:
      return <span className="text-gray-400 text-xs">{status ?? "–"}</span>;
  }
}

// ── Main Component ────────────────────────────────────────────────
export function UserEbookLoansPage() {
  const { accessToken, refresh } = useAuth();
  const [loans, setLoans] = useState<EbookLoan[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const refreshToken = useCallback(
    async () => (await refresh())?.accessToken ?? null,
    [refresh],
  );

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getMyEbookLoans({ history: showHistory }, accessToken, refreshToken)
      .then((result) => {
        if (active) {
          setLoans(result.items);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load ebook list.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [accessToken, refreshToken, showHistory, message]);

  async function handleReturn(loan: EbookLoan) {
    const id = loanId(loan);
    if (actioningId) return;
    setActioningId(id);
    try {
      await returnEbook(id, accessToken, refreshToken);
      setMessage(`Ebook "${loan.bookTitle}" has been returned.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not return ebook.");
    } finally {
      setActioningId(null);
    }
  }

  /**
   * Renewing an ebook loan requires paying a renewal fee.
   * Open the standalone Payment tab; once payment succeeds there,
   * the user can come back here (or this tab will refresh) to see
   * the updated loan with the new expiry date.
   */
  function handleRenew(loan: EbookLoan) {
    const id = loanId(loan);
    const url = new URL("/payment", window.location.origin);
    url.searchParams.set("purpose", "EBOOK_RENEWAL");
    url.searchParams.set("loanId", String(id));
    if (loan.bookId) url.searchParams.set("bookId", String(loan.bookId));
    if (loan.bookTitle) url.searchParams.set("bookTitle", loan.bookTitle);

    const paymentTab = window.open(url.toString(), "_blank", "noopener,noreferrer");

    // Poll: when the payment tab closes, refresh the loans list and
    // attempt the actual renewal (in case payment succeeded).
    if (paymentTab) {
      const interval = window.setInterval(async () => {
        if (paymentTab.closed) {
          window.clearInterval(interval);
          await finalizeRenewal(loan);
        }
      }, 1000);
    }
  }

  async function finalizeRenewal(loan: EbookLoan) {
    const id = loanId(loan);
    if (actioningId) return;
    setActioningId(id);
    try {
      await renewEbook(id, accessToken, refreshToken);
      setMessage(`Ebook "${loan.bookTitle}" has been renewed for 14 more days.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not renew ebook. If you completed the payment, please refresh this page.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <CatalogShell
      protectedPage
      eyebrow="My ebooks"
      title="Borrow ebooks online"
      description="Read ebooks directly in your browser without visiting the library. Each loan is valid for 14 days."
      actions={
        <SecondaryAction href="/books">
          Find books with ebook
        </SecondaryAction>
      }
    >
      {/* Tab active / history */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setShowHistory(false); setMessage(""); setError(""); }}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            !showHistory
              ? "bg-[#000054] text-white"
              : "border border-[#EDEDF2] text-[#555] hover:bg-gray-50"
          }`}
        >
          Active loans
        </button>
        <button
          onClick={() => { setShowHistory(true); setMessage(""); setError(""); }}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            showHistory
              ? "bg-[#000054] text-white"
              : "border border-[#EDEDF2] text-[#555] hover:bg-gray-50"
          }`}
        >
          History
        </button>
      </div>

      {/* Notices */}
      <div className="grid gap-3 mb-4">
        {message && <Notice tone="success" message={message} />}
        {error && <Notice tone="error" message={error} />}
        {isLoading && <Notice message="Loading your ebooks..." />}
      </div>

      {/* Table */}
      {!isLoading && (
        <div className="overflow-x-auto rounded-xl border border-[#EDEDF2]">
          <table className="w-full min-w-[860px] border-collapse bg-white text-left text-sm">
            <thead className="bg-[#000054] text-white">
              <tr>
                {["Book", "ISBN", "Borrowed", "Expires", "Time left", "Status", "Renewals", "Action"].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 font-bold whitespace-nowrap">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    {showHistory ? "No ebook borrowing history." : "You have no active ebook loans."}
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const id = loanId(loan);
                  const isActioning = actioningId === id;
                  const isActive = loan.status === "ACTIVE";

                  return (
                    <tr key={id} className="border-t border-[#EDEDF2] hover:bg-[#F8F9FA] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#000054] max-w-[220px]">
                        <div className="truncate" title={loan.bookTitle}>
                          {loan.bookTitle ?? "–"}
                        </div>
                        {isActive && loan.ebookReadUrl && (
                          <a
                            href={loan.ebookReadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-[#337AB7] hover:underline"
                          >
                            Read now
                          </a>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {loan.isbn ?? "–"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {formatDate(loan.borrowedAt)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {loan.returnedAt
                          ? `Returned ${formatDate(loan.returnedAt)}`
                          : formatDate(loan.expiresAt)}
                      </td>

                      <td className={`px-4 py-3 whitespace-nowrap text-xs font-semibold ${
                        isActive ? "text-green-700" : "text-gray-400"
                      }`}>
                        {isActive ? daysLeft(loan.expiresAt) : "–"}
                      </td>

                      <td className="px-4 py-3">{statusBadge(loan.status)}</td>

                      <td className="px-4 py-3 text-xs text-gray-500">
                        {loan.renewCount ?? 0}/{loan.maxRenewals ?? 1}
                      </td>

                      <td className="px-4 py-3">
                        {isActive ? (
                          <div className="flex gap-2 flex-wrap">
                            {loan.canRenew && (
                              <button
                                disabled={isActioning}
                                onClick={() => handleRenew(loan)}
                                className="rounded-lg border border-[#000054] px-3 py-1 text-xs font-semibold text-[#000054] hover:bg-[#000054] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {isActioning ? "..." : "Renew"}
                              </button>
                            )}
                            <button
                              disabled={isActioning}
                              onClick={() => handleReturn(loan)}
                              className="rounded-lg border border-red-400 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isActioning ? "..." : "Return"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">–</span>
                        )}
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
