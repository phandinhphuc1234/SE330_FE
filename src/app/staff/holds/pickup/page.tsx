import { Suspense } from "react";
import { HoldPickupPage } from "@/features/circulation/components/HoldPickupPage";

export default function HoldPickupRoute() {
  return (
    <Suspense fallback={<HoldPickupFallback />}>
      <HoldPickupPage />
    </Suspense>
  );
}

function HoldPickupFallback() {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-dvh items-center justify-center bg-[#F7F3EA] px-5 outline-none">
      <div className="w-full max-w-md rounded-2xl border border-[#DED5C8] bg-white p-8 text-center shadow-[0_24px_60px_rgba(43,39,35,0.14)]">
        <h1 className="font-serif text-3xl font-bold text-[#2B2723]">Preparing hold pickup...</h1>
      </div>
    </main>
  );
}
