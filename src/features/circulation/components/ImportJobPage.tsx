"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasStaffAccessFromToken } from "@/features/auth/utils/authRoles";
import { CatalogShell, Notice, SecondaryAction } from "@/features/catalog/components/CatalogShell";
import { useNotifications } from "@/features/notifications/context/NotificationContext";
import { BookImportJob } from "../types/circulation.type";
import { subscribeImportJobEvents } from "../services/circulationService";

export function ImportJobPage() {
  const { accessToken, hasStaffAccess, refresh } = useAuth();
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState<BookImportJob | null>(null);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "live" | "closed">("idle");
  const notifiedJobEvents = useRef(new Set<string>());
  const { addNotification } = useNotifications();
  const canUseStaffApi = hasStaffAccess || hasStaffAccessFromToken(accessToken);
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  useEffect(() => {
    if (!jobId || !canUseStaffApi) {
      return;
    }

    const unsubscribe = subscribeImportJobEvents(jobId, accessToken, refreshAccessToken, {
      onOpen: () => setConnectionStatus("live"),
      onEvent: (_eventName, nextJob) => {
        setJob(nextJob);
        setError("");

        if (isTerminalImportStatus(nextJob.status)) {
          setConnectionStatus("closed");
          notifyImportJob(addNotification, notifiedJobEvents.current, nextJob, jobId);
          unsubscribe?.();
        }
      },
      onError: (streamError) => {
        setConnectionStatus("closed");
        setError(streamError.message || "Could not read import job events.");
      },
      onClose: () => setConnectionStatus((current) => (current === "live" ? "closed" : current)),
    });

    return () => unsubscribe();
  }, [accessToken, addNotification, canUseStaffApi, jobId, refreshAccessToken]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextJobId = String(formData.get("jobId") ?? "").trim();

    if (!nextJobId) {
      setError("Job ID is required.");
      setConnectionStatus("idle");
      return;
    }

    setJob(null);
    setError("");
    notifiedJobEvents.current.clear();
    setConnectionStatus("connecting");
    setJobId(nextJobId);
  }

  const totalRows = job?.totalRows ?? 0;
  const processedRows = job?.processedRows ?? job?.successRows ?? 0;
  const progress = totalRows ? Math.min(100, Math.round((processedRows / totalRows) * 100)) : 0;
  const jobErrors = job?.errors ?? [];
  const isJobTerminal = isTerminalImportStatus(job?.status);
  const visibleErrors = isJobTerminal ? jobErrors : jobErrors.slice(0, 5);

  return (
    <CatalogShell
      protectedPage
      eyebrow="Import progress"
      title="CSV import job status"
      description="Track asynchronous CSV import jobs by job ID."
      actions={<SecondaryAction href="/staff/books/import">Upload CSV</SecondaryAction>}
    >
      {!canUseStaffApi ? <Notice tone="error" message="This workspace requires LIBRARIAN or ADMIN access." /> : null}
      <form onSubmit={handleSubmit} className="max-w-xl rounded-xl border border-[#EDEDF2] bg-[#F8F9FA] p-5">
        <span className="text-xs font-bold uppercase tracking-wide text-[#000054]">Job ID</span>
        <input name="jobId" className="mt-2 w-full rounded-xl border border-[#D9DCE8] bg-white px-4 py-3 outline-none focus:border-[#337AB7]" />
        <button type="submit" disabled={!canUseStaffApi} className="mt-5 rounded-full bg-[#E60028] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Track job</button>
      </form>
      {connectionStatus !== "idle" ? (
        <div className="mt-5 rounded-xl border border-[#D9DCE8] bg-white px-4 py-3 text-sm font-bold text-[#000054]">
          Event stream: <span className="text-[#337AB7]">{getConnectionLabel(connectionStatus)}</span>
        </div>
      ) : null}
      {error ? <div className="mt-5"><Notice tone="error" message={error} /></div> : null}
      {job ? (
        <section className="mt-6 rounded-xl border border-[#EDEDF2] bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#000054]">{job.originalFilename ?? job.filename ?? `Job ${job.jobId ?? job.id ?? jobId}`}</h2>
              <p className="mt-1 text-sm font-semibold text-[#337AB7]">{job.status ?? "UNKNOWN"}</p>
            </div>
            <p className="text-2xl font-bold text-[#000054]">{progress}%</p>
          </div>
          {job.errorMessage ? <div className="mt-5"><Notice tone="error" message={job.errorMessage} /></div> : null}
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#EDEDF2]">
            <div className="h-full rounded-full bg-[#E60028]" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Total", job.totalRows ?? 0],
              ["Processed", processedRows],
              ["Success", job.successRows ?? 0],
              ["Failed", job.failedRows ?? 0],
              ["Copies", job.createdCopies ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#EDEDF2] bg-[#F8F9FA] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#337AB7]">{label}</p>
                <p className="mt-2 text-2xl font-bold text-[#000054]">{value}</p>
              </div>
            ))}
          </div>
          {jobErrors.length ? (
            <ImportJobErrorTable
              errors={visibleErrors}
              totalErrors={jobErrors.length}
              isComplete={isJobTerminal}
            />
          ) : null}
        </section>
      ) : null}
    </CatalogShell>
  );
}

function isTerminalImportStatus(status?: string) {
  return status === "COMPLETED" || status === "FAILED";
}

function getConnectionLabel(status: "idle" | "connecting" | "live" | "closed") {
  if (status === "connecting") return "connecting";
  if (status === "live") return "live";
  if (status === "closed") return "closed";
  return "idle";
}

function notifyImportJob(
  addNotification: ReturnType<typeof useNotifications>["addNotification"],
  notifiedJobEvents: Set<string>,
  job: BookImportJob,
  fallbackJobId: string,
) {
  const resolvedJobId = job.jobId ?? job.id ?? fallbackJobId;
  const status = job.status;

  if (!resolvedJobId || !isTerminalImportStatus(status)) return;

  const notificationId = `book-import-${resolvedJobId}-${status}`;

  if (notifiedJobEvents.has(notificationId)) return;

  notifiedJobEvents.add(notificationId);

  if (status === "COMPLETED") {
    addNotification({
      id: notificationId,
      title: "CSV import completed",
      body: `${job.successRows ?? 0}/${job.totalRows ?? 0} rows imported. ${job.createdBooks ?? 0} books and ${job.createdCopies ?? 0} copies created.`,
      href: "/staff/imports",
      tone: "success",
    });
    return;
  }

  addNotification({
    id: notificationId,
    title: "CSV import failed",
    body: job.originalFilename || job.filename ? `${job.originalFilename ?? job.filename} could not be imported.` : `Job ${resolvedJobId} could not be imported.`,
    href: "/staff/imports",
    tone: "error",
  });
}

function ImportJobErrorTable({
  errors,
  totalErrors,
  isComplete,
}: {
  errors: NonNullable<BookImportJob["errors"]>;
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
