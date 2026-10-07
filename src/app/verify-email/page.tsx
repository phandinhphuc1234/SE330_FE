import { Suspense } from "react";
import { VerifyEmailStatus } from "@/features/auth/components/VerifyEmailStatus";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailStatusFallback />}>
      <VerifyEmailStatus />
    </Suspense>
  );
}

function VerifyEmailStatusFallback() {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-dvh items-center justify-center bg-[#F7F3EA] px-5 outline-none">
      <div className="w-full max-w-md rounded-2xl border border-[#DED5C8] bg-white p-8 text-center shadow-[0_24px_60px_rgba(43,39,35,0.14)]">
        <p className="text-sm font-bold uppercase tracking-wide text-[#7A263A]">Email verification</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-[#2B2723]">Checking your verification link...</h1>
      </div>
    </main>
  );
}
