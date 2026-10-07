"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasStaffAccessFromToken } from "@/features/auth/utils/authRoles";
import { ApiError } from "@/types/api.type";
import { Book, BookCopy, BookCopySearchParams } from "../types/catalog.type";
import {
  createBookCopiesBulk,
  createBookCopy,
  deleteBookCopy,
  getBook,
  getBookCopies,
  updateBookCopy,
} from "../services/catalogService";
import { entityIdOf } from "./catalogHelpers";
import { CatalogShell, Notice, SecondaryAction } from "./CatalogShell";
import { compareText, downloadCsv, SortableHeader, SortDirection } from "./tableUtilities";

type CopySortKey = "barcode" | "status" | "condition" | "location";

const DEFAULT_COPY_FILTERS: BookCopySearchParams = {
  status: "AVAILABLE",
  condition: "GOOD",
};

const COPY_STATUSES = ["", "AVAILABLE", "BORROWED", "RESERVED", "OVERDUE", "ON_HOLD_SHELF", "LOST", "DAMAGED", "REMOVED"];

export function BookCopiesPage({ mode = "staff" }: { mode?: "staff" | "admin" }) {
  const params = useParams<{ bookId: string }>();
  const { accessToken, currentUser, hasStaffAccess, refresh } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createModalError, setCreateModalError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copyFilters, setCopyFilters] = useState<BookCopySearchParams>(DEFAULT_COPY_FILTERS);
  const [statusSummaryCopies, setStatusSummaryCopies] = useState<BookCopy[]>([]);
  const [selectedCopyIds, setSelectedCopyIds] = useState<string[]>([]);
  const [dirtyCopyIds, setDirtyCopyIds] = useState<string[]>([]);
  const [tableSort, setTableSort] = useState<{ key: CopySortKey; direction: SortDirection }>({
    key: "barcode",
    direction: "asc",
  });
  const isAdmin = mode === "admin";
  const canUseCopiesApi = hasStaffAccess || hasStaffAccessFromToken(accessToken);

  useEffect(() => {
    let isMounted = true;

    async function loadCopies() {
      setIsLoading(true);

      try {
        const bookRecord = await getBook(params.bookId);

        if (!canUseCopiesApi) {
          if (!isMounted) return;
          setBook(bookRecord);
          setCopies([]);
          setStatusSummaryCopies([]);
          setError(getCopiesAccessMessage(currentUser?.role));
          return;
        }

        let copyList: BookCopy[];
        let statusSummaryList: BookCopy[];
        const statusSummaryFilters = getStatusSummaryFilters(copyFilters);

        try {
          [copyList, statusSummaryList] = await Promise.all([
            getBookCopies(params.bookId, accessToken, copyFilters),
            getBookCopies(params.bookId, accessToken, statusSummaryFilters),
          ]);
        } catch (copyError) {
          if (copyError instanceof ApiError && (copyError.status === 401 || copyError.status === 403)) {
            const refreshedSession = await refresh();

            if (!refreshedSession?.accessToken) {
              throw copyError;
            }

            [copyList, statusSummaryList] = await Promise.all([
              getBookCopies(params.bookId, refreshedSession.accessToken, copyFilters),
              getBookCopies(params.bookId, refreshedSession.accessToken, statusSummaryFilters),
            ]);
          } else {
            throw copyError;
          }
        }

        if (!isMounted) return;
        setBook(bookRecord);
        setCopies(Array.isArray(copyList) ? copyList : []);
        setStatusSummaryCopies(Array.isArray(statusSummaryList) ? statusSummaryList : []);
        setSelectedCopyIds((selectedIds) => selectedIds.filter((id) => copyList.some((copy) => entityIdOf(copy) === id)));
        setError("");
      } catch (fetchError) {
        if (!isMounted) return;
        setError(getCopiesErrorMessage(fetchError, currentUser?.role));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCopies();

    return () => {
      isMounted = false;
    };
  }, [accessToken, canUseCopiesApi, copyFilters, currentUser?.role, message, params.bookId, refresh]);

  async function handleAddCopy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const barcode = String(formData.get("barcode") ?? "").trim();

    if (!barcode) {
      setCreateModalError("Barcode is required.");
      return;
    }

    try {
      setIsSubmittingCreate(true);
      await runCopyMutation((token) =>
        createBookCopy(
          params.bookId,
          {
            barcode,
            condition: String(formData.get("condition") ?? "").trim(),
            location: String(formData.get("location") ?? "").trim(),
          },
          token,
        ),
      );
      form.reset();
      setIsCreateModalOpen(false);
      setCreateModalError("");
      setMessage("Copy was added.");
      setError("");
    } catch (submitError) {
      setCreateModalError(getCopiesErrorMessage(submitError, currentUser?.role));
    } finally {
      setIsSubmittingCreate(false);
    }
  }

  async function handleBulkAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const barcodes = String(formData.get("barcodes") ?? "")
      .split(/\r?\n|,/)
      .map((barcode) => barcode.trim())
      .filter(Boolean);
    const quantity = Number(formData.get("quantity")) || undefined;

    if (!quantity && !barcodes.length) {
      setCreateModalError("Enter a quantity or at least one barcode.");
      return;
    }

    try {
      setIsSubmittingCreate(true);
      await runCopyMutation((token) =>
        createBookCopiesBulk(
          params.bookId,
          {
            quantity,
            barcodes,
            condition: String(formData.get("condition") ?? "").trim(),
            location: String(formData.get("location") ?? "").trim(),
          },
          token,
        ),
      );
      form.reset();
      setIsCreateModalOpen(false);
      setCreateModalError("");
      setMessage("Bulk copy request was submitted.");
      setError("");
    } catch (submitError) {
      setCreateModalError(getCopiesErrorMessage(submitError, currentUser?.role));
    } finally {
      setIsSubmittingCreate(false);
    }
  }

  async function handleInlineUpdate(copy: BookCopy, form: HTMLFormElement) {
    const copyId = entityIdOf(copy);
    const formData = new FormData(form);

    try {
      await runCopyMutation((token) =>
        updateBookCopy(
          copyId,
          {
            condition: String(formData.get("condition") ?? "").trim(),
            location: String(formData.get("location") ?? "").trim(),
          },
          token,
        ),
      );
      setMessage(`Updated copy ${copy.barcode}.`);
      setDirtyCopyIds((current) => current.filter((id) => id !== copyId));
      setError("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not update copy.");
    }
  }

  async function handleDelete(copy: BookCopy) {
    const copyId = entityIdOf(copy);
    if (!copyId || !window.confirm(`Delete copy ${copy.barcode}?`)) return;

    try {
      await runCopyMutation((token) => deleteBookCopy(copyId, token));
      setMessage(`Deleted copy ${copy.barcode}.`);
      setSelectedCopyIds((current) => current.filter((id) => id !== copyId));
      setError("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete copy.");
    }
  }

  const statusCounts = getStatusCounts(statusSummaryCopies);
  const sortedCopies = [...copies].sort((a, b) => compareText(a[tableSort.key] ?? "", b[tableSort.key] ?? "", tableSort.direction));
  const selectedCopies = sortedCopies.filter((copy) => selectedCopyIds.includes(entityIdOf(copy)));
  const allVisibleSelected = sortedCopies.length > 0 && sortedCopies.every((copy) => selectedCopyIds.includes(entityIdOf(copy)));
  const activeStatus = copyFilters.status ?? "";

  function updateSort(key: CopySortKey) {
    setTableSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function toggleCopySelection(copyId: string) {
    setSelectedCopyIds((current) => (current.includes(copyId) ? current.filter((id) => id !== copyId) : [...current, copyId]));
  }

  function toggleVisibleSelection() {
    setSelectedCopyIds(allVisibleSelected ? [] : sortedCopies.map(entityIdOf).filter(Boolean));
  }

  function markCopyDirty(copyId: string) {
    setDirtyCopyIds((current) => (current.includes(copyId) ? current : [...current, copyId]));
  }

  function updateCopyFilters(nextFilters: BookCopySearchParams) {
    setSelectedCopyIds([]);
    setCopyFilters(nextFilters);
  }

  function updateStatusFilter(status: string) {
    updateCopyFilters({
      ...copyFilters,
      status: status || undefined,
    });
  }

  function handleSearchCopies(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    updateCopyFilters({
      status: copyFilters.status,
      barcode: String(formData.get("barcode") ?? "").trim() || undefined,
      condition: String(formData.get("condition") ?? "").trim() || undefined,
      location: String(formData.get("location") ?? "").trim() || undefined,
    });
  }

  function resetCopyFilters() {
    updateCopyFilters(DEFAULT_COPY_FILTERS);
  }

  async function runCopyMutation<T>(operation: (token: string | null) => Promise<T>) {
    try {
      return await operation(accessToken);
    } catch (mutationError) {
      if (mutationError instanceof ApiError && (mutationError.status === 401 || mutationError.status === 403)) {
        const refreshedSession = await refresh();

        if (refreshedSession?.accessToken) {
          return operation(refreshedSession.accessToken);
        }
      }

      throw mutationError;
    }
  }

  function exportCopies(target: BookCopy[]) {
    downloadCsv(
      `${book?.title ? book.title.replaceAll(/\s+/g, "-").toLowerCase() : "book"}-copies.csv`,
      ["Barcode", "Status", "Condition", "Location"],
      target.map((copy) => [copy.barcode, copy.status || "", copy.condition || "", copy.location || ""]),
    );
  }

  async function handleBulkDelete() {
    if (!isAdmin || !selectedCopies.length) return;
    if (!window.confirm(`Delete ${selectedCopies.length} selected copies?`)) return;

    try {
      await Promise.all(selectedCopies.map((copy) => runCopyMutation((token) => deleteBookCopy(entityIdOf(copy), token))));
      setMessage(`Deleted ${selectedCopies.length} selected copies.`);
      setSelectedCopyIds([]);
      setError("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete selected copies.");
    }
  }

  return (
    <CatalogShell
      protectedPage
      eyebrow="Physical inventory"
      title={book ? `Copies for ${book.title}` : "Manage book copies"}
      description="Track barcodes, condition, and location. Copy status is left to borrowing, return, and reservation flows."
      actions={<SecondaryAction href={isAdmin ? "/admin/books" : "/staff/books"}>Back to {isAdmin ? "admin" : "staff"} books</SecondaryAction>}
    >
      <div className="grid gap-3">
        {isLoading ? <Notice message="Loading copies..." /> : null}
        {message ? <Notice tone="success" message={message} /> : null}
        {error ? <Notice tone="error" message={error} /> : null}
      </div>

      <div className="mt-6 rounded-xl border border-[#DED5C8] bg-white p-5 shadow-[0_16px_40px_rgba(7,7,88,0.06)]">
        <div>
          <div>
            <h2 className="text-xl font-bold text-[#2B2723]">Search physical copies</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5F574F]">
              Default results show available copies in good condition. Search by barcode, condition, or location, then use the status chips below.
            </p>
          </div>
        </div>

        <form
          key={`${copyFilters.status ?? ""}-${copyFilters.barcode ?? ""}-${copyFilters.condition ?? ""}-${copyFilters.location ?? ""}`}
          onSubmit={handleSearchCopies}
          className="mt-5 grid gap-3 rounded-xl border border-[#DED5C8] bg-[#F7F3EA] p-4 lg:grid-cols-[1.2fr_0.9fr_0.9fr_auto_auto]"
        >
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-[#2B2723]">Barcode</span>
            <input name="barcode" defaultValue={copyFilters.barcode ?? ""} placeholder="Search partial barcode..." className="mt-2 h-12 w-full rounded-xl border border-[#D8CCBC] bg-white px-4 outline-none transition focus:border-[#7A263A]" />
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-[#2B2723]">Condition</span>
            <input name="condition" defaultValue={copyFilters.condition ?? ""} placeholder="GOOD" className="mt-2 h-12 w-full rounded-xl border border-[#D8CCBC] bg-white px-4 outline-none transition focus:border-[#7A263A]" />
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-[#2B2723]">Location</span>
            <input name="location" defaultValue={copyFilters.location ?? ""} placeholder="Shelf, room..." className="mt-2 h-12 w-full rounded-xl border border-[#D8CCBC] bg-white px-4 outline-none transition focus:border-[#7A263A]" />
          </label>
          <button type="submit" className="self-end rounded-full bg-[#2B2723] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">
            Search
          </button>
          <button type="button" onClick={resetCopyFilters} className="self-end rounded-full border border-[#D8CCBC] px-5 py-3 text-sm font-bold text-[#2B2723] transition hover:border-[#7A263A]">
            Default
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {COPY_STATUSES.map((status) => {
            const normalizedStatus = status || "";
            const item = statusCounts.find((entry) => entry.status === (normalizedStatus || "ALL"));
            const isActive = activeStatus === normalizedStatus;

            return (
              <button
                key={normalizedStatus || "ALL"}
                type="button"
                onClick={() => updateStatusFilter(normalizedStatus)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  isActive
                    ? "bg-[#2B2723] text-white shadow-lg shadow-[#2B2723]/15"
                    : "border border-[#D8CCBC] bg-white text-[#2B2723] hover:border-[#7A263A] hover:bg-[#7A263A]/5"
                }`}
              >
                {statusLabel(normalizedStatus || "ALL")} <span className={isActive ? "text-white/80" : "text-[#7A263A]"}>{item?.count ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!isLoading ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DED5C8] bg-white p-4">
          <p className="text-sm font-semibold text-[#5F574F]">
            {selectedCopyIds.length ? `${selectedCopyIds.length} selected` : `${copies.length} copies loaded`}
            {dirtyCopyIds.length ? <span className="ml-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{dirtyCopyIds.length} unsaved</span> : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateModalError("");
                setIsCreateModalOpen(true);
              }}
              className="rounded-full bg-[#7A263A] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#7A263A]/20 transition hover:-translate-y-0.5"
            >
              Create Copy
            </button>
            <button type="button" onClick={() => exportCopies(selectedCopies.length ? selectedCopies : sortedCopies)} className="rounded-full border border-[#D8CCBC] px-4 py-2 text-sm font-bold text-[#2B2723] hover:border-[#7A263A]">
              Export {selectedCopies.length ? "selected" : "visible"}
            </button>
            {isAdmin ? (
              <button type="button" onClick={handleBulkDelete} disabled={!selectedCopies.length} className="rounded-full border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
                Delete selected
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-[#DED5C8]">
        <table className="w-full min-w-[860px] border-collapse bg-white text-left text-sm">
          <thead className="bg-[#2B2723] text-white">
            <tr>
              <th className="w-12 px-4 py-3">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection} aria-label="Select all visible copies" className="h-4 w-4 accent-[#7A263A]" />
              </th>
              <th className="px-4 py-3"><SortableHeader active={tableSort.key === "barcode"} direction={tableSort.direction} onClick={() => updateSort("barcode")}>Barcode</SortableHeader></th>
              <th className="px-4 py-3"><SortableHeader active={tableSort.key === "status"} direction={tableSort.direction} onClick={() => updateSort("status")}>Status</SortableHeader></th>
              <th className="px-4 py-3"><SortableHeader active={tableSort.key === "condition"} direction={tableSort.direction} onClick={() => updateSort("condition")}>Condition</SortableHeader></th>
              <th className="px-4 py-3"><SortableHeader active={tableSort.key === "location"} direction={tableSort.direction} onClick={() => updateSort("location")}>Location</SortableHeader></th>
              <th className="px-4 py-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCopies.map((copy) => {
              const copyId = entityIdOf(copy);

              return (
              <tr key={copyId || copy.barcode} className="border-t border-[#DED5C8]">
                <td className="px-4 py-4">
                  <input type="checkbox" checked={selectedCopyIds.includes(copyId)} onChange={() => toggleCopySelection(copyId)} aria-label={`Select copy ${copy.barcode}`} className="h-4 w-4 accent-[#7A263A]" />
                </td>
                <td className="px-4 py-4 font-bold text-[#2B2723]">{copy.barcode}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-[#2B2723]/8 px-3 py-1 text-xs font-bold text-[#2B2723]">{copy.status || "UNKNOWN"}</span>
                </td>
                <td className="px-4 py-4">
                  <form id={`copy-${copyId}`} onSubmit={(event) => event.preventDefault()}>
                    <input name="condition" defaultValue={copy.condition ?? ""} onChange={() => markCopyDirty(copyId)} className="w-full rounded-lg border border-[#D8CCBC] px-3 py-2 outline-none focus:border-[#7A263A]" />
                  </form>
                </td>
                <td className="px-4 py-4">
                  <input form={`copy-${copyId}`} name="location" defaultValue={copy.location ?? ""} onChange={() => markCopyDirty(copyId)} className="w-full rounded-lg border border-[#D8CCBC] px-3 py-2 outline-none focus:border-[#7A263A]" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleInlineUpdate(copy, document.getElementById(`copy-${copyId}`) as HTMLFormElement)} className="rounded-full border border-[#D8CCBC] px-3 py-1.5 font-bold text-[#2B2723]">
                      {dirtyCopyIds.includes(copyId) ? "Save changes" : "Save"}
                    </button>
                    {isAdmin ? (
                      <button type="button" onClick={() => handleDelete(copy)} className="rounded-full border border-rose-200 px-3 py-1.5 font-bold text-rose-700">
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isLoading && !sortedCopies.length ? (
        <div className="mt-5">
          <Notice message={copyFilters.status ? `No copies found with ${statusLabel(copyFilters.status)} status and the current search filters.` : "No physical copies found for the current search filters."} />
        </div>
      ) : null}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setCreateModalError("");
          setIsCreateModalOpen(false);
        }}
        title="Create physical copies"
        description="Add a single barcode or create multiple copies for this title."
        size="xl"
      >
        {createModalError ? (
          <div className="mb-4">
            <Notice tone="error" message={createModalError} />
          </div>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleAddCopy} className="rounded-xl border border-[#DED5C8] bg-[#F7F3EA] p-5">
            <h2 className="text-lg font-bold text-[#2B2723]">Add one copy</h2>
            <div className="mt-4 grid gap-4">
              <CopyInput name="barcode" label="Barcode" required />
              <CopyInput name="condition" label="Condition" />
              <CopyInput name="location" label="Location" />
              <button disabled={isSubmittingCreate} className="rounded-full bg-[#7A263A] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0" type="submit">
                {isSubmittingCreate ? "Adding..." : "Add copy"}
              </button>
            </div>
          </form>

          <form onSubmit={handleBulkAdd} className="rounded-xl border border-[#DED5C8] bg-[#F7F3EA] p-5">
            <h2 className="text-lg font-bold text-[#2B2723]">Bulk add copies</h2>
            <div className="mt-4 grid gap-4">
              <CopyInput name="quantity" label="Quantity" type="number" />
              <label>
                <span className="text-xs font-bold uppercase tracking-wide text-[#2B2723]">Barcodes</span>
                <textarea name="barcodes" rows={4} placeholder="One barcode per line, or comma separated" className="mt-2 w-full rounded-xl border border-[#D8CCBC] bg-white px-4 py-3 outline-none focus:border-[#7A263A]" />
              </label>
              <CopyInput name="condition" label="Condition" />
              <CopyInput name="location" label="Location" />
              <button disabled={isSubmittingCreate} className="rounded-full bg-[#2B2723] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0" type="submit">
                {isSubmittingCreate ? "Submitting..." : "Bulk add"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </CatalogShell>
  );
}

function getCopiesErrorMessage(error: unknown, role?: string) {
  if (error instanceof ApiError && error.status === 403) {
    return getCopiesAccessMessage(role);
  }

  if (error instanceof ApiError && error.status === 401) {
    return "Your session expired while loading physical copies. Please log in again.";
  }

  return error instanceof Error ? error.message : "Could not load copies.";
}

function getCopiesAccessMessage(role?: string) {
  return `Physical copies require LIBRARIAN or ADMIN access. Current role: ${role ?? "unknown"}. If this account was recently changed, please log out and log in again.`;
}

function CopyInput({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label>
      <span className="text-xs font-bold uppercase tracking-wide text-[#2B2723]">{label}</span>
      <input name={name} type={type} required={required} className="mt-2 w-full rounded-xl border border-[#D8CCBC] bg-white px-4 py-3 outline-none focus:border-[#7A263A]" />
    </label>
  );
}

function getStatusCounts(copies: BookCopy[]) {
  const counts = new Map<string, number>();
  counts.set("ALL", copies.length);

  copies.forEach((copy) => {
    const status = normalizeStatus(copy.status);
    counts.set(status, (counts.get(status) ?? 0) + 1);
  });

  return Array.from(counts, ([status, count]) => ({ status, count })).sort((a, b) => {
    if (a.status === "ALL") return -1;
    if (b.status === "ALL") return 1;
    return a.status.localeCompare(b.status);
  });
}

function getStatusSummaryFilters(filters: BookCopySearchParams) {
  return {
    barcode: filters.barcode,
    condition: filters.condition,
    location: filters.location,
  };
}

function normalizeStatus(status?: string | null) {
  return status?.trim().toUpperCase() || "UNKNOWN";
}

function statusLabel(status: string) {
  return status === "ALL" ? "All copies" : status.replaceAll("_", " ");
}
