"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CatalogShell, Notice } from "@/features/catalog/components/CatalogShell";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { getStaffBorrowStatistics } from "@/features/circulation/services/circulationService";
import { BorrowStatisticsResult, BorrowStatDay } from "@/features/circulation/types/circulation.type";
import { Category } from "@/features/catalog/types/catalog.type";
import { getCategories } from "@/features/catalog/services/catalogService";
import { entityIdOf } from "@/features/catalog/components/catalogHelpers";

// ─── i18n ───────────────────────────────────────────────────────────────────

const copy = {
  en: {
    eyebrow: "Reports",
    title: "Borrow & return statistics",
    description: "Overview of borrowing and return activity over the last 21 days.",
    fromLabel: "From",
    toLabel: "To",
    maxRangeNote: "Max 21 days",
    filterBy: "Filter by",
    filterTypes: { none: "All books", category: "Category", isbn: "ISBN", title: "Book title" },
    filterPlaceholder: { none: "", category: "e.g. Science Fiction", isbn: "e.g. 978-3-16-148410-0", title: "e.g. The Great Gatsby" },
    apply: "Apply",
    clear: "Clear filter",
    totalBorrowed: "Total borrowed",
    totalReturned: "Total returned",
    netOnLoan: "Net on loan",
    peakDay: "Peak day",
    chartTitle: "Daily borrow & return",
    legendBorrow: "Borrowed",
    legendReturn: "Returned",
    noData: "No borrow activity found for this period.",
    loading: "Loading statistics…",
    loadError: "Could not load statistics.",
    dateRangeError: "End date must be after start date.",
    rangeExceededError: "Date range cannot exceed 21 days.",
    activeFilter: "Filtering by",
  },
  vi: {
    eyebrow: "Báo cáo",
    title: "Thống kê mượn & trả sách",
    description: "Tổng quan hoạt động mượn và trả sách trong 21 ngày gần nhất.",
    fromLabel: "Từ ngày",
    toLabel: "Đến ngày",
    maxRangeNote: "Tối đa 21 ngày",
    filterBy: "Lọc theo",
    filterTypes: { none: "Tất cả sách", category: "Thể loại", isbn: "ISBN", title: "Tên sách" },
    filterPlaceholder: { none: "", category: "Ví dụ: Khoa học viễn tưởng", isbn: "Ví dụ: 978-3-16-148410-0", title: "Ví dụ: Tắt Đèn" },
    apply: "Áp dụng",
    clear: "Xóa bộ lọc",
    totalBorrowed: "Tổng lượt mượn",
    totalReturned: "Tổng lượt trả",
    netOnLoan: "Đang cho mượn",
    peakDay: "Ngày cao nhất",
    chartTitle: "Lượt mượn & trả theo ngày",
    legendBorrow: "Mượn",
    legendReturn: "Trả",
    noData: "Không có dữ liệu mượn/trả trong khoảng thời gian này.",
    loading: "Đang tải thống kê…",
    loadError: "Không thể tải dữ liệu thống kê.",
    dateRangeError: "Ngày kết thúc phải sau ngày bắt đầu.",
    rangeExceededError: "Khoảng thời gian không được vượt quá 21 ngày.",
    activeFilter: "Đang lọc theo",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

type FilterType = "none" | "category" | "isbn" | "title";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function diffDays(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}
function shortDate(s: string, locale: "en" | "vi") {
  return new Date(s + "T00:00:00").toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric" });
}

// ─── SVG Chart ───────────────────────────────────────────────────────────────

function BorrowChart({ days, locale }: { days: BorrowStatDay[]; locale: "en" | "vi" }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!days.length) return null;

  const W = 800;
  const H = 240;
  const PAD = { top: 20, right: 20, bottom: 52, left: 44 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...days.flatMap((d) => [d.borrowed, d.returned]), 1);
  const yTicks = 4;

  const xp = (i: number) => PAD.left + (i / Math.max(days.length - 1, 1)) * cW;
  const yp = (v: number) => PAD.top + cH - (v / maxVal) * cH;

  const linePts = (key: "borrowed" | "returned") =>
    days.map((d, i) => `${xp(i)},${yp(d[key])}`).join(" ");

  const areaPath = (key: "borrowed" | "returned") => {
    const pts = days.map((d, i) => `${xp(i)},${yp(d[key])}`);
    return `M${xp(0)},${PAD.top + cH} ${pts.join(" L")} L${xp(days.length - 1)},${PAD.top + cH} Z`;
  };

  const GREEN = "#3B6D11";
  const ORANGE = "#854F0B";
  const segW = cW / Math.max(days.length - 1, 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Biểu đồ lượt mượn và trả sách theo ngày" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#639922" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#639922" stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF9F27" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#EF9F27" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = Math.round((maxVal / yTicks) * i);
        const y = yp(v);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y} stroke="#E5E7EB" strokeWidth={i === 0 ? 1 : 0.5} strokeDasharray={i === 0 ? "0" : "4,4"} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9CA3AF">{v}</text>
          </g>
        );
      })}

      {/* X labels */}
      {days.map((d, i) => {
        if (days.length > 14 && i % 2 !== 0) return null;
        return (
          <text key={d.date} x={xp(i)} y={H - 10} textAnchor="middle" fontSize="11"
            fill={hovered === i ? "#111827" : "#9CA3AF"}
            fontWeight={hovered === i ? "bold" : "normal"}>
            {shortDate(d.date, locale)}
          </text>
        );
      })}

      {/* Area fills */}
      <path d={areaPath("borrowed")} fill="url(#gB)" />
      <path d={areaPath("returned")} fill="url(#gR)" />

      {/* Lines */}
      <polyline points={linePts("borrowed")} fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={linePts("returned")} fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6,3" />

      {/* Vertical hover line */}
      {hovered !== null && (
        <line x1={xp(hovered)} y1={PAD.top} x2={xp(hovered)} y2={PAD.top + cH}
          stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3" />
      )}

      {/* Dots */}
      {days.map((d, i) => (
        <g key={d.date}>
          <circle cx={xp(i)} cy={yp(d.borrowed)} r={hovered === i ? 6 : 4.5} fill={GREEN}
            stroke={hovered === i ? "#fff" : "none"} strokeWidth="2" />
          <circle cx={xp(i)} cy={yp(d.returned)} r={hovered === i ? 6 : 4.5} fill={ORANGE}
            stroke="#fff" strokeWidth="1.5" />
        </g>
      ))}

      {/* Invisible hover zones */}
      {days.map((d, i) => (
        <rect key={d.date}
          x={xp(i) - segW / 2} y={PAD.top}
          width={segW} height={cH}
          fill="transparent"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: "crosshair" }}
        />
      ))}

      {/* Tooltip */}
      {hovered !== null && (() => {
        const d = days[hovered];
        const x = xp(hovered);
        const flipLeft = x > W * 0.65;
        const TW = 160; const TH = 88;
        const TX = flipLeft ? x - TW - 14 : x + 14;
        const TY = PAD.top + cH / 2 - TH / 2;
        const fullDate = new Date(d.date + "T00:00:00").toLocaleDateString(
          locale === "vi" ? "vi-VN" : "en-US",
          { weekday: "short", day: "numeric", month: "short", year: "numeric" }
        );
        return (
          <g style={{ pointerEvents: "none" }}>
            {/* Shadow */}
            <rect x={TX + 2} y={TY + 2} width={TW} height={TH} rx="8" fill="rgba(0,0,0,0.10)" />
            {/* Box */}
            <rect x={TX} y={TY} width={TW} height={TH} rx="8" fill="#111827" />
            {/* Date */}
            <text x={TX + 12} y={TY + 20} fontSize="11" fontWeight="600" fill="#9CA3AF">{fullDate}</text>
            {/* Divider */}
            <line x1={TX + 12} y1={TY + 28} x2={TX + TW - 12} y2={TY + 28} stroke="#374151" strokeWidth="0.5" />
            {/* Borrowed row */}
            <rect x={TX + 12} y={TY + 38} width="10" height="10" rx="2" fill={GREEN} />
            <text x={TX + 28} y={TY + 48} fontSize="12" fill="#D1D5DB">{locale === "vi" ? "Mượn" : "Borrowed"}</text>
            <text x={TX + TW - 12} y={TY + 48} fontSize="13" fontWeight="bold" fill={GREEN} textAnchor="end">{d.borrowed}</text>
            {/* Returned row */}
            <rect x={TX + 12} y={TY + 60} width="10" height="10" rx="2" fill={ORANGE} />
            <text x={TX + 28} y={TY + 70} fontSize="12" fill="#D1D5DB">{locale === "vi" ? "Trả" : "Returned"}</text>
            <text x={TX + TW - 12} y={TY + 70} fontSize="13" fontWeight="bold" fill={ORANGE} textAnchor="end">{d.returned}</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, colorClass }: { label: string; value: string; sub?: string; colorClass: string }) {
  return (
    <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#337AB7]">{label}</p>
      <p className={`mt-2 text-4xl font-bold ${colorClass}`}>{value}</p>
      {sub && <p className="mt-1 text-sm text-[#6B7280]">{sub}</p>}
    </div>
  );
}

// ─── Peak day card with toggle ───────────────────────────────────────────────

type PeakMode = "both" | "borrow" | "return";

function PeakDayCard({ locale, peakBorrowDay, peakReturnDay, days }: {
  locale: "en" | "vi";
  peakBorrowDay: BorrowStatDay | null;
  peakReturnDay: BorrowStatDay | null;
  days: BorrowStatDay[];
}) {
  const [mode, setMode] = useState<PeakMode>("borrow");

  const modes: { key: PeakMode; label: string }[] = [
    { key: "borrow", label: locale === "vi" ? "Mượn" : "Borrow" },
    { key: "return", label: locale === "vi" ? "Trả" : "Return" },
    { key: "both",   label: locale === "vi" ? "Cả hai" : "Both" },
  ];

  // Ngày có tổng mượn + trả cao nhất
  const peakBothDay = days.length
    ? days.reduce((best, d) =>
        (d.borrowed + d.returned) > (best.borrowed + best.returned) ? d : best, days[0])
    : null;

  const GREEN  = "text-[#3B6D11]";
  const ORANGE = "text-[#854F0B]";
  const PURPLE = "text-[#6B21A8]";

  const borrowLine = peakBorrowDay
    ? `${shortDate(peakBorrowDay.date, locale)} — ${peakBorrowDay.borrowed} ${locale === "vi" ? "lượt" : "loans"}`
    : "—";
  const returnLine = peakReturnDay
    ? `${shortDate(peakReturnDay.date, locale)} — ${peakReturnDay.returned} ${locale === "vi" ? "lượt" : "returns"}`
    : "—";
  const bothLine = peakBothDay
    ? `${shortDate(peakBothDay.date, locale)} — ${peakBothDay.borrowed + peakBothDay.returned} ${locale === "vi" ? "lượt" : "total"}`
    : "—";

  return (
    <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
      {/* Header + toggle */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[#337AB7]">
          {locale === "vi" ? "Ngày cao nhất" : "Peak day"}
        </p>
        <div className="flex rounded-lg border border-[#EDEDF2] bg-[#F8F9FA] p-0.5">
          {modes.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition ${
                mode === key
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-[#9CA3AF] hover:text-[#111827]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Value */}
      <div className="mt-2">
        {mode === "borrow" && (
          <p className={`text-xl font-bold leading-tight ${GREEN}`}>{borrowLine}</p>
        )}
        {mode === "return" && (
          <p className={`text-xl font-bold leading-tight ${ORANGE}`}>{returnLine}</p>
        )}
        {mode === "both" && (
          <p className={`text-xl font-bold leading-tight ${PURPLE}`}>{bothLine}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function BorrowStatisticsPage() {
  const { locale } = useLanguage();
  const t = copy[locale];
  const { accessToken, refresh } = useAuth();
  const refreshFn = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  const [fromDate, setFromDate] = useState(daysAgoStr(20));
  const [toDate, setToDate] = useState(todayStr());
  const [dateError, setDateError] = useState("");

  const [filterType, setFilterType] = useState<FilterType>("none");
  const [filterValue, setFilterValue] = useState("");
  const [language, setLanguage] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<{ type: FilterType; value: string }>({ type: "none", value: "" });

  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<BorrowStatisticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  function validateDates(f: string, t2: string) {
    const diff = diffDays(f, t2);
    if (diff < 0) return t.dateRangeError;
    if (diff > 20) return t.rangeExceededError;
    return "";
  }

  async function loadStats(from: string, to: string, filter: { type: FilterType; value: string }, lang = language) {
    const err = validateDates(from, to);
    if (err) { setDateError(err); return; }
    setDateError("");
    setIsLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams({ from, to });
      if (filter.type !== "none" && filter.value) {
        params.set("filterType", filter.type);
        params.set("filterValue", filter.value);
      }
      if (lang) params.set("language", lang);
      const data = await getStaffBorrowStatistics(params, accessToken, refreshFn);
      setStats(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t.loadError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStats(fromDate, toDate, appliedFilter);
    getCategories().then(setCategories).catch(() => []);
  }, []); // eslint-disable-line

  function handleFromChange(v: string) {
    setFromDate(v);
    setDateError(validateDates(v, toDate));
  }
  function handleToChange(v: string) {
    setToDate(v);
    setDateError(validateDates(fromDate, v));
  }
  function handleApply() {
    const f = filterType !== "none" && filterValue.trim()
      ? { type: filterType, value: filterValue.trim() }
      : { type: "none" as FilterType, value: "" };
    setAppliedFilter(f);
    loadStats(fromDate, toDate, f, language);
  }
  function handleClear() {
    const defaultFrom = daysAgoStr(20);
    const defaultTo = todayStr();
    setFromDate(defaultFrom);
    setToDate(defaultTo);
    setDateError("");
    setFilterType("none");
    setFilterValue("");
    setLanguage("");
    const f = { type: "none" as FilterType, value: "" };
    setAppliedFilter(f);
    loadStats(defaultFrom, defaultTo, f, "");
  }

  const hasFilter = appliedFilter.type !== "none" && appliedFilter.value !== "";

  // Peak day computed from days array for both borrow and return
  const peakBorrowDay = stats?.days.length
    ? stats.days.reduce((best, d) => d.borrowed > best.borrowed ? d : best, stats.days[0])
    : null;
  const peakReturnDay = stats?.days.length
    ? stats.days.reduce((best, d) => d.returned > best.returned ? d : best, stats.days[0])
    : null;
  const peakLabel = stats?.peakBorrowDate
    ? `${shortDate(stats.peakBorrowDate, locale)} — ${stats.peakBorrowCount} lượt`
    : "—";

  return (
    <CatalogShell
      protectedPage
      wide
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
    >
      {loadError && <div className="mb-5"><Notice tone="error" message={loadError} /></div>}

      {/* ── Controls + Stats panel ── */}
      <section className="overflow-hidden rounded-3xl border border-[#DDE5F4] bg-white shadow-[0_24px_60px_rgba(7,7,88,0.08)]">

        {/* ══ FILTER BAR — h-14 giống hệt Books ══ */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[#EDEDF2] px-5 py-4">

          {/* Date range — 2 ô riêng giống Books inputs */}
          <div className="inline-flex h-14 items-center gap-1 rounded-2xl border border-[#D5DBE8] bg-white px-4 transition focus-within:border-[#111827] focus-within:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]">
            <svg className="shrink-0 text-[#5F6B85]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => handleFromChange(e.target.value)}
              className="w-[120px] border-none bg-transparent text-sm font-bold text-[#111827] outline-none"
            />
            <span className="px-1 text-[#9CA3AF]" aria-hidden="true">→</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => handleToChange(e.target.value)}
              className="w-[120px] border-none bg-transparent text-sm font-bold text-[#111827] outline-none"
            />
          </div>

          {/* All categories — h-14 rounded-2xl giống Books */}
          <label className="relative inline-flex h-14 cursor-pointer items-center gap-2 rounded-2xl border border-[#D5DBE8] bg-white px-5 text-sm font-bold text-[#111827] transition hover:border-[#111827] hover:bg-[#F8FAFC] focus-within:border-[#111827] focus-within:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]">
            <span className="pointer-events-none whitespace-nowrap">
              {filterType === "category" && filterValue ? filterValue : (locale === "vi" ? "Tất cả thể loại" : "All categories")}
            </span>
            <svg className="pointer-events-none shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            <select
              value={filterType === "category" ? filterValue : ""}
              onChange={(e) => {
                if (!e.target.value) { setFilterType("none"); setFilterValue(""); }
                else { setFilterType("category"); setFilterValue(e.target.value); }
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
              <option value="">{locale === "vi" ? "Tất cả thể loại" : "All categories"}</option>
              {categories.map((cat) => (
                <option key={entityIdOf(cat)} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </label>

          {/* All languages — h-14 rounded-2xl giống Books */}
          <label className="relative inline-flex h-14 cursor-pointer items-center gap-2 rounded-2xl border border-[#D5DBE8] bg-white px-5 text-sm font-bold text-[#111827] transition hover:border-[#111827] hover:bg-[#F8FAFC] focus-within:border-[#111827] focus-within:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]">
            <span className="pointer-events-none whitespace-nowrap">
              {language === "en" ? "English" : language === "vi" ? "Tiếng Việt" : (locale === "vi" ? "Tất cả ngôn ngữ" : "All languages")}
            </span>
            <svg className="pointer-events-none shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
              <option value="">{locale === "vi" ? "Tất cả ngôn ngữ" : "All languages"}</option>
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
            </select>
          </label>

          {/* Search — flex-1, h-14 giống Books */}
          <label className="relative inline-flex h-14 flex-1 min-w-[200px] items-center gap-2 rounded-2xl border border-[#D5DBE8] bg-white px-5 transition focus-within:border-[#111827] focus-within:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]">
            <svg className="shrink-0 text-[#5F6B85]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              value={filterType === "title" || filterType === "isbn" ? filterValue : ""}
              placeholder={locale === "vi" ? "Nhập ISBN, tên sách..." : "Search title, ISBN..."}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) { setFilterType("none"); setFilterValue(""); return; }
                setFilterType(/^[\d\-]+$/.test(v) ? "isbn" : "title");
                setFilterValue(v);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              className="w-full border-none bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#7B8498]"
            />
          </label>

          {/* Clear — h-14 */}
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-14 items-center gap-2 rounded-2xl border border-[#D5DBE8] bg-white px-5 text-sm font-bold text-[#6B7280] transition hover:border-[#111827] hover:text-[#111827]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            {locale === "vi" ? "Xóa" : "Clear"}
          </button>

          {/* Apply — h-14 black pill giống Reset của Books */}
          <button
            type="button"
            onClick={handleApply}
            disabled={isLoading || !!dateError}
            className="inline-flex h-14 items-center gap-2 rounded-2xl bg-[#050816] px-6 text-sm font-bold text-white shadow-[0_14px_28px_rgba(5,8,22,0.24)] transition hover:-translate-y-0.5 hover:bg-black disabled:opacity-50"
          >
            {t.apply}
          </button>

          {/* Date error / hint */}
          {dateError
            ? <p className="w-full pl-1 text-xs font-semibold text-[#E60028]">{dateError}</p>
            : <p className="w-full pl-1 text-xs text-[#9CA3AF]">⏱ {t.maxRangeNote}</p>
          }
        </div>

        {/* ══ STATS CONTENT ══ */}
        <div className="p-5">

          {/* Loading */}
          {isLoading && (
            <div className="py-16 text-center">
              <p className="text-sm text-[#9CA3AF]">{t.loading}</p>
            </div>
          )}

          {/* Stats */}
          {stats && !isLoading && (
            <>
              {/* Metric cards 4 cột */}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label={t.totalBorrowed}
                  value={stats.totalBorrowed.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                  sub={locale === "vi" ? "lượt mượn trong kỳ" : "loans in period"}
                  colorClass="text-[#3B6D11]"
                />
                <StatCard
                  label={t.totalReturned}
                  value={stats.totalReturned.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                  sub={locale === "vi" ? "lượt trả trong kỳ" : "returns in period"}
                  colorClass="text-[#854F0B]"
                />
                <StatCard
                  label={t.netOnLoan}
                  value={Math.max(0, stats.netOnLoan).toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                  sub={locale === "vi" ? "chưa được trả" : "not yet returned"}
                  colorClass="text-[#185FA5]"
                />
                <PeakDayCard
                  locale={locale}
                  peakBorrowDay={peakBorrowDay}
                  peakReturnDay={peakReturnDay}
                  days={stats.days}
                />
              </div>

              {/* Chart — full width, ngay dưới metric cards */}
              <div className="mt-4 rounded-2xl bg-[#F8F9FA] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#5F6B85]">{t.chartTitle}</p>
                    <p className="mt-0.5 text-xs text-[#9CA3AF]">
                      {shortDate(fromDate, locale)} — {shortDate(toDate, locale)}
                      {hasFilter && ` · ${t.filterTypes[appliedFilter.type]}: ${appliedFilter.value}`}
                    </p>
                  </div>
                  <div className="flex gap-5 text-xs font-bold text-[#374151]">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-[3px] w-5 rounded-full bg-[#3B6D11]" />
                      {t.legendBorrow}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-[2px] w-5 rounded-full border-t-2 border-dashed border-[#854F0B]" />
                      {t.legendReturn}
                    </span>
                  </div>
                </div>
                {stats.days.length > 0 ? (
                  <BorrowChart days={stats.days} locale={locale} />
                ) : (
                  <p className="py-12 text-center text-sm text-[#9CA3AF]">{t.noData}</p>
                )}
              </div>
            </>
          )}

          {/* No data state */}
          {stats && !isLoading && stats.days.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-[#9CA3AF]">{t.noData}</p>
            </div>
          )}
        </div>
      </section>
    </CatalogShell>
  );
}
