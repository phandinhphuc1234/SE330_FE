"use client";

import { Suspense } from "react";
import { PaymentPage } from "@/features/payment/components/PaymentPage";

export default function PaymentRoute() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-[#000054]">Loading...</div>}>
      <PaymentPage />
    </Suspense>
  );
}
