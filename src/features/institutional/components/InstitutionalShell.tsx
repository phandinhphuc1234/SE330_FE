import { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

type InstitutionalShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  children: ReactNode;
};

export function InstitutionalShell({ eyebrow, title, description, imageUrl, children }: InstitutionalShellProps) {
  return (
    <div className="min-h-dvh bg-[#F7F3EA]">
      <Navbar />
      <header className="relative min-h-[calc(100dvh-4.5rem)] overflow-hidden bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,20,18,0.82)_0%,rgba(43,39,35,0.58)_48%,rgba(90,28,43,0.22)_100%)]" />
        <div className="relative mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-7xl flex-col justify-center px-5 pb-28 pt-14 text-white lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E1C38B]">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl font-semibold leading-[1.06] tracking-[-0.025em] md:text-6xl lg:text-7xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">{description}</p>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="outline-none">{children}</main>
      <Footer />
    </div>
  );
}

export function SectionBand({ children, tone = "white" }: { children: ReactNode; tone?: "white" | "soft" | "navy" }) {
  const classes =
    tone === "navy"
      ? "bg-[#2B2723] text-[#FFFCF5]"
      : tone === "soft"
        ? "bg-[#F7F3EA] text-[#2B2723]"
        : "bg-[#FFFCF5] text-[#2B2723]";

  return <section className={`${classes} px-5 py-16 lg:px-8`}><div className="mx-auto max-w-7xl">{children}</div></section>;
}

export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#DED5C8] bg-[#FFFCF5] p-6 shadow-[0_12px_32px_rgba(43,39,35,0.06)]">
      <p className="text-xs font-bold uppercase tracking-wide text-[#7A263A]">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-[#2B2723]">{value}</p>
    </div>
  );
}

export function TextCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-[#DED5C8] bg-[#FFFCF5] p-7 shadow-[0_12px_32px_rgba(43,39,35,0.06)] transition hover:border-[#CBBDAA] hover:shadow-[0_16px_34px_rgba(43,39,35,0.10)]">
      <h3 className="font-serif text-2xl font-semibold text-[#171412]">{title}</h3>
      <p className="mt-3 leading-7 text-[#5F574F]">{body}</p>
    </article>
  );
}
