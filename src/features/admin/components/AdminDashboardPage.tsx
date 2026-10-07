"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasAdminAccessFromToken } from "@/features/auth/utils/authRoles";
import { getStaffDashboardSummary } from "@/features/circulation/services/circulationService";
import { StaffDashboardSummary } from "@/features/circulation/types/circulation.type";
import { CatalogShell, Notice } from "@/features/catalog/components/CatalogShell";
import { useLanguage } from "@/features/i18n/context/LanguageContext";

type Locale = "en" | "vi";

type Metric = {
  label: string;
  value: string;
  helper: string;
  tone: "neutral" | "danger" | "success" | "gold";
  iconName: "book-open" | "alert-circle" | "check-circle" | "banknote";
};

type WorkItem = {
  title: string;
  description: string;
  href: string;
  action: string;
  iconName: "alert-circle" | "calendar" | "banknote";
  tone: "danger" | "success" | "neutral";
  active: boolean;
};

const copy = {
  en: {
    loadError: "We could not load the latest dashboard data. Please try again.",
    accessDenied: "This dashboard requires administrator access.",
    eyebrow: "Admin dashboard",
    title: "Library overview",
    description: "Monitor circulation and work through today's operational priorities.",
    refresh: "Refresh",
    retry: "Try again",
    waitingForData: "Waiting for data",
    metrics: {
      activeLoans: ["Active loans / access", "Physical loans and ebook access currently active."],
      overdueLoans: ["Overdue", "Loans and ebook access that need follow-up."],
      readyHolds: ["Ready for pickup", "Reservations waiting for members at the desk."],
      unpaidFines: ["Unpaid fines", "{count} fine records still have an outstanding balance."],
    },
    work: {
      eyebrow: "Priority queue",
      title: "Work that needs attention",
      overdue: {
        activeTitle: (count: string) => `${count} overdue loans`,
        activeDescription: "Review due dates and contact borrowers who need follow-up.",
        emptyTitle: "No overdue loans",
        emptyDescription: "There are no overdue physical or ebook loans right now.",
        action: "View list",
      },
      holds: {
        activeTitle: (count: string) => `${count} reservations ready for pickup`,
        activeDescription: "Prepare assigned copies and complete checkout when members arrive.",
        emptyTitle: "No reservations awaiting pickup",
        emptyDescription: "There are no ready reservations to prepare at the moment.",
        action: "Process holds",
      },
      fines: {
        activeTitle: (count: string) => `${count} unpaid fine records`,
        activeDescription: "Review borrower balances and outstanding payments.",
        emptyTitle: "No outstanding fines",
        emptyDescription: "There are no unpaid fine records at the moment.",
        action: "Review borrowers",
      },
    },
    today: {
      eyebrow: "Today",
      title: "Desk activity",
      borrowed: "Loans / access granted",
      borrowedHelper: "New physical loans and ebook access granted today.",
      returned: "Returned today",
      returnedHelper: "Physical and ebook loans completed today.",
      updated: "Updated",
    },
    trend: {
      eyebrow: "Reporting",
      title: "Circulation trend",
      emptyTitle: "Daily statistics are not available yet",
      emptyDescription: "This chart will appear after the backend provides a verified daily time series.",
      action: "Open borrow statistics",
    },
  },
  vi: {
    loadError: "Không thể tải dữ liệu dashboard mới nhất. Vui lòng thử lại.",
    accessDenied: "Dashboard này yêu cầu quyền quản trị viên.",
    eyebrow: "Dashboard quản trị",
    title: "Tổng quan thư viện",
    description: "Theo dõi hoạt động lưu thông và xử lý các công việc ưu tiên trong ngày.",
    refresh: "Làm mới",
    retry: "Thử lại",
    waitingForData: "Đang chờ dữ liệu",
    metrics: {
      activeLoans: ["Đang mượn / đọc", "Lượt mượn sách giấy và quyền đọc ebook đang hiệu lực."],
      overdueLoans: ["Quá hạn", "Các lượt mượn hoặc đọc ebook cần được theo dõi."],
      readyHolds: ["Chờ nhận sách", "Lượt đặt giữ đang chờ thành viên đến nhận."],
      unpaidFines: ["Phạt chưa thanh toán", "{count} hồ sơ vẫn còn số dư tiền phạt."],
    },
    work: {
      eyebrow: "Hàng đợi ưu tiên",
      title: "Việc cần xử lý",
      overdue: {
        activeTitle: (count: string) => `${count} lượt mượn quá hạn`,
        activeDescription: "Kiểm tra hạn trả và liên hệ những người mượn cần được nhắc.",
        emptyTitle: "Không có lượt mượn quá hạn",
        emptyDescription: "Hiện không có lượt mượn sách giấy hoặc ebook nào quá hạn.",
        action: "Xem danh sách",
      },
      holds: {
        activeTitle: (count: string) => `${count} lượt đặt sẵn sàng nhận`,
        activeDescription: "Chuẩn bị bản sao đã gán và hoàn tất checkout khi thành viên đến.",
        emptyTitle: "Không có lượt đặt chờ nhận",
        emptyDescription: "Hiện không có lượt đặt sẵn sàng cần chuẩn bị tại quầy.",
        action: "Xử lý đặt giữ",
      },
      fines: {
        activeTitle: (count: string) => `${count} hồ sơ chưa thanh toán phạt`,
        activeDescription: "Kiểm tra số dư và các khoản thanh toán còn tồn của người mượn.",
        emptyTitle: "Không có tiền phạt tồn đọng",
        emptyDescription: "Hiện không có hồ sơ tiền phạt nào chưa thanh toán.",
        action: "Xem người mượn",
      },
    },
    today: {
      eyebrow: "Hôm nay",
      title: "Hoạt động tại quầy",
      borrowed: "Cấp lượt mượn / đọc",
      borrowedHelper: "Lượt mượn sách giấy và quyền đọc ebook được cấp hôm nay.",
      returned: "Trả hôm nay",
      returnedHelper: "Lượt mượn sách giấy và ebook đã kết thúc hôm nay.",
      updated: "Cập nhật",
    },
    trend: {
      eyebrow: "Báo cáo",
      title: "Xu hướng lưu thông",
      emptyTitle: "Chưa có dữ liệu thống kê theo ngày",
      emptyDescription: "Biểu đồ sẽ xuất hiện khi backend cung cấp chuỗi dữ liệu theo ngày đã được kiểm chứng.",
      action: "Mở thống kê mượn / trả",
    },
  },
};

