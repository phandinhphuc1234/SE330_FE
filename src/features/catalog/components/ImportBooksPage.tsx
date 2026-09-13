"use client";

import { DragEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/types/api.type";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/context/AuthContext";
import { subscribeImportJobEvents } from "@/features/circulation/services/circulationService";
import { useNotifications } from "@/features/notifications/context/NotificationContext";
import { ImportCsvResult } from "../types/catalog.type";
import { importBooksCsv } from "../services/catalogService";
import { CatalogShell, Notice } from "./CatalogShell";

export function ImportBooksPage() {
  const { accessToken, currentUser, hasStaffAccess, refresh } = useAuth();
  const [result, setResult] = useState<ImportCsvResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [eventStreamStatus, setEventStreamStatus] = useState<"idle" | "connecting" | "live" | "closed">("idle");
  const notifiedJobEvents = useRef(new Set<string>());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { addNotification } = useNotifications();
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);
  const resultJobId = result?.jobId ?? result?.id ?? "";

  useEffect(() => {
    if (!resultJobId || isTerminalImportStatus(result?.status)) {
      return;
    }

    const unsubscribe = subscribeImportJobEvents(resultJobId, accessToken, refreshAccessToken, {
      onOpen: () => setEventStreamStatus("live"),
      onEvent: (_eventName, nextJob) => {
        setResult(nextJob);
        setError("");

        if (isTerminalImportStatus(nextJob.status)) {
          setEventStreamStatus("closed");
          notifyImportResult(addNotification, notifiedJobEvents.current, nextJob, resultJobId);
          unsubscribe();
        }
      },
      onError: (streamError) => {
        setEventStreamStatus("closed");
        setError(streamError.message || "Could not read import job events.");
      },
      onClose: () => setEventStreamStatus((current) => (current === "live" ? "closed" : current)),
    });

    return () => unsubscribe();
  }, [accessToken, addNotification, refreshAccessToken, result?.status, resultJobId]);

  function selectCsvFile(file: File | null) {
    setSelectedFile(file);
    setSelectedFileName(file?.name ?? "");
  }

  function handleFileChange(fileList: FileList | null) {
    selectCsvFile(fileList?.[0] ?? null);
  }

  function handleFileDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (isSubmitting || !hasStaffAccess) return;

    handleFileChange(event.dataTransfer.files);
  }

  function clearSelectedFile() {
    selectCsvFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formFile = formData.get("file");
    const file = selectedFile ?? (formFile instanceof File && formFile.size ? formFile : null);

    if (!file?.size) {
      setError("Please select a CSV file.");
      return;
    }

    setIsSubmitting(true);
    setSelectedFileName(file.name);
    setEventStreamStatus("idle");
    notifiedJobEvents.current.clear();
    try {
      const data = await importBooksCsv(file, accessToken);
      setResult(data);
      setEventStreamStatus(data.jobId || data.id ? "connecting" : "idle");
      setError("");
      notifyImportResult(addNotification, notifiedJobEvents.current, data, data.jobId ?? data.id ?? "");
    } catch (submitError) {
      if (submitError instanceof ApiError && (submitError.status === 401 || submitError.status === 403)) {
        const refreshedSession = await refresh();

        if (refreshedSession?.accessToken) {
          try {
            const data = await importBooksCsv(file, refreshedSession.accessToken);
            setResult(data);
            setEventStreamStatus(data.jobId || data.id ? "connecting" : "idle");
            setError("");
            notifyImportResult(addNotification, notifiedJobEvents.current, data, data.jobId ?? data.id ?? "");
            return;
          } catch (retryError) {
            setError(getImportErrorMessage(retryError, currentUser?.role));
            return;
          }
        }
      }

      setError(submitError instanceof Error ? submitError.message : "Could not import CSV.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const resultProcessedRows = result?.processedRows ?? result?.successRows ?? 0;
  const resultErrors = result?.errors ?? [];
  const isImportTerminal = isTerminalImportStatus(result?.status);
  const visibleErrors = isImportTerminal ? resultErrors : resultErrors.slice(0, 5);
  const resultStatus = result?.status ?? (result ? "SUBMITTED" : undefined);
  const resultEventTime = result?.completedAt ?? result?.startedAt ?? result?.createdAt;
  const resultDateLabel = resultEventTime ? formatImportDateTime(resultEventTime) : "";
  const workflowSteps = [
    {
      step: "1",
      title: "Choose file",
      body: selectedFileName || "Select a CSV file",
      state: !isSubmitting && !result ? "active" : selectedFileName ? "done" : "idle",
      icon: "file" as const,
    },
    {
      step: "2",
      title: "Import",
      body: isSubmitting
        ? "Import in progress"
        : result
          ? eventStreamStatus !== "idle" && !isImportTerminal
            ? getStreamStatusLabel(eventStreamStatus)
            : getImportStatusLabel(resultStatus)
          : "Start the import",
      state: isSubmitting ? "active" : result ? "done" : "idle",
      icon: "upload" as const,
    },
    {
      step: "3",
      title: "Review",
      body: result ? "Review results and errors" : "Review results and errors",
      state: result ? "active" : "idle",
      icon: "search" as const,
    },
  ];

  return (
    <CatalogShell
      protectedPage
      frameless
      hideHeader
      eyebrow="CSV import"
      title="Import books and copies"
      description="Upload catalog records in bulk and review row-level errors returned by the backend."
    >
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] md:p-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-red-700">CSV Import</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-[#111827] md:text-4xl">Import books and copies</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-[#4B5563]">
            Upload catalog records in bulk and review row-level errors returned by the backend.
          </p>
        </div>

      <ol className="mb-6 grid gap-0 rounded-xl border border-gray-200 bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.05)] md:grid-cols-3">
        {workflowSteps.map(({ step, title, body, state, icon }, index) => (
          <li key={step} className="flex min-w-0 items-center gap-3 px-1 py-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={getWorkflowBadgeStyle(state)}>{step}</span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={getWorkflowIconStyle(state)}>
              <Icon name={icon} size={17} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[#111827]">{title}</p>
              <p className="truncate text-[11px] font-medium leading-4 text-[#6B7280]" title={body}>
                {body}
              </p>
            </div>
            {index < workflowSteps.length - 1 ? (
              <span className="ml-auto hidden h-px flex-1 md:block" style={{ backgroundColor: state === "idle" ? "#E5E7EB" : "#C1122F" }} aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="book-import-layout">
        <form onSubmit={handleSubmit} className="min-w-0 rounded-xl border border-gray-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center text-[#C1122F]">
              <Icon name="upload" size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#111827]">Upload CSV</h2>
              <p className="mt-1 text-xs font-medium leading-5 text-[#6B7280]">
                Choose a catalog file, then start the import job.
              </p>
            </div>
          </div>
          {!hasStaffAccess ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              Your current role is {currentUser?.role ?? "unknown"}. CSV import requires LIBRARIAN or ADMIN.
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            id="book-import-file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            disabled={isSubmitting || !hasStaffAccess}
            onChange={(event) => handleFileChange(event.target.files)}
            className="sr-only"
          />
          <label
            htmlFor="book-import-file"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleFileDrop}
            className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#D1D5DB] bg-white px-5 py-6 text-center transition hover:border-[#C1122F] hover:bg-[#FFF7F8] has-[:focus-visible]:border-[#C1122F]"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#FDECEE] text-[#C1122F]">
              <Icon name="upload" size={21} aria-hidden="true" />
            </span>
            <span className="mt-4 text-xs font-medium text-[#4B5563]">Drag and drop your CSV file here</span>
            <span className="mt-2 text-[11px] font-medium text-[#9CA3AF]">or</span>
            <span className="mt-2 rounded-md border border-[#F3A7B3] px-5 py-2 text-xs font-bold text-[#C1122F]">Browse files</span>
          </label>
          {selectedFileName ? (
            <div className="mt-4 flex min-h-12 items-center gap-3 rounded-lg border border-[#9AD2AD] bg-[#F6FFF8] px-3 py-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-[#2F7D47]">
                <Icon name="file" size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#111827]" title={selectedFileName}>{selectedFileName}</p>
                <p className="mt-0.5 text-[11px] font-medium text-[#6B7280]">{selectedFile ? formatFileSize(selectedFile.size) : "Ready to import"}</p>
              </div>
              <Icon name="check-circle" size={16} className="shrink-0 text-[#2F7D47]" aria-hidden="true" />
              <button
                type="button"
                onClick={clearSelectedFile}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#6B7280] transition hover:bg-white hover:text-[#111827]"
                aria-label="Remove selected file"
              >
                <Icon name="x" size={15} aria-hidden="true" />
              </button>
            </div>
          ) : null}
          <button
            disabled={isSubmitting || !hasStaffAccess}
            className="mt-4 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#C1122F] px-5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(193,18,47,0.18)] transition hover:bg-[#9F0F27] focus:outline-none focus:ring-4 focus:ring-[#C1122F]/20 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
          >
            <Icon name="upload" size={17} aria-hidden="true" />
            {isSubmitting ? "Importing..." : "Start import"}
          </button>
          <p className="mt-4 text-[11px] font-medium text-[#6B7280]">Missing columns or invalid data will be reported in the review step.</p>
        </form>

        <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center text-[#111827]">
                <Icon name="trending-up" size={19} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#111827]">Import result</h2>
                <p className="mt-1 text-xs font-medium leading-5 text-[#6B7280]">
                  Review job status, imported copies, and row-level validation.
                </p>
              </div>
            </div>
            {resultStatus ? <StatusBadge status={resultStatus} /> : null}
          </div>
          <div className="mt-4 grid gap-3">
            {error ? <Notice tone="error" message={error} /> : null}
            {!result && !error ? <EmptyImportResult /> : null}
          </div>
          {result ? (
            <>
              {result.jobId || result.id ? (
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7280]">Import job id</p>
                    <p className="mt-2 break-all text-sm font-bold leading-5 text-[#111827]">{result.jobId ?? result.id}</p>
                    <p className="mt-1 text-[11px] font-medium text-[#6B7280]">
                      {resultDateLabel ? `${getImportStatusLabel(resultStatus)} on ${resultDateLabel}` : getImportStatusLabel(resultStatus)}
                    </p>
                  </div>
                  <Link href="/staff/imports" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#F3A7B3] px-4 text-xs font-bold text-[#C1122F] transition hover:bg-[#FFF7F8]">
                    Track job
                    <Icon name="arrow-up-right" size={14} aria-hidden="true" />
                  </Link>
                </div>
              ) : null}
              {result.errorMessage ? <Notice tone="error" message={result.errorMessage} /> : null}
              <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                <ImportMetricCard label="Processed" value={resultProcessedRows} helper="rows" icon="database" tone="brand" />
                <ImportMetricCard label="Success" value={result.successRows ?? 0} helper="rows" icon="check-circle" tone="success" />
                <ImportMetricCard label="Failed" value={result.failedRows ?? 0} helper="rows" icon="alert-circle" tone="danger" />
                <ImportMetricCard label="Books" value={result.createdBooks ?? 0} helper="added" icon="book-open" tone="neutral" />
                <ImportMetricCard label="Copies" value={result.createdCopies ?? 0} helper="added" icon="file" tone="neutral" />
              </div>
              <RecentImportEvents
                status={resultStatus}
                processedRows={resultProcessedRows}
                failedRows={result.failedRows ?? 0}
                eventTime={resultDateLabel}
              />
              {resultErrors.length ? (
                <ImportErrorTable
                  errors={visibleErrors}
                  totalErrors={resultErrors.length}
                  isComplete={isImportTerminal}
                />
              ) : null}
            </>
          ) : null}
        </section>
      </div>
      </section>
    </CatalogShell>
  );
}

function getWorkflowBadgeStyle(state: string) {
  return {
    backgroundColor: state === "active" ? "#C1122F" : state === "done" ? "#111827" : "#9CA3AF",
  };
}

function getWorkflowIconStyle(state: string) {
  return {
    backgroundColor: state === "active" ? "#FFF0F2" : "#F3F4F6",
    color: state === "active" ? "#C1122F" : state === "done" ? "#111827" : "#6B7280",
  };
}

function ImportMetricCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: "alert-circle" | "book-open" | "check-circle" | "database" | "file";
  tone: "brand" | "danger" | "neutral" | "success";
}) {
  const toneClasses = {
    brand: "border-[#D8E8F6] bg-[#F5FAFF] text-[#3C6E9F]",
    danger: "border-[#F6C9CF] bg-[#FFF7F8] text-[#C1122F]",
    neutral: "border-[#E5E7EB] bg-white text-[#6B7280]",
    success: "border-[#CFEAD8] bg-[#F6FFF8] text-[#2F7D47]",
  }[tone];

  return (
    <div className={`min-w-0 rounded-xl border p-4 ${toneClasses}`}>
      <div className="flex items-center gap-2">
        <Icon name={icon} size={15} className="shrink-0" aria-hidden="true" />
        <p className="min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.08em]">{label}</p>
      </div>
      <p className="mt-3 break-words text-3xl font-bold leading-none text-[#111827]">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-[#6B7280]">{helper}</p>
    </div>
  );
}

function EmptyImportResult() {
  return (
    <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-8 text-center">
      <Icon name="file" size={28} className="mx-auto text-[#9CA3AF]" aria-hidden="true" />
      <p className="mt-3 text-sm font-bold text-[#111827]">No import result yet</p>
      <p className="mt-1 text-xs font-medium text-[#6B7280]">Upload a CSV file to review job status and row validation.</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const isFailed = status === "FAILED";
  const isComplete = status === "COMPLETED";
  const className = isFailed
    ? "border-[#F6C9CF] bg-[#FFF7F8] text-[#C1122F]"
    : isComplete
      ? "border-[#CFEAD8] bg-[#F6FFF8] text-[#2F7D47]"
      : "border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563]";

  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold ${className}`}>
      <Icon name={isFailed ? "alert-circle" : isComplete ? "check-circle" : "clock"} size={13} aria-hidden="true" />
      {getImportStatusLabel(status)}
    </span>
  );
}

function RecentImportEvents({
  status,
  processedRows,
  failedRows,
  eventTime,
}: {
  status?: string;
  processedRows: number;
  failedRows: number;
  eventTime: string;
}) {
  const isFailed = status === "FAILED";

  return (
    <div className="mt-5 rounded-xl border border-[#E5E7EB] bg-white">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
        <p className="text-xs font-bold text-[#111827]">Recent events</p>
        <Link href="/staff/imports" className="text-[11px] font-bold text-[#C1122F] transition hover:text-[#9F0F27]">
          View all events
        </Link>
      </div>
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon name={isFailed ? "alert-circle" : "check-circle"} size={15} className={isFailed ? "mt-0.5 shrink-0 text-[#C1122F]" : "mt-0.5 shrink-0 text-[#2F7D47]"} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-[#111827]">{isFailed ? "CSV import failed" : "CSV import completed"}</p>
          <p className="mt-1 text-[11px] font-medium text-[#6B7280]">{processedRows} rows processed - {failedRows} failed</p>
        </div>
        {eventTime ? <p className="shrink-0 text-[11px] font-medium text-[#6B7280]">{eventTime}</p> : null}
      </div>
    </div>
  );
}

function isTerminalImportStatus(status?: string) {
  return status === "COMPLETED" || status === "FAILED";
}

function ImportErrorTable({
  errors,
  totalErrors,
  isComplete,
}: {
  errors: NonNullable<ImportCsvResult["errors"]>;
  totalErrors: number;
  isComplete: boolean;
}) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#000054]">Row-level errors</p>
          <p className="text-xs font-semibold text-[#6F675E]">
            {isComplete ? "Showing all returned row errors." : "Showing the first 5 errors while the import is running."}
          </p>
        </div>
        {!isComplete && totalErrors > errors.length ? (
          <p className="text-xs font-bold text-[#337AB7]">{totalErrors - errors.length} more will be available when the job finishes.</p>
        ) : null}
      </div>
      <div className="max-w-full overflow-x-auto rounded-xl border border-[#EDEDF2]">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-[#000054] text-white">
            <tr>
              {["Row", "ISBN", "Barcode", "Code", "Message"].map((heading) => (
                <th key={heading} className="px-4 py-3 font-bold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {errors.map((row, index) => (
              <tr key={`${row.rowNumber}-${index}`} className="border-t border-[#EDEDF2]">
                <td className="px-4 py-3">{row.rowNumber ?? "-"}</td>
                <td className="px-4 py-3">{row.isbn ?? "-"}</td>
                <td className="px-4 py-3">{row.barcode ?? "-"}</td>
                <td className="px-4 py-3 font-bold text-[#E60028]">{row.code ?? "-"}</td>
                <td className="px-4 py-3">{row.message ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function notifyImportResult(
  addNotification: ReturnType<typeof useNotifications>["addNotification"],
  notifiedJobEvents: Set<string>,
  result: ImportCsvResult,
  fallbackJobId: string,
) {
  const resolvedJobId = result.jobId ?? result.id ?? fallbackJobId;
  const status = result.status;

  if (!resolvedJobId || !isTerminalImportStatus(status)) return;

  const notificationId = `book-import-${resolvedJobId}-${status}`;

  if (notifiedJobEvents.has(notificationId)) return;

  notifiedJobEvents.add(notificationId);

  if (status === "COMPLETED") {
    addNotification({
      id: notificationId,
      title: "CSV import completed",
      body: `${result.successRows ?? 0}/${result.totalRows ?? 0} rows imported. ${result.createdBooks ?? 0} books and ${result.createdCopies ?? 0} copies created.`,
      href: "/staff/imports",
      tone: "success",
    });
    return;
  }

  addNotification({
    id: notificationId,
    title: "CSV import failed",
    body: result.originalFilename || result.filename ? `${result.originalFilename ?? result.filename} could not be imported.` : `Job ${resolvedJobId} could not be imported.`,
    href: "/staff/imports",
    tone: "error",
  });
}

function getImportStatusLabel(status?: string) {
  if (status === "COMPLETED") return "Completed";
  if (status === "FAILED") return "Failed";
  if (status === "PROCESSING") return "Processing";
  if (status === "PENDING") return "Pending";
  if (status === "SUBMITTED") return "Submitted";
  return status ? status.toLowerCase() : "Waiting";
}

function getStreamStatusLabel(status: "idle" | "connecting" | "live" | "closed") {
  if (status === "connecting") return "Connecting to job";
  if (status === "live") return "Import in progress";
  if (status === "closed") return "Stream closed";
  return "Waiting";
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatImportDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getImportErrorMessage(error: unknown, role?: string) {
  if (error instanceof ApiError && error.status === 403) {
    return `Import was forbidden by the backend. Current profile role is ${role ?? "unknown"}; backend may require the access token authority to include LIBRARIAN/ADMIN.`;
  }

  return error instanceof Error ? error.message : "Could not import CSV.";
}
