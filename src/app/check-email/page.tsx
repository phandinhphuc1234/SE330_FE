import { Suspense } from "react";
import { CheckEmailPanel } from "@/features/auth/components/CheckEmailPanel";

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<CheckEmailFallback />}>
      <CheckEmailPanel />
    </Suspense>
  );
}

function CheckEmailFallback() {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-dvh items-center justify-center bg-[#F2F2EF] px-4 outline-none">
      <div className="w-full max-w-xl rounded-[28px] border border-black/10 bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.12)]">
        <div className="mx-auto h-11 w-11 animate-pulse rounded-full bg-black/10" />
        <h1 className="mt-5 font-serif text-3xl font-bold text-black">Preparing verification...</h1>
      </div>
    </main>
  );
}
