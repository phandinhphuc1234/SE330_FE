"use client";

import { FormEvent, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasStaffAccessFromToken } from "@/features/auth/utils/authRoles";
import { CatalogShell, Notice, SecondaryAction } from "@/features/catalog/components/CatalogShell";
import { CheckoutResponse } from "../types/circulation.type";
import { checkoutHold } from "../services/circulationService";
import { formatDate, titleOf } from "./circulationHelpers";

export function HoldPickupPage() {
  const searchParams = useSearchParams();
  const holdIdFromQuery = searchParams.get("holdId") ?? "";
  const { accessToken, hasStaffAccess, refresh } = useAuth();
  const [result, setResult] = useState<CheckoutResponse | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canUseStaffApi = hasStaffAccess || hasStaffAccessFromToken(accessToken);
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const holdId = String(formData.get("holdId") ?? "").trim();

    if (!holdId) {
      setError("Hold ID is required.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");
    try {
      const data = await checkoutHold(holdId, accessToken, refreshAccessToken);
      setResult(data);
      setSuccessMessage(buildSuccessMessage(data));
      setError("");
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Could not checkout hold.");
      setSuccessMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CatalogShell
      protectedPage
      eyebrow="Reserved pickup"
      title="Checkout reserved pickup"
      description="Use this when a member arrives to collect a reserved book that is ready for pickup."
      actions={<SecondaryAction href="/staff/circulation">Circulation desk</SecondaryAction>}
    >
      {!canUseStaffApi ? <Notice tone="error" message="This workspace requires LIBRARIAN or ADMIN access." /> : null}
      {successMessage ? <div className="mt-6"><Notice tone="success" message={successMessage} /></div> : null}
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#DED5C8] bg-[#F7F3EA] p-5">
          <h2 className="text-lg font-bold text-[#2B2723]">Reserved hold checkout</h2>
          <p className="mt-2 text-sm leading-6 text-[#5F574F]">
            Enter the hold ID from the member&apos;s reservation record, then confirm pickup at the desk.
          </p>
          <label className="mt-4 block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#2B2723]">Ready Hold ID</span>
            <input name="holdId" defaultValue={holdIdFromQuery} placeholder="Enter hold ID" className="mt-2 w-full rounded-xl border border-[#D8CCBC] bg-white px-4 py-3 outline-none focus:border-[#7A263A]" />
          </label>
          <button type="submit" disabled={!canUseStaffApi || isSubmitting} className="mt-5 rounded-full bg-[#7A263A] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
            {isSubmitting ? "Processing pickup..." : "Checkout Reserved Hold"}
          </button>
        </form>
        <section className="rounded-xl border border-[#DED5C8] bg-white p-5">
          <h2 className="text-lg font-bold text-[#2B2723]">Result</h2>
          {error ? <div className="mt-4"><Notice tone="error" message={error} /></div> : null}
          {result ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Metric label="Borrow ID" value={String(result.borrowId ?? result.id ?? "-")} />
              <Metric label="Book" value={titleOf(result)} />
              <Metric label="Barcode" value={result.barcode ?? "-"} />
              <Metric label="Due date" value={formatDate(result.dueAt ?? result.dueDate)} />
            </dl>
          ) : <div className="mt-4"><Notice message="Checkout result will appear here." /></div>}
        </section>
      </div>
    </CatalogShell>
  );
}

function buildSuccessMessage(result: CheckoutResponse) {
  const borrowId = result.borrowId ?? result.id;
  const bookTitle = titleOf(result);
  const dueDate = formatDate(result.dueAt ?? result.dueDate);
  const borrowPart = borrowId ? ` Borrow #${borrowId} was created.` : "";
  const bookPart = bookTitle && bookTitle !== "-" ? ` ${bookTitle} is now checked out.` : "";
  const duePart = dueDate && dueDate !== "-" ? ` Due date: ${dueDate}.` : "";

  return `Reserved pickup completed.${borrowPart}${bookPart}${duePart}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[#DED5C8] bg-[#F7F3EA] p-4"><dt className="text-xs font-bold uppercase tracking-wide text-[#7A263A]">{label}</dt><dd className="mt-2 font-semibold text-[#2B2723]">{value}</dd></div>;
}