export function AdminDashboardPage() {
  const { locale } = useLanguage();
  const text = copy[locale];
  const { accessToken, hasAdminAccess, refresh } = useAuth();
  const [summary, setSummary] = useState<StaffDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshRequest, setRefreshRequest] = useState(0);
  const canUseAdminDashboard = hasAdminAccess || hasAdminAccessFromToken(accessToken);
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  useEffect(() => {
    if (!canUseAdminDashboard) return;

    let isMounted = true;
    getStaffDashboardSummary(accessToken, refreshAccessToken)
      .then((data) => {
        if (!isMounted) return;
        setSummary(data);
        setError("");
      })
      .catch(() => {
        if (!isMounted) return;
        setError(text.loadError);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, canUseAdminDashboard, refreshAccessToken, refreshRequest, text.loadError]);

  const metrics = useMemo<Metric[]>(() => {
    const fineCount = formatNumber(summary?.unpaidFineCount, locale);

    return [
      { label: text.metrics.activeLoans[0], value: formatNumber(summary?.activeLoans, locale), helper: text.metrics.activeLoans[1], tone: "neutral", iconName: "book-open" },
      { label: text.metrics.overdueLoans[0], value: formatNumber(summary?.overdueLoans, locale), helper: text.metrics.overdueLoans[1], tone: "danger", iconName: "alert-circle" },
      { label: text.metrics.readyHolds[0], value: formatNumber(summary?.holdsReadyForPickup, locale), helper: text.metrics.readyHolds[1], tone: "success", iconName: "check-circle" },
      { label: text.metrics.unpaidFines[0], value: formatCurrency(summary?.unpaidFineTotal, locale), helper: text.metrics.unpaidFines[1].replace("{count}", fineCount), tone: "gold", iconName: "banknote" },
    ];
  }, [locale, summary, text.metrics]);

  const workItems = useMemo<WorkItem[]>(() => {
    return [
      buildWorkItem(numberOf(summary?.overdueLoans), locale, text.work.overdue, "/staff/loans", "alert-circle", "danger"),
      buildWorkItem(numberOf(summary?.holdsReadyForPickup), locale, text.work.holds, "/staff/holds", "calendar", "success"),
      buildWorkItem(numberOf(summary?.unpaidFineCount), locale, text.work.fines, "/staff/members", "banknote", "neutral"),
    ];
  }, [locale, summary, text.work]);

  const requestRefresh = () => {
    setIsLoading(true);
    setRefreshRequest((value) => value + 1);
  };
  const isInitialLoading = isLoading && !summary;

  return (
    <CatalogShell
      protectedPage
      wide
      frameless
      warm
      eyebrow={text.eyebrow}
      title={text.title}
      description={text.description}
      actions={canUseAdminDashboard ? <DashboardActions generatedAt={summary?.generatedAt} isLoading={isLoading} locale={locale} onRefresh={requestRefresh} refreshLabel={text.refresh} waitingLabel={text.waitingForData} /> : undefined}
    >
      {!canUseAdminDashboard ? (
        <Notice tone="error" message={text.accessDenied} />
      ) : (
        <div className="space-y-6" aria-busy={isInitialLoading}>
          {error ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1"><Notice tone="error" message={error} /></div>
              <button type="button" onClick={requestRefresh} disabled={isLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#CBBEAE] bg-white px-4 text-sm font-semibold text-[#5A1C2B] transition-colors hover:bg-[#FBF8F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A263A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                <Icon name="refresh-cw" size={16} animate={isLoading ? "spin" : "none"} aria-hidden="true" />
                {text.retry}
              </button>
            </div>
          ) : null}

          <section aria-label={locale === "vi" ? "Chỉ số chính" : "Key metrics"} aria-live="polite" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} isLoading={isInitialLoading} />)}
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
            <section className="rounded-xl border border-[#DED5C8] bg-white p-5 shadow-[0_8px_24px_rgba(23,20,18,0.06)] md:p-6">
              <SectionHeading eyebrow={text.work.eyebrow} title={text.work.title} />
              <div className="mt-5 divide-y divide-[#E8E0D5]">
                {isInitialLoading ? Array.from({ length: 3 }).map((_, index) => <WorkItemSkeleton key={index} />) : workItems.map((item) => <WorkItemRow key={item.href} item={item} />)}
              </div>
            </section>

            <section className="rounded-xl border border-[#DED5C8] bg-[#FFFCF5] p-5 shadow-[0_8px_24px_rgba(23,20,18,0.06)] md:p-6">
              <SectionHeading eyebrow={text.today.eyebrow} title={text.today.title} />
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <TodayMetric helper={text.today.borrowedHelper} iconName="book-open" isLoading={isInitialLoading} label={text.today.borrowed} value={formatNumber(summary?.borrowedToday, locale)} />
                <TodayMetric helper={text.today.returnedHelper} iconName="arrow-down-right" isLoading={isInitialLoading} label={text.today.returned} value={formatNumber(summary?.returnedToday, locale)} />
              </div>
              <p className="mt-5 border-t border-[#E8E0D5] pt-4 text-xs font-medium text-[#6F675E]">
                {text.today.updated}: {summary?.generatedAt ? formatDateTime(summary.generatedAt, locale) : text.waitingForData}
              </p>
            </section>
          </div>

          <section className="rounded-xl border border-[#DED5C8] bg-white p-5 shadow-[0_8px_24px_rgba(23,20,18,0.06)] md:p-6">
            <SectionHeading eyebrow={text.trend.eyebrow} title={text.trend.title} />
            <div className="mt-5 flex min-h-56 flex-col items-center justify-center rounded-[10px] border border-dashed border-[#CBBEAE] bg-[#FFFCF5] px-5 py-10 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#EFE6D6] text-[#7A263A]"><Icon name="trending-up" size={22} aria-hidden="true" /></span>
              <h3 className="mt-4 font-serif text-xl font-semibold text-[#2B2723]">{text.trend.emptyTitle}</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#6F675E]">{text.trend.emptyDescription}</p>
              <Link href="/admin/statistics/borrows" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#CBBEAE] bg-white px-4 text-sm font-semibold text-[#5A1C2B] transition-colors hover:bg-[#F3E5E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A263A] focus-visible:ring-offset-2">
                {text.trend.action}<Icon name="arrow-right" size={16} aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      )}
    </CatalogShell>
  );
}

