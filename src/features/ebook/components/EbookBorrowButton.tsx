"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { borrowEbook } from "../services/ebookService";
import { EbookLoan } from "../types/ebook.type";

type Props = {
  bookId: number;
  bookTitle?: string;
  /** Truyền vào nếu book detail page đã biết book có ebook hay chưa */
  hasEbook?: boolean;
};

/**
 * Nút "Mượn ebook" nhúng vào BookDetailPage.
 * Sau khi mượn thành công, hiển thị link đọc luôn.
 */
export function EbookBorrowButton({ bookId, bookTitle, hasEbook }: Props) {
  const { accessToken, refresh, isAuthenticated } = useAuth();
  const [loan, setLoan] = useState<EbookLoan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (!hasEbook) return null;

  async function handleBorrow() {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const refreshToken = async () => (await refresh())?.accessToken ?? null;
      const result = await borrowEbook(bookId, accessToken, refreshToken);
      setLoan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not borrow ebook at this time.");
    } finally {
      setLoading(false);
    }
  }

  if (loan?.status === "ACTIVE" && loan.ebookReadUrl) {
    return (
      <div className="inline-flex flex-col gap-2">
        <a
          href={loan.ebookReadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#111827] px-6 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(17,24,39,0.22)] transition hover:-translate-y-0.5 hover:bg-black"
        >
          Read online
          <span aria-hidden="true">→</span>
        </a>
        <p className="text-xs text-gray-500 text-center">
          Expires {loan.expiresAt ? new Date(loan.expiresAt).toLocaleDateString("en-US") : "–"} ·{" "}
          <Link href="/user/ebook-loans" className="text-[#337AB7] hover:underline">Manage</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      {/* Login modal */}
      {showLoginModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-64 rounded-xl border border-[#EDEDF2] bg-white p-4 shadow-xl">
            <p className="text-sm font-semibold text-[#000054]">Sign in required</p>
            <p className="mt-1 text-xs text-gray-500">
              You need to log in to borrow ebooks.
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                href="/login"
                className="flex-1 rounded-full bg-[#000054] px-3 py-2 text-center text-xs font-bold text-white hover:bg-[#000080] transition-colors"
              >
                Log in
              </Link>
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 rounded-full border border-[#EDEDF2] px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
      {error && (
        <p className="mb-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</p>
      )}
      <button
        onClick={handleBorrow}
        disabled={loading}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#111827] px-6 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(17,24,39,0.22)] transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Processing...
          </>
        ) : (
          <>
            Read online
            <span aria-hidden="true">→</span>
          </>
        )}
      </button>
    </div>
  );
}
