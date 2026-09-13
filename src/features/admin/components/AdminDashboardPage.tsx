"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasAdminAccessFromToken } from "@/features/auth/utils/authRoles";
import { getStaffDashboardSummary } from "@/features/circulation/services/circulationService";
import { StaffDashboardSummary } from "@/features/circulation/types/circulation.type";
import { CatalogShell, Notice, SecondaryAction } from "@/features/catalog/components/CatalogShell";
import { useLanguage } from "@/features/i18n/context/LanguageContext";

type Metric = {
  label: string;
  value: string;
  helper: React.ReactNode;
  tone: "blue" | "red" | "green" | "gold";
  iconName: "book-open" | "alert-circle" | "check-circle" | "dollar-sign" | "arrow-down-right" | "arrow-up-right";
};

// --- Mock Data for Charts ---
const MOCK_TREND_DATA = [
  { name: "Mon", borrows: 45, returns: 30 },
  { name: "Tue", borrows: 52, returns: 40 },
  { name: "Wed", borrows: 38, returns: 45 },
  { name: "Thu", borrows: 65, returns: 35 },
  { name: "Fri", borrows: 80, returns: 60 },
  { name: "Sat", borrows: 95, returns: 50 },
  { name: "Sun", borrows: 30, returns: 85 },
];
// -----------------------------

type ActionItem = {
  title: string;
  description: string;
  value: number;
  href: string;
  tone: "red" | "green" | "gold";
};

const copy = {
  en: {
    loadError: "Could not load admin dashboard summary.",
    accessDenied: "This dashboard requires ADMIN access.",
    eyebrow: "Admin dashboard",
    title: "Library command center",
    description: "A focused operations dashboard for circulation health, reservation pickup work, fines, and today's desk activity.",
    actions: {
      adminCatalog: "Admin catalog",
      circulationDesk: "Circulation desk",
      borrowers: "Borrowers",
    },
    breadcrumb: "Pages / Dashboard",
    mainTitle: "Main Dashboard",
    mainDescription: "Metrics first, then action items. This view keeps staff work visible without digging through tables.",
    actionCenter: "Action Center",
    attention: "What needs attention",
    openLoanMonitor: "Open loan monitor >",
    todayReport: "Today report",
    deskActivity: "Desk activity",
    live: "Live",
    shortcutsTitle: "Admin shortcuts",
    open: "Open >",
    waitingForData: "Waiting for data",
    metrics: {
      activeLoans: ["Active loans/access", "Physical loans and ebook access currently active."],
      overdueLoans: ["Overdue loans/access", "Records needing staff follow-up."],
      readyHolds: ["Ready holds", "Reservations waiting at pickup."],
      unpaidFines: ["Unpaid fines", "total outstanding."],
      borrowedToday: ["Loans granted today", "Physical checkouts and ebook access granted today."],
      returnedToday: ["Returned today", "Check-in activity for today."],
    },
    actionItems: {
      overdue: ["Overdue follow-up", "Review overdue loans and contact borrowers before fines keep accumulating."],
      holds: ["Ready reservations", "Prepare assigned copies and complete pickup checkout when members arrive."],
      fines: ["Unpaid fine records", "Use borrower profiles to review balances and explain outstanding charges."],
    },
    shortcuts: [
      ["Manage catalog", "Edit metadata, inventory, and physical copies."],
      ["Category taxonomy", "Maintain catalog classification."],
      ["Borrower profiles", "Inspect loans, holds, fines, and account status."],
      ["Import jobs", "Review CSV import progress and errors."],
    ],
  },
  vi: {
    loadError: "Không thể tải tóm tắt dashboard quản trị.",
    accessDenied: "Dashboard này yêu cầu quyền ADMIN.",
    eyebrow: "Dashboard quản trị",
    title: "Trung tâm điều hành thư viện",
    description: "Dashboard tập trung cho tình trạng lưu thông, lượt nhận sách đặt giữ, tiền phạt và hoạt động quầy trong ngày.",
    actions: {
      adminCatalog: "Quản trị sách",
      circulationDesk: "Quầy lưu thông",
      borrowers: "Người mượn",
    },
    breadcrumb: "Trang / Dashboard",
    mainTitle: "Dashboard chính",
    mainDescription: "Ưu tiên chỉ số và việc cần xử lý để staff nắm tình hình mà không phải đào qua nhiều bảng.",
    actionCenter: "Trung tâm xử lý",
    attention: "Việc cần chú ý",
    openLoanMonitor: "Mở theo dõi lượt mượn >",
    todayReport: "Báo cáo hôm nay",
    deskActivity: "Hoạt động quầy",
    live: "Trực tiếp",
    shortcutsTitle: "Lối tắt quản trị",
    open: "Mở >",
    waitingForData: "Đang chờ dữ liệu",
    metrics: {
      activeLoans: ["Đang mượn/đọc", "Lượt mượn sách giấy và quyền đọc ebook đang hiệu lực."],
      overdueLoans: ["Quá hạn", "Các bản ghi cần staff theo dõi."],
      readyHolds: ["Sẵn sàng nhận", "Lượt đặt giữ đang chờ nhận tại quầy."],
      unpaidFines: ["Phạt chưa trả", "tổng còn tồn."],
      borrowedToday: ["Cấp lượt hôm nay", "Checkout sách giấy và quyền đọc ebook được cấp trong ngày."],
      returnedToday: ["Trả hôm nay", "Hoạt động check-in trong ngày."],
    },
    actionItems: {
      overdue: ["Theo dõi quá hạn", "Xem các lượt quá hạn và liên hệ người mượn trước khi phí phạt tiếp tục tăng."],
      holds: ["Lượt đặt sẵn sàng", "Chuẩn bị bản sao đã gán và hoàn tất pickup checkout khi thành viên tới nhận."],
      fines: ["Hồ sơ tiền phạt", "Dùng hồ sơ người mượn để xem số dư và giải thích các khoản còn tồn."],
    },
    shortcuts: [
      ["Quản lý danh mục sách", "Sửa metadata, tồn kho và bản sao vật lý."],
      ["Phân loại danh mục", "Bảo trì hệ thống phân loại sách."],
      ["Hồ sơ người mượn", "Kiểm tra lượt mượn, đặt giữ, tiền phạt và trạng thái tài khoản."],
      ["Tác vụ import", "Xem tiến trình và lỗi import CSV."],
    ],
  },
};

