"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { useNotifications } from "@/features/notifications/context/NotificationContext";
import {
  libraryAnnouncements,
  LocalizedText,
  NoticeCategory,
  NoticeLocale,
  NoticeRole,
  noticePageText,
  quickActions,
  roleNotices,
} from "./notices-content";

type NoticeFilter = "all" | NoticeCategory;

type FeedNotice = {
  id: string;
  sourceId?: string;
  category: NoticeCategory;
  title: string;
  body: string;
  meta: string;
  time: string;
  href: string;
  actionLabel: string;
  read: boolean;
};

const categoryIcons = {
  action: "alert-circle",
  borrowing: "book-open",
  announcement: "bell",
  account: "user",
} as const;

const quickActionIcons = {
  borrows: "book-open",
  holds: "bookmark",
  fines: "credit-card",
  profile: "user",
  circulation: "refresh-cw",
  pickup: "bookmark",
  members: "users",
  imports: "upload",
  dashboard: "trending-up",
  payments: "credit-card",
  books: "book",
  register: "user-check",
  guide: "book-open",
} as const;

const filterValues: NoticeFilter[] = ["all", "action", "borrowing", "announcement", "account"];

export function NoticesPage() {
  const { locale } = useLanguage();
  const { currentUser, hasAdminAccess, hasStaffAccess, isAuthenticated } = useAuth();
  const { markAllRead, markRead, notifications } = useNotifications();
  const role: NoticeRole = hasAdminAccess ? "admin" : hasStaffAccess ? "staff" : isAuthenticated ? "member" : "guest";
  const copy = (value: LocalizedText) => value[locale];
  const [activeFilter, setActiveFilter] = useState<NoticeFilter>("all");
  const [query, setQuery] = useState("");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [locallyRead, setLocallyRead] = useState<Set<string>>(() => new Set());
  const [webEnabled, setWebEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const feed = useMemo<FeedNotice[]>(() => {
    const storedFeed: FeedNotice[] = isAuthenticated
      ? notifications.map((notification) => ({
          id: `stored-${notification.id}`,
          sourceId: notification.id,
          category: notification.tone === "error" ? "action" : "account",
          title: notification.title,
          body: notification.body ?? (locale === "vi" ? "Cập nhật mới từ hệ thống thư viện." : "A new update from the library system."),
          meta: locale === "vi" ? "Thông báo hệ thống" : "System notification",
          time: formatNotificationTime(notification.createdAt, locale),
          href: notification.href ?? "/notices",
          actionLabel: locale === "vi" ? "Mở thông báo" : "Open notice",
          read: notification.read,
        }))
      : [];

    const roleFeed = roleNotices[role].map((notice) => ({
      id: notice.id,
      category: notice.category,
      title: notice.title[locale],
      body: notice.body[locale],
      meta: notice.meta[locale],
      time: notice.time[locale],
      href: notice.href,
      actionLabel: notice.actionLabel[locale],
      read: Boolean(notice.read),
    }));

    return [...storedFeed, ...roleFeed];
  }, [isAuthenticated, locale, notifications, role]);

  const resolvedFeed = useMemo(
    () => feed.map((notice) => ({ ...notice, read: notice.read || locallyRead.has(notice.id) })),
    [feed, locallyRead],
  );

  const visibleNotices = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale === "vi" ? "vi-VN" : "en-US");

    return resolvedFeed.filter((notice) => {
      const matchesCategory = activeFilter === "all" || notice.category === activeFilter;
      const matchesReadState = !showOnlyUnread || !notice.read;
      const searchableText = `${notice.title} ${notice.body} ${notice.meta}`.toLocaleLowerCase(locale === "vi" ? "vi-VN" : "en-US");
      const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesCategory && matchesReadState && matchesSearch;
    });
  }, [activeFilter, locale, query, resolvedFeed, showOnlyUnread]);

  const unreadCount = resolvedFeed.filter((notice) => !notice.read).length;
  const actionCount = resolvedFeed.filter((notice) => notice.category === "action" && !notice.read).length;
  const announcementCount = resolvedFeed.filter((notice) => notice.category === "announcement").length;
  const accountCount = resolvedFeed.filter((notice) => notice.category === "account").length;
  const eyebrow = role === "admin"
    ? copy(noticePageText.adminEyebrow)
    : role === "staff"
      ? copy(noticePageText.staffEyebrow)
      : role === "member"
        ? copy(noticePageText.eyebrow)
        : copy(noticePageText.guestEyebrow);

  const markNoticeRead = (notice: FeedNotice) => {
    setLocallyRead((current) => new Set(current).add(notice.id));
    if (notice.sourceId) markRead(notice.sourceId);
  };

  const handleMarkAllRead = () => {
    setLocallyRead(new Set(resolvedFeed.map((notice) => notice.id)));
    markAllRead();
  };

  return (
    <div className="min-h-dvh bg-[#FBF7EF] text-[#241C19]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <section className="relative isolate overflow-hidden border-b border-[#E2D6C8] px-4 pb-9 pt-10 sm:px-6 sm:pb-11 sm:pt-12 lg:px-8 lg:pt-14">
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-55"
            style={{ backgroundImage: "url('/landing/library-notices-background.png')" }}
          />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,252,246,0.92),rgba(255,249,241,0.82))]" />
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#8D2840] sm:text-xs">{eyebrow}</p>
                <h1 className="mt-4 max-w-4xl font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#481522] sm:text-6xl lg:text-[4rem]">
                  {copy(noticePageText.title)}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[#625850] sm:text-lg">
                  {role === "guest" ? copy(noticePageText.guestDescription) : copy(noticePageText.description)}
                </p>
              </div>
              <div className="flex min-w-64 items-center gap-4 rounded-[1.35rem] border border-[#DDCFC0] bg-white/80 p-5 shadow-[0_18px_45px_rgba(77,45,34,0.08)] backdrop-blur-sm">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-[#F8E8E6] text-[#8D2840]">
                  <Icon name="book-open" size={26} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-serif text-3xl font-semibold text-[#7A263A]">{unreadCount} {copy(noticePageText.unread)}</p>
                  <p className="mt-0.5 text-sm font-medium text-[#6C625B]">{resolvedFeed.length} {copy(noticePageText.thisMonth)}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[1.35rem] border border-[#E2D6C8] bg-white/60 p-3 shadow-[0_12px_34px_rgba(72,44,32,0.05)] backdrop-blur-sm sm:p-4 xl:flex xl:items-center xl:justify-between xl:gap-5">
              <div className="flex flex-wrap gap-2">
                {filterValues.map((filter) => {
                  const label = filter === "all" ? noticePageText.filters.all : noticePageText.filters[filter];
                  const selected = activeFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setActiveFilter(filter)}
                      className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition sm:px-5 ${
                        selected
                          ? "border-[#7A263A] bg-[#7A263A] text-white shadow-[0_8px_22px_rgba(122,38,58,0.18)]"
                          : "border-[#DED1C4] bg-white/65 text-[#3D3530] hover:border-[#B88B76] hover:text-[#7A263A]"
                      }`}
                    >
                      {copy(label)}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row xl:mt-0">
                <label className="relative block flex-1 sm:min-w-64">
                  <span className="sr-only">{copy(noticePageText.searchPlaceholder)}</span>
                  <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#81766E]" aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={copy(noticePageText.searchPlaceholder)}
                    className="h-12 w-full rounded-xl border border-[#DED1C4] bg-white/80 pl-11 pr-4 text-sm text-[#2B2723] outline-none transition placeholder:text-[#91867D] focus:border-[#7A263A] focus:ring-4 focus:ring-[#7A263A]/10"
                  />
                </label>
                <button
                  type="button"
                  aria-pressed={showOnlyUnread}
                  onClick={() => setShowOnlyUnread((current) => !current)}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                    showOnlyUnread ? "border-[#7A263A] bg-[#F6E8EB] text-[#7A263A]" : "border-[#DED1C4] bg-white/80 text-[#4D443E] hover:border-[#B88B76]"
                  }`}
                >
                  <Icon name="filter" size={17} aria-hidden="true" />
                  {copy(noticePageText.unreadOnly)}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="relative px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_92%_8%,rgba(180,123,94,0.10),transparent_28%),linear-gradient(180deg,#FBF7EF_0%,#FFFDF9_100%)]" />
          <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[minmax(0,1fr)_20.5rem] xl:gap-8">
            <div className="space-y-4">
              {visibleNotices.length ? (
                visibleNotices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    categoryLabel={copy(noticePageText.categories[notice.category])}
                    markReadLabel={copy(noticePageText.markRead)}
                    onMarkRead={() => markNoticeRead(notice)}
                  />
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-[#D8C7B8] bg-white/60 px-6 py-16 text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#F7E7E5] text-[#7A263A]">
                    <Icon name="search" size={26} aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 font-serif text-3xl font-semibold">{copy(noticePageText.noResults)}</h2>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#71675F]">{copy(noticePageText.noResultsBody)}</p>
                </div>
              )}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-[#DED1C4] bg-white shadow-[0_16px_42px_rgba(72,44,32,0.07)]">
                <div className="flex items-center gap-3 border-b border-[#E8DED4] px-4 py-3.5">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#FBF2E8] text-[#9A6638]">
                    <Icon name="sparkles" size={20} aria-hidden="true" />
                  </span>
                  <h2 className="font-serif text-[1.35rem] font-semibold">{copy(noticePageText.quickActions)}</h2>
                </div>
                <div className="divide-y divide-[#EEE5DC] px-3 py-1.5">
                  {quickActions[role].map((action) => (
                    <Link key={action.id} href={action.href} className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-[#FBF4EA]">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FAE9E8] text-[#8D2840]">
                        <Icon name={quickActionIcons[action.id]} size={19} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[#2B2723]">{action.title[locale]}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-[#766C65]">{action.description[locale]}</span>
                      </span>
                      <Icon name="chevron-right" size={17} className="text-[#9A8E85] transition-transform group-hover:translate-x-0.5 group-hover:text-[#7A263A]" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
                <div className="px-4 pb-3 pt-1">
                  <button
                    type="button"
                    disabled={!unreadCount}
                    onClick={handleMarkAllRead}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#8B1F3B] px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(122,38,58,0.18)] transition hover:bg-[#6F182F] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Icon name="check" size={17} aria-hidden="true" />
                    {copy(noticePageText.markAllRead)}
                  </button>
                </div>
              </div>

              {isAuthenticated ? (
                <div className="rounded-2xl border border-[#DED1C4] bg-white p-5 shadow-[0_16px_42px_rgba(72,44,32,0.07)]">
                  <div className="flex items-center gap-3">
                    <Icon name="file-text" size={22} className="text-[#9A6638]" aria-hidden="true" />
                    <h2 className="font-serif text-2xl font-semibold">{copy(noticePageText.deliveryPreferences)}</h2>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#71675F]">{copy(noticePageText.deliveryDescription)}</p>
                  <div className="mt-4 divide-y divide-[#EEE5DC] border-y border-[#EEE5DC]">
                    <PreferenceToggle
                      icon="smartphone"
                      title={copy(noticePageText.webNotifications)}
                      description={copy(noticePageText.webNotificationsBody)}
                      enabled={webEnabled}
                      onToggle={() => setWebEnabled((current) => !current)}
                    />
                    <PreferenceToggle
                      icon="file-text"
                      title={copy(noticePageText.emailNotifications)}
                      description={currentUser?.email ?? copy(noticePageText.emailNotificationsBody)}
                      enabled={emailEnabled}
                      onToggle={() => setEmailEnabled((current) => !current)}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#DED1C4] bg-[linear-gradient(145deg,#FFFDF8,#F8EEE2)] p-4 shadow-[0_16px_42px_rgba(72,44,32,0.07)]">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F5E4E5] text-[#7A263A]">
                      <Icon name="bell" size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="font-serif text-xl font-semibold leading-tight">{copy(noticePageText.signInTitle)}</h2>
                      <p className="mt-1.5 text-xs leading-5 text-[#71675F]">{copy(noticePageText.signInBody)}</p>
                    </div>
                  </div>
                  <Link href="/login" className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#7A263A] px-5 text-sm font-bold text-white">
                    {copy(noticePageText.signIn)}
                    <Icon name="arrow-right" size={17} aria-hidden="true" />
                  </Link>
                </div>
              )}

              {isAuthenticated ? (
                <div className="rounded-2xl border border-[#DED1C4] bg-white p-5 shadow-[0_16px_42px_rgba(72,44,32,0.07)]">
                  <div className="flex items-center gap-3">
                    <Icon name="trending-up" size={21} className="text-[#9A6638]" aria-hidden="true" />
                    <h2 className="font-serif text-2xl font-semibold">{copy(noticePageText.thisWeek)}</h2>
                  </div>
                  <dl className="mt-4 divide-y divide-[#EEE5DC] text-sm">
                    <SummaryRow label={copy(noticePageText.newNotices)} value={unreadCount} />
                    <SummaryRow label={copy(noticePageText.actionsRequired)} value={actionCount} />
                    <SummaryRow label={copy(noticePageText.announcementsLabel)} value={announcementCount} />
                    <SummaryRow label={copy(noticePageText.accountUpdates)} value={accountCount} />
                  </dl>
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        <section className="border-y border-[#E2D6C8] bg-[#FFF9F1] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8D2840]">{copy(noticePageText.announcementsEyebrow)}</p>
                <h2 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#481522] sm:text-5xl">{copy(noticePageText.announcementsTitle)}</h2>
              </div>
              <Link href="/notices" className="group inline-flex items-center gap-3 text-sm font-bold text-[#7A263A]">
                {copy(noticePageText.viewAll)}
                <Icon name="arrow-right" size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
              {libraryAnnouncements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} locale={locale} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#FFFDF9] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 overflow-hidden rounded-2xl border border-[#DDCFC0] bg-[linear-gradient(110deg,#FFF9F1,#F7EDE2)] p-6 shadow-[0_16px_44px_rgba(72,44,32,0.07)] sm:flex-row sm:items-center sm:justify-between lg:px-9 lg:py-7">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#F5E4E5] text-[#7A263A]">
                <Icon name="bell" size={24} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#3B2026]">{copy(noticePageText.neverMiss)}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#71675F]">{copy(noticePageText.neverMissBody)}</p>
              </div>
            </div>
            <Link href={isAuthenticated ? "/profile" : "/login"} className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-[#8B1F3B] px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(122,38,58,0.18)] transition hover:bg-[#6F182F]">
              {copy(noticePageText.managePreferences)}
              <Icon name="arrow-right" size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function NoticeCard({
  notice,
  categoryLabel,
  markReadLabel,
  onMarkRead,
}: Readonly<{
  notice: FeedNotice;
  categoryLabel: string;
  markReadLabel: string;
  onMarkRead: () => void;
}>) {
  const icon = categoryIcons[notice.category];

  return (
    <article className={`relative overflow-hidden rounded-[1.35rem] border p-5 shadow-[0_16px_42px_rgba(72,44,32,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(72,44,32,0.10)] sm:min-h-[13.5rem] sm:p-6 ${notice.read ? "border-[#E3DAD1] bg-white/75" : "border-[#E6CCD2] bg-[linear-gradient(110deg,#FFF8F6,#FFFDFC)]"}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${notice.read ? "bg-[#B5B0AB]" : "bg-[#8B1F3B]"}`} />
      <div className="flex gap-3.5 sm:gap-5">
        <div className="relative shrink-0">
          {!notice.read ? <span className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-[#A32246] ring-4 ring-[#FFF8F6]" /> : null}
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#F7E6E4] text-[#8D2840] sm:h-16 sm:w-16">
            <Icon name={icon} size={27} aria-hidden="true" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A6638]">{categoryLabel}</p>
            <time className="text-xs font-semibold text-[#857970]">{notice.time}</time>
          </div>
          <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight text-[#371923] sm:text-3xl">{notice.title}</h2>
          <p className="mt-1 text-sm font-semibold text-[#4E4641]">{notice.meta}</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6C625B] sm:text-base">{notice.body}</p>
          <div className="mt-5 flex flex-col gap-2 min-[430px]:flex-row min-[430px]:flex-wrap">
            <Link href={notice.href} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#8B1F3B] px-5 text-sm font-bold text-white transition hover:bg-[#6F182F]">
              {notice.actionLabel}
            </Link>
            {!notice.read ? (
              <button type="button" onClick={onMarkRead} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#CFA9B2] bg-white px-5 text-sm font-bold text-[#7A263A] transition hover:bg-[#F8ECEE]">
                {markReadLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function PreferenceToggle({
  icon,
  title,
  description,
  enabled,
  onToggle,
}: Readonly<{
  icon: "smartphone" | "file-text";
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}>) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FAE9E8] text-[#8D2840]">
        <Icon name={icon} size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#302925]">{title}</p>
        <p className="mt-0.5 truncate text-xs text-[#7C7169]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-[#9A2443]" : "bg-[#C9C1BA]"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-[#615851]">{label}</dt>
      <dd className="font-bold text-[#8B1F3B]">{value}</dd>
    </div>
  );
}

function AnnouncementCard({
  announcement,
  locale,
}: Readonly<{
  announcement: (typeof libraryAnnouncements)[number];
  locale: NoticeLocale;
}>) {
  return (
    <article className="group grid h-full grid-rows-[1fr_auto] overflow-hidden rounded-2xl border border-[#DED1C4] bg-white shadow-[0_18px_44px_rgba(72,44,32,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(72,44,32,0.12)]">
      <div className="p-5 sm:min-h-[13rem] sm:p-6">
        <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.17em] text-[#98643A]">
          <span>{announcement.category[locale]}</span>
          <time className="shrink-0 text-[#776D65]">{announcement.date[locale]}</time>
        </div>
        <h3 className="mt-3 font-serif text-2xl font-semibold leading-tight text-[#3B2026] sm:text-3xl">{announcement.title[locale]}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#71675F]">{announcement.body[locale]}</p>
      </div>
      <Link href={announcement.href} aria-label={announcement.title[locale]} className="relative block h-44 overflow-hidden bg-[#E9DED2]">
        <span className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${announcement.image})` }} />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(35,24,20,0.32))]" />
        <span className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white text-[#7A263A] shadow-[0_8px_22px_rgba(35,24,20,0.18)]">
          <Icon name="arrow-right" size={18} aria-hidden="true" />
        </span>
      </Link>
    </article>
  );
}

function formatNotificationTime(value: string, locale: NoticeLocale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
