"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLanguage } from "@/features/i18n/context/LanguageContext";

type CatalogShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  protectedPage?: boolean;
  wide?: boolean;
  frameless?: boolean;
  catalogPanel?: boolean;
  compactPanelHeader?: boolean;
  hideHeader?: boolean;
  warm?: boolean;
};

export function CatalogShell({ eyebrow, title, description, children, actions, protectedPage = false, wide = false, frameless = false, catalogPanel = false, compactPanelHeader = false, hideHeader = false }: CatalogShellProps) {
  const framedSectionClass = catalogPanel
    ? "relative overflow-hidden rounded-[28px] border border-[#DED5C8] bg-[#FFFCF5]/95 p-6 shadow-[0_24px_72px_rgba(43,39,35,0.08)] md:p-10 lg:p-12"
    : "rounded-2xl border border-[#DED5C8] bg-[#FFFCF5] p-6 shadow-[0_18px_48px_rgba(43,39,35,0.07)] md:p-8 lg:p-10";
  const catalogTitleClass = compactPanelHeader
    ? "mt-3 font-serif text-5xl font-bold leading-tight tracking-[-0.035em] text-[#171412] md:text-6xl"
    : "mt-4 font-serif text-5xl font-normal leading-none tracking-[-0.04em] text-[#151515] md:text-6xl lg:text-7xl";
  const catalogDescriptionClass = compactPanelHeader
    ? "mt-3 max-w-2xl text-base leading-7 text-[#6F675E]"
    : "mt-5 max-w-2xl text-lg leading-8 text-[#6F675E]";
  const catalogHeaderClass = compactPanelHeader ? "lg:flex-row lg:items-start" : "lg:flex-row lg:items-end";

  return (
    <ProtectedGate enabled={protectedPage}>
      <div className="min-h-dvh bg-[#F7F3EA] text-[#2B2723]">
        <Navbar />
        <main id="main-content" tabIndex={-1} className={`mx-auto min-h-[calc(100dvh-4.5rem)] w-full px-4 pb-16 pt-8 outline-none sm:px-6 lg:px-8 lg:pt-12 ${wide ? "max-w-[calc(100vw-2rem)] 2xl:max-w-[1720px]" : "max-w-7xl"}`}>
          {frameless ? (
            <>
              {hideHeader ? null : (
                <section className="border-b border-[#DED5C8] px-1 pb-8 pt-3 md:px-2 lg:pb-10">
                  <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7A263A]">{eyebrow}</p>
                      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.025em] text-[#171412] md:text-5xl lg:text-6xl">{title}</h1>
                      <p className="mt-4 max-w-3xl leading-7 text-[#6F675E]">{description}</p>
                    </div>
                    {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
                  </div>
                </section>
              )}
              <div className={hideHeader ? "" : "mt-8 lg:mt-10"}>{children}</div>
            </>
          ) : (
            <section className={framedSectionClass}>
              {catalogPanel ? <CatalogPanelLines /> : null}
              <div className={`flex flex-col justify-between gap-5 ${catalogHeaderClass}`}>
                <div className="relative z-10">
                  <p className={catalogPanel ? "text-xs font-bold uppercase tracking-[0.28em] text-[#7A263A]" : "text-xs font-bold uppercase tracking-[0.18em] text-[#7A263A]"}>
                    {eyebrow}
                  </p>
                  <h1 className={catalogPanel ? catalogTitleClass : "mt-3 font-serif text-4xl font-semibold tracking-[-0.02em] text-[#171412] md:text-5xl"}>
                    {title}
                  </h1>
                  <p className={catalogPanel ? catalogDescriptionClass : "mt-3 max-w-3xl leading-7 text-[#5F574F]"}>
                    {description}
                  </p>
                </div>
                {actions ? <div className="relative z-10 flex flex-wrap gap-3">{actions}</div> : null}
              </div>
              <div className={catalogPanel ? `relative z-10 ${compactPanelHeader ? "mt-8" : "mt-10"}` : "mt-8"}>{children}</div>
            </section>
          )}
        </main>
        <Footer />
      </div>
    </ProtectedGate>
  );
}