export function AdminDashboardPage() {
  const { locale } = useLanguage();
  const text = copy[locale];
  const { accessToken, hasAdminAccess, refresh } = useAuth();
  const [summary, setSummary] = useState<StaffDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const canUseAdminDashboard = hasAdminAccess || hasAdminAccessFromToken(accessToken);
  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  useEffect(() => {
    if (!canUseAdminDashboard) return;

    let isMounted = true;
    const loadingTimerId = window.setTimeout(() => {
      if (isMounted) {
        setIsLoading(true);
      }
    }, 0);

    getStaffDashboardSummary(accessToken, refreshAccessToken)
      .then((data) => {
        if (!isMounted) return;
        setSummary(data);
        setError("");
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : text.loadError);
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
  }, [accessToken, canUseAdminDashboard, refreshAccessToken, text.loadError]);

  const metrics = useMemo<Metric[]>(
    () => [
      {
        label: text.metrics.activeLoans[0],
        value: formatNumber(summary?.activeLoans, locale),
        helper: text.metrics.activeLoans[1],
        tone: "blue",
        iconName: "book-open",
      },
      {
        label: text.metrics.overdueLoans[0],
        value: formatNumber(summary?.overdueLoans, locale),
        helper: text.metrics.overdueLoans[1],
        tone: "red",
        iconName: "alert-circle",
      },
      {
        label: text.metrics.readyHolds[0],
        value: formatNumber(summary?.holdsReadyForPickup, locale),
        helper: text.metrics.readyHolds[1],
        tone: "green",
        iconName: "check-circle",
      },
      {
        label: text.metrics.unpaidFines[0],
        value: formatNumber(summary?.unpaidFineCount, locale),
        helper: `${formatCurrency(summary?.unpaidFineTotal, locale)} ${text.metrics.unpaidFines[1]}`,
        tone: "gold",
        iconName: "dollar-sign",
      },
      {
        label: text.metrics.borrowedToday[0],
        value: formatNumber(summary?.borrowedToday, locale),
        helper: text.metrics.borrowedToday[1],
        tone: "blue",
        iconName: "arrow-up-right",
      },
      {
        label: text.metrics.returnedToday[0],
        value: formatNumber(summary?.returnedToday, locale),
        helper: text.metrics.returnedToday[1],
        tone: "green",
        iconName: "arrow-down-right",
      },
    ],
    [locale, summary, text.metrics],
  );

  const actions = useMemo<ActionItem[]>(
    () => [
      {
        title: text.actionItems.overdue[0],
        description: text.actionItems.overdue[1],
        value: numberOf(summary?.overdueLoans),
        href: "/staff/loans",
        tone: "red",
      },
      {
        title: text.actionItems.holds[0],
        description: text.actionItems.holds[1],
        value: numberOf(summary?.holdsReadyForPickup),
        href: "/staff/holds",
        tone: "green",
      },
      {
        title: text.actionItems.fines[0],
        description: text.actionItems.fines[1],
        value: numberOf(summary?.unpaidFineCount),
        href: "/staff/members",
        tone: "gold",
      },
    ],
    [summary, text.actionItems],
  );

  return (
    <CatalogShell
      protectedPage
      wide
      eyebrow={text.eyebrow}
      title={text.title}
      description={text.description}
      actions={
        <>
          <SecondaryAction href="/admin/books">{text.actions.adminCatalog}</SecondaryAction>
          <SecondaryAction href="/staff/circulation">{text.actions.circulationDesk}</SecondaryAction>
          <SecondaryAction href="/staff/members">{text.actions.borrowers}</SecondaryAction>
        </>
      }
    >
      {!canUseAdminDashboard ? <Notice tone="error" message={text.accessDenied} /> : null}
      {error ? <div className="mb-5"><Notice tone="error" message={error} /></div> : null}

      <section className="rounded-3xl border border-[#DDE5F4] bg-[#F4F7FB] p-4 shadow-[0_24px_60px_rgba(7,7,88,0.10)] md:p-6">
        <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#337AB7]">{text.breadcrumb}</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-[#000054]">{text.mainTitle}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#333333]">
                {text.mainDescription}
              </p>
            </div>
            <GeneratedAt value={summary?.generatedAt} locale={locale} waitingLabel={text.waitingForData} />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} isLoading={isLoading} />
          ))}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
          {/* Analytics Chart */}
          <section className="rounded-2xl border border-[#EDEDF2] bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#337AB7]">Analytics</p>
                <h3 className="mt-2 text-xl font-bold text-[#000054]">7-Day Circulation Trend</h3>
              </div>
              <span className="rounded-full border border-[#DDE5F4] bg-[#F8FAFC] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#337AB7]">
                Last 7 Days
              </span>
            </div>
            
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBorrows" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#337AB7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#337AB7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#28A745" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#28A745" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E6F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8A94AD", fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8A94AD", fontWeight: 600 }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold', color: '#000054' }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#59637A', paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="borrows" name="Books Borrowed" stroke="#337AB7" strokeWidth={3} fillOpacity={1} fill="url(#colorBorrows)" />
                  <Area type="monotone" dataKey="returns" name="Books Returned" stroke="#28A745" strokeWidth={3} fillOpacity={1} fill="url(#colorReturns)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Status Donut Chart */}
          <section className="rounded-2xl border border-[#EDEDF2] bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#337AB7]">Distribution</p>
                <h3 className="mt-2 text-xl font-bold text-[#000054]">Current Loan Status</h3>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {text.live}
              </span>
            </div>

            <div className="flex-1 min-h-[300px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getMockStatusData(summary)}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {getMockStatusData(summary).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold', color: '#000054' }}
                    itemStyle={{ fontWeight: 600, color: '#333333' }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: '#59637A', paddingLeft: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner total counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-[120px]">
                 <span className="text-[#8A94AD] text-[10px] font-black uppercase tracking-wider">Total Active</span>
                 <span className="text-3xl font-serif font-bold text-[#000054] mt-1">{summary?.activeLoans ?? 0}</span>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-[#EDEDF2] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#337AB7]">{text.actionCenter}</p>
              <h3 className="mt-2 text-xl font-bold text-[#000054]">{text.attention}</h3>
            </div>
            <Link href="/staff/loans" className="text-sm font-bold text-[#E60028] transition hover:text-[#000054]">
              {text.openLoanMonitor}
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((item) => (
              <ActionCard key={item.title} item={item} />
            ))}
          </div>
        </section>
      </section>
    </CatalogShell>
  );
}

