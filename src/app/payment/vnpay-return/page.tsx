import { Suspense } from "react";
import { PaymentReturnPage } from "@/features/payments/components/PaymentReturnPage";

export default function VnpayReturnRoute() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#F7F3EA]" />}>
      <PaymentReturnPage />
    </Suspense>
  );
}