function DashboardActions({ generatedAt, isLoading, locale, onRefresh, refreshLabel, waitingLabel }: { generatedAt?: string; isLoading: boolean; locale: Locale; onRefresh: () => void; refreshLabel: string; waitingLabel: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#DED5C8] bg-white px-4 text-sm font-medium text-[#2B2723]"><Icon name="calendar" size={16} aria-hidden="true" />{generatedAt ? formatDate(generatedAt, locale) : waitingLabel}</span>
      <button type="button" onClick={onRefresh} disabled={isLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#7A263A] px-4 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(122,38,58,0.18)] transition-colors hover:bg-[#5A1C2B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A263A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
        <Icon name="refresh-cw" size={16} animate={isLoading ? "spin" : "none"} aria-hidden="true" />{refreshLabel}
      </button>
    </div>
  );
}

function MetricCard({ metric, isLoading }: { metric: Metric; isLoading: boolean }) {
  const tones = { neutral: "bg-[#EFE6D6] text-[#5A1C2B]", danger: "bg-[#F6E4E1] text-[#A33A3A]", success: "bg-[#E5F0EB] text-[#2F5D50]", gold: "bg-[#F4E8CC] text-[#8A641F]" }[metric.tone];
  return (
    <article className={`rounded-xl border bg-white p-5 shadow-[0_8px_24px_rgba(23,20,18,0.06)] ${metric.tone === "danger" ? "border-[#E2B8B2] bg-[#FFF9F8]" : "border-[#DED5C8]"}`}>
      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6F675E]">{metric.label}</p>{isLoading ? <div className="mt-3 h-9 w-24 animate-pulse rounded bg-[#EFE6D6]" /> : <p className="mt-2 font-serif text-3xl font-semibold text-[#171412]">{metric.value}</p>}</div><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tones}`}><Icon name={metric.iconName} size={21} aria-hidden="true" /></span></div>
      <p className="mt-4 text-sm leading-6 text-[#6F675E]">{metric.helper}</p>
    </article>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A263A]">{eyebrow}</p><h2 className="mt-2 font-serif text-2xl font-semibold text-[#2B2723]">{title}</h2></div>;
}

function WorkItemRow({ item }: { item: WorkItem }) {
  const iconTone = { danger: "bg-[#F6E4E1] text-[#A33A3A]", success: "bg-[#E5F0EB] text-[#2F5D50]", neutral: "bg-[#EFE6D6] text-[#6F675E]" }[item.tone];
  return (
    <article className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${iconTone}`}><Icon name={item.iconName} size={20} aria-hidden="true" /></span><div className="min-w-0"><h3 className="font-semibold text-[#2B2723]">{item.title}</h3><p className="mt-1 text-sm leading-6 text-[#6F675E]">{item.description}</p></div></div>
      {item.active ? <Link href={item.href} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-[10px] bg-[#7A263A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#5A1C2B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A263A] focus-visible:ring-offset-2 sm:self-center">{item.action}<Icon name="arrow-right" size={16} aria-hidden="true" /></Link> : null}
    </article>
  );
}

function WorkItemSkeleton() {
  return <div className="flex animate-pulse items-center gap-4 py-5 first:pt-0 last:pb-0" aria-hidden="true"><div className="h-11 w-11 shrink-0 rounded-full bg-[#EFE6D6]" /><div className="flex-1 space-y-2"><div className="h-4 w-2/5 rounded bg-[#EFE6D6]" /><div className="h-3 w-4/5 rounded bg-[#F3EEE5]" /></div></div>;
}

function TodayMetric({ helper, iconName, isLoading, label, value }: { helper: string; iconName: "book-open" | "arrow-down-right"; isLoading: boolean; label: string; value: string }) {
  return (
    <article className="rounded-[10px] border border-[#E5DCD0] bg-white p-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#EFE6D6] text-[#7A263A]"><Icon name={iconName} size={19} aria-hidden="true" /></span><p className="mt-4 text-sm font-semibold text-[#2B2723]">{label}</p>{isLoading ? <div className="mt-2 h-8 w-16 animate-pulse rounded bg-[#EFE6D6]" /> : <p className="mt-1 font-serif text-3xl font-semibold text-[#171412]">{value}</p>}<p className="mt-2 text-xs leading-5 text-[#6F675E]">{helper}</p></article>
  );
}

function buildWorkItem(count: number, locale: Locale, itemCopy: { activeTitle: (count: string) => string; activeDescription: string; emptyTitle: string; emptyDescription: string; action: string }, href: string, iconName: WorkItem["iconName"], activeTone: WorkItem["tone"]): WorkItem {
  const active = count > 0;
  return { title: active ? itemCopy.activeTitle(formatNumber(count, locale)) : itemCopy.emptyTitle, description: active ? itemCopy.activeDescription : itemCopy.emptyDescription, href, action: itemCopy.action, iconName, tone: active ? activeTone : "neutral", active };
}

function numberOf(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatNumber(value?: number, locale: Locale = "en") {
  return numberOf(value).toLocaleString(locale === "vi" ? "vi-VN" : "en-US");
}

function formatCurrency(value?: number, locale: Locale = "en") {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(numberOf(value));
}

function formatDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "long", year: "numeric" });
}

function formatDateTime(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