function MetricCard({ metric, isLoading }: { metric: Metric; isLoading: boolean }) {
  const toneClass = {
    blue: "text-[#337AB7] bg-[#337AB7]/10",
    red: "text-rose-700 bg-rose-50",
    green: "text-emerald-700 bg-emerald-50",
    gold: "text-yellow-700 bg-yellow-50",
  }[metric.tone];

  return (
    <article className="group rounded-2xl border border-[#EDEDF2] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#8A94AD]">{metric.label}</p>
          <p className="mt-2 font-serif text-3xl font-bold text-[#000054]">{isLoading ? "..." : metric.value}</p>
        </div>
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-sm ${toneClass}`}>
          <Icon name={metric.iconName} size={24} />
        </span>
      </div>
      <p className="mt-4 text-xs font-semibold leading-5 text-[#333333]/75">{metric.helper}</p>
    </article>
  );
}

function ActionCard({ item }: { item: ActionItem }) {
  const toneClass = {
    red: "border-l-[#E60028] bg-rose-50",
    green: "border-l-emerald-500 bg-emerald-50",
    gold: "border-l-yellow-500 bg-yellow-50",
  }[item.tone];

  return (
    <Link
      href={item.href}
      className={`group block rounded-2xl border border-[#E6ECF6] border-l-4 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-bold text-[#000054] transition group-hover:text-[#337AB7]">{item.title}</h4>
          <p className="mt-1 text-sm leading-6 text-[#333333]">{item.description}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#000054] shadow-sm">{item.value}</span>
      </div>
    </Link>
  );
}

function GeneratedAt({ value, locale, waitingLabel }: { value?: string; locale: "en" | "vi"; waitingLabel: string }) {
  if (!value) {
    return <span className="rounded-full border border-[#DDE5F4] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#333333]/70">{waitingLabel}</span>;
  }

  return <span className="rounded-full border border-[#DDE5F4] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#337AB7]">{formatDateTime(value, locale)}</span>;
}

function numberOf(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatNumber(value?: number, locale: "en" | "vi" = "en") {
  return numberOf(value).toLocaleString(locale === "vi" ? "vi-VN" : "en-US");
}

function formatCurrency(value?: number, locale: "en" | "vi" = "en") {
  return typeof value === "number" ? (
    <>
      {value.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} <span className="text-[0.7em] opacity-80 font-bold">VND</span>
    </>
  ) : (
    <>0 <span className="text-[0.7em] opacity-80 font-bold">VND</span></>
  );
}

function formatDateTime(value: string, locale: "en" | "vi") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMockStatusData(summary: StaffDashboardSummary | null) {
  return [
    { name: "Active Loans", value: numberOf(summary?.activeLoans), color: "#337AB7" },
    { name: "Overdue", value: numberOf(summary?.overdueLoans), color: "#E60028" },
    { name: "Holds Ready", value: numberOf(summary?.holdsReadyForPickup), color: "#28A745" },
  ];
}
