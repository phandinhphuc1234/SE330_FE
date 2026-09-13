"use client";

import { FormEvent, useCallback, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasStaffAccessFromToken } from "@/features/auth/utils/authRoles";
import { CatalogShell, Notice, SecondaryAction } from "@/features/catalog/components/CatalogShell";
import { CheckinResponse, CheckoutPreviewResponse, CheckoutRequest, CheckoutResponse } from "../types/circulation.type";
import { checkinCopy, confirmCheckout, previewCheckout, staffRenewBorrow } from "../services/circulationService";
import { formatDate, money } from "./circulationHelpers";
import { BorrowReceipt } from "./BorrowReceipt";

export function StaffCirculationPage() {
  const { accessToken, hasStaffAccess, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<"checkout" | "checkin" | "renew">("checkout");
  const [checkoutPayload, setCheckoutPayload] = useState<CheckoutRequest | null>(null);
  const [preview, setPreview] = useState<CheckoutPreviewResponse | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);
  const [checkinResult, setCheckinResult] = useState<CheckinResponse | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submittingAction, setSubmittingAction] = useState<"preview" | "checkout" | "checkin" | "renew" | null>(null);
  const canUseStaffApi = hasStaffAccess || hasStaffAccessFromToken(accessToken);
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  async function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingAction) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      memberId: Number(formData.get("memberId")),
      itemBarcode: String(formData.get("itemBarcode") ?? "").trim(),
    };

    if (!payload.memberId || !payload.itemBarcode) {
      setError("Member ID and item barcode are required.");
      return;
    }

    setSubmittingAction("preview");
    try {
      const data = await previewCheckout(payload, accessToken, refreshAccessToken);
      setCheckoutPayload(payload);
      setPreview(data);
      setCheckoutResult(null);
      setError("");
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Could not preview checkout.");
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleConfirmCheckout() {
    if (!checkoutPayload || submittingAction) return;

    setSubmittingAction("checkout");
    try {
      const data = await confirmCheckout(checkoutPayload, accessToken, refreshAccessToken);
      setCheckoutResult(data);
      setMessage("Checkout completed.");
      setError("");
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Could not confirm checkout.");
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleCheckin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const barcode = String(formData.get("barcode") ?? "").trim();

    if (!barcode) {
      setError("Barcode is required.");
      return;
    }

    if (submittingAction) return;

    setSubmittingAction("checkin");
    try {
      const data = await checkinCopy(barcode, accessToken, refreshAccessToken);
      setCheckinResult(data);
      setMessage("Check-in completed.");
      setError("");
    } catch (checkinError) {
      setError(checkinError instanceof Error ? checkinError.message : "Could not check in copy.");
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleStaffRenew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const borrowId = String(formData.get("borrowId") ?? "").trim();

    if (!borrowId) {
      setError("Borrow ID is required.");
      return;
    }

    if (submittingAction) return;

    setSubmittingAction("renew");
    try {
      await staffRenewBorrow(borrowId, accessToken, refreshAccessToken);
      setMessage("Staff renewal completed.");
      setError("");
    } catch (renewError) {
      setError(renewError instanceof Error ? renewError.message : "Could not renew borrow.");
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <>
      <div className="print:hidden">
        <CatalogShell
          protectedPage
      eyebrow="Circulation desk"
      title="Borrowing and returns"
      description="Run checkout previews, confirm loans, process returns, and support staff renewals at the desk."
      actions={<SecondaryAction href="/staff/holds/pickup">Reserved Pickup</SecondaryAction>}
    >
      {!canUseStaffApi ? <Notice tone="error" message="This workspace requires LIBRARIAN or ADMIN access." /> : null}
      <div className="mt-1 flex flex-wrap gap-2">
        {[
          ["checkout", "Checkout"],
          ["checkin", "Check-in"],
          ["renew", "Staff renew"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id as "checkout" | "checkin" | "renew")}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${activeTab === id ? "bg-[#000054] text-white" : "border border-[#D9DCE8] text-[#000054]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-3">
        {message ? <Notice tone="success" message={message} /> : null}
        {error ? <Notice tone="error" message={error} /> : null}
      </div>

      {activeTab === "checkout" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form onSubmit={handlePreview} className="rounded-xl border border-[#EDEDF2] bg-[#F8F9FA] p-5">
            <h2 className="text-lg font-bold text-[#000054]">Checkout preview</h2>
            <Input name="memberId" label="Member ID" type="number" />
            <Input name="itemBarcode" label="Item Barcode" />
            <button type="submit" disabled={!canUseStaffApi || submittingAction !== null} className="mt-5 w-full rounded-full bg-[#000054] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
              {submittingAction === "preview" ? "Previewing..." : "Preview"}
            </button>
            <button type="button" onClick={handleConfirmCheckout} disabled={!canUseStaffApi || !preview?.allowed || submittingAction !== null} className="mt-3 w-full rounded-full bg-[#E60028] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
              {submittingAction === "checkout" ? "Processing checkout..." : "Confirm Checkout"}
            </button>
          </form>
          <ResultCard title="Preview result">
            {preview ? <CheckoutPreviewPanel preview={preview} fallbackBarcode={checkoutPayload?.itemBarcode} /> : <Notice message="Preview details will appear here." />}
            {checkoutResult ? (
              <div className="mt-4 space-y-3">
                <Notice tone="success" message={`Borrow ${checkoutResult.borrowId ?? checkoutResult.id ?? ""} created.`} />
                <button type="button" onClick={() => window.print()} className="w-full rounded-full border border-[#D9DCE8] bg-white px-5 py-3 text-sm font-bold text-[#000054] hover:bg-gray-50">
                  Print Receipt
                </button>
              </div>
            ) : null}
          </ResultCard>
        </div>
      ) : null}

      {activeTab === "checkin" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form onSubmit={handleCheckin} className="rounded-xl border border-[#EDEDF2] bg-[#F8F9FA] p-5">
            <h2 className="text-lg font-bold text-[#000054]">Return a copy</h2>
            <Input name="barcode" label="Barcode" />
            <button type="submit" disabled={!canUseStaffApi || submittingAction !== null} className="mt-5 w-full rounded-full bg-[#E60028] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
              {submittingAction === "checkin" ? "Processing return..." : "Return Book"}
            </button>
          </form>
          <ResultCard title="Check-in result">
            {checkinResult ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                <Metric label="Book" value={checkinResult.bookTitle ?? "-"} />
                <Metric label="Returned" value={formatDate(checkinResult.returnedAt)} />
                <Metric label="Overdue days" value={String(checkinResult.overdueDays ?? 0)} />
                <Metric label="Fine" value={money(checkinResult.fineAmount)} />
                <Metric label="Copy status" value={checkinResult.copyStatus ?? "-"} />
                <Metric label="Next hold" value={checkinResult.nextHoldId ? String(checkinResult.nextHoldId) : "-"} />
              </dl>
            ) : <Notice message="Return result will appear here." />}
            {checkinResult?.nextHoldId ? <div className="mt-4"><Notice tone="success" message="This copy was assigned to the next hold. Place it on the hold pickup shelf." /></div> : null}
          </ResultCard>
        </div>
      ) : null}

      {activeTab === "renew" ? (
        <form onSubmit={handleStaffRenew} className="mt-6 max-w-xl rounded-xl border border-[#EDEDF2] bg-[#F8F9FA] p-5">
          <h2 className="text-lg font-bold text-[#000054]">Staff-assisted renewal</h2>
          <Input name="borrowId" label="Borrow ID" />
          <button type="submit" disabled={!canUseStaffApi || submittingAction !== null} className="mt-5 rounded-full bg-[#E60028] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
            {submittingAction === "renew" ? "Renewing..." : "Staff Renew"}
          </button>
        </form>
      ) : null}
    </CatalogShell>
      </div>
      <div className="hidden print:block absolute top-0 left-0 bg-white min-h-screen w-full">
        <BorrowReceipt receiptData={checkoutResult} />
      </div>
    </>
  );
}

function Input({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <label className="mt-4 block">
      <span className="text-xs font-bold uppercase tracking-wide text-[#000054]">{label}</span>
      <input name={name} type={type} className="mt-2 w-full rounded-xl border border-[#D9DCE8] bg-white px-4 py-3 outline-none focus:border-[#337AB7]" />
    </label>
  );
}

function ResultCard({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-xl border border-[#EDEDF2] bg-white p-5"><h2 className="text-lg font-bold text-[#000054]">{title}</h2><div className="mt-4">{children}</div></section>;
}

function CheckoutPreviewPanel({ fallbackBarcode, preview }: { fallbackBarcode?: string; preview: CheckoutPreviewResponse }) {
  const reasons = [...(preview.reasons ?? []), ...(preview.warnings ?? [])]
    .map(formatPreviewNote)
    .filter(Boolean);
  const allowed = preview.allowed ?? false;

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-4 ${allowed ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
        <p className={`text-xs font-bold uppercase tracking-wide ${allowed ? "text-emerald-700" : "text-rose-700"}`}>
          {allowed ? "Checkout allowed" : "Checkout blocked"}
        </p>
        <p className="mt-1 text-sm font-semibold text-[#111827]">
          {allowed
            ? "This member and item copy meet the borrowing rules. You can confirm checkout."
            : "Review the reason below before trying again."}
        </p>
      </div>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#000054]">Member</h3>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <Metric label="Name" value={preview.memberName ?? "-"} />
          <Metric label="Member ID" value={String(preview.memberId ?? "-")} />
          <Metric label="Email" value={preview.memberEmail ?? "-"} className="sm:col-span-2" />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#000054]">Book copy</h3>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <Metric label="Title" value={preview.bookTitle ?? preview.title ?? "-"} />
          <Metric label="Book ID" value={String(preview.bookId ?? "-")} />
          <Metric label="Item barcode" value={preview.itemBarcode ?? preview.barcode ?? fallbackBarcode ?? "-"} />
          <Metric label="Copy ID" value={String(preview.bookCopyId ?? "-")} />
          <Metric label="Item status" value={preview.itemStatus ?? "-"} className="sm:col-span-2" />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#000054]">Loan policy</h3>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric label="Loan period" value={preview.loanPeriodDays ? `${preview.loanPeriodDays} days` : "-"} />
          <Metric label="Max renewals" value={String(preview.maxRenewals ?? "-")} />
          <Metric label="Due date" value={formatDate(preview.dueAt ?? preview.dueDate)} />
        </dl>
      </section>

      {reasons.length ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-amber-800">Notes</h3>
          <ul className="mt-2 grid gap-2 text-sm font-semibold text-amber-900">
            {reasons.map((item, index) => {
              return <li key={`${item}-${index}`}>{item}</li>;
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function formatPreviewNote(note: unknown) {
  if (typeof note === "string") return toFriendlyPreviewNote("", note);
  if (note === null || note === undefined) return "";

  if (typeof note === "object") {
    const source = note as { code?: unknown; message?: unknown };
    const code = typeof source.code === "string" ? source.code : "";
    const message = typeof source.message === "string" ? source.message : "";

    const friendlyMessage = toFriendlyPreviewNote(code, message);

    if (friendlyMessage) return friendlyMessage;
    if (code && message) return `${code}: ${message}`;
    if (message) return message;
    if (code) return code;

    try {
      return JSON.stringify(note);
    } catch {
      return "";
    }
  }

  return String(note);
}

function toFriendlyPreviewNote(code: string, message: string) {
  const normalized = `${code} ${message}`.toLowerCase();

  if (
    normalized.includes("borrow_limit") ||
    normalized.includes("borrow limit") ||
    normalized.includes("max borrow") ||
    normalized.includes("maximum borrow") ||
    normalized.includes("active loan limit") ||
    normalized.includes("too many") ||
    normalized.includes("quota")
  ) {
    const limit = extractFirstNumber(message) ?? "5";
    return `This member has reached the ${limit}-book borrowing limit. Please process a return before checking out another item.`;
  }

  if (normalized.includes("overdue")) {
    return "This member has overdue loans. Please resolve the overdue items before checking out another book.";
  }

  return "";
}

function extractFirstNumber(value: string) {
  return value.match(/\d+/)?.[0];
}

function Metric({ className = "", label, value }: { className?: string; label: string; value: string }) {
  return <div className={`rounded-lg border border-[#EDEDF2] bg-[#F8F9FA] p-4 ${className}`}><dt className="text-xs font-bold uppercase tracking-wide text-[#337AB7]">{label}</dt><dd className="mt-2 break-words font-semibold text-[#111827]">{value}</dd></div>;
}