function CatalogPanelLines() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-0 h-80 w-[58%] text-black/10"
      viewBox="0 0 820 340"
      fill="none"
      preserveAspectRatio="none"
    >
      {Array.from({ length: 9 }).map((_, index) => (
        <path
          key={index}
          d={`M${40 + index * 18} 330C190 ${128 - index * 10} 356 ${118 + index * 14} 482 ${166 - index * 8}C622 ${220 + index * 4} 670 ${36 + index * 12} 828 ${18 + index * 8}`}
          stroke="currentColor"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

function ProtectedGate({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitializing, refresh } = useAuth();
  const { locale } = useLanguage();
  const [isRecoveringSession, setIsRecoveringSession] = useState(false);
  const copy = locale === "vi"
    ? {
        checking: "Đang kiểm tra phiên đăng nhập...",
        redirecting: "Đang chuyển đến trang đăng nhập...",
      }
    : {
        checking: "Checking your session...",
        redirecting: "Redirecting to login...",
      };

  useEffect(() => {
    if (!enabled || isInitializing || isAuthenticated) return;

    let isCancelled = false;
    const recoverTimerId = window.setTimeout(() => {
      if (!isCancelled) {
        setIsRecoveringSession(true);
      }
    }, 0);

    refresh()
      .then((result) => {
        if (!isCancelled && !result) {
          router.replace("/login");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsRecoveringSession(false);
        }
      });

    return () => {
      isCancelled = true;
      window.clearTimeout(recoverTimerId);
    };
  }, [enabled, isAuthenticated, isInitializing, refresh, router]);

  if (!enabled) return children;

  if (isInitializing || isRecoveringSession) {
    return <AuthStatus message={copy.checking} />;
  }

  if (!isAuthenticated) {
    return <AuthStatus message={copy.redirecting} />;
  }

  return children;
}

function AuthStatus({ message }: { message: string }) {
  const { locale } = useLanguage();
  const copy = locale === "vi"
    ? { eyebrow: "Xác thực", backHome: "Về trang chủ" }
    : { eyebrow: "Authenticating", backHome: "Back home" };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F7F3EA] px-5">
      <div className="w-full max-w-md rounded-2xl border border-[#DED5C8] bg-white p-8 text-center shadow-[0_24px_60px_rgba(43,39,35,0.14)]">
        <p className="text-sm font-bold uppercase tracking-wide text-[#7A263A]">{copy.eyebrow}</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-[#171412]">{message}</h1>
        <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-[#D8CCBC] bg-[#FFFCF5] px-4 py-2 text-sm font-bold text-[#2B2723] transition hover:border-[#7A263A] hover:text-[#7A263A]">
          {copy.backHome}
        </Link>
      </div>
    </main>
  );
}

export function PrimaryAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-xl bg-[#7A263A] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(122,38,58,0.18)] transition hover:bg-[#5A1C2B]"
    >
      {children}
    </Link>
  );
}

export function SecondaryAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-xl border border-[#D8CCBC] bg-[#FFFCF5] px-5 py-3 text-sm font-bold text-[#2B2723] transition hover:border-[#7A263A] hover:bg-[#F1EADF] hover:text-[#7A263A]"
    >
      {children}
    </Link>
  );
}

export function Notice({
  message,
  tone = "info",
  autoDismiss,
  duration = 30000,
}: {
  message: string;
  tone?: "info" | "error" | "success";
  autoDismiss?: boolean;
  duration?: number;
}) {
  return <DismissibleNotice key={`${tone}-${message}`} message={message} tone={tone} autoDismiss={autoDismiss} duration={duration} />;
}

function DismissibleNotice({
  message,
  tone = "info",
  autoDismiss,
  duration = 30000,
}: {
  message: string;
  tone?: "info" | "error" | "success";
  autoDismiss?: boolean;
  duration?: number;
}) {
  const [isMounted, setIsMounted] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const shouldDismiss = autoDismiss ?? tone !== "info";

  useEffect(() => {
    if (!shouldDismiss) return;

    const fadeTimerId = window.setTimeout(() => {
      setIsLeaving(true);
    }, duration);
    const removeTimerId = window.setTimeout(() => {
      setIsMounted(false);
    }, duration + 350);

    return () => {
      window.clearTimeout(fadeTimerId);
      window.clearTimeout(removeTimerId);
    };
  }, [duration, message, shouldDismiss, tone]);

  if (!isMounted) return null;

  const classes =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-[#DED5C8] bg-[#FFFCF5] text-[#5F574F]";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ease-out ${
        isLeaving ? "-translate-y-1 opacity-0" : "translate-y-0 opacity-100"
      } ${classes}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}
