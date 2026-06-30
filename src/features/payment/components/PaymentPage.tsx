"use client";

import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/layout/BrandMark";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  cancelPaymentOrder,
  confirmPaymentOrder,
  createPaymentOrder,
  getPaymentOrder,
} from "../services/paymentService";
import { PaymentMethod, PaymentOrder, PaymentPurpose } from "../types/payment.type";

// ── Helpers ──────────────────────────────────────────────────────
function money(amount: number, currency: string) {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function isValidPurpose(value: string | null): value is PaymentPurpose {
  return value === "EBOOK_RENEWAL" || value === "EBOOK_LOAN_FEE" || value === "FINE";
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "CARD", label: "Credit / Debit card", hint: "Visa, Mastercard, JCB" },
  { id: "WALLET", label: "E-wallet", hint: "Momo, ZaloPay, VNPay" },
  { id: "BANK_TRANSFER", label: "Bank transfer", hint: "QR / Internet banking" },
];

type Stage = "loading" | "select" | "form" | "processing" | "success" | "failed" | "error";

const PURPOSE_OPTIONS: { id: PaymentPurpose; title: string; description: string }[] = [
  {
    id: "EBOOK_RENEWAL",
    title: "Renew ebook loan",
    description: "Pay the renewal fee to extend an existing ebook loan by 14 days.",
  },
  {
    id: "EBOOK_LOAN_FEE",
    title: "Borrow new ebook",
    description: "Pay the borrowing fee to start a new ebook loan.",
  },
];

export function PaymentPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { accessToken, refresh, isAuthenticated, isInitializing } = useAuth();

  // Allow testing this page standalone (without the main login backend) by
  // setting NEXT_PUBLIC_PAYMENT_DEV_BYPASS_AUTH=true. In that mode the
  // payment backend also falls back to a mock user when no token is present.
  const devBypassAuth = process.env.NEXT_PUBLIC_PAYMENT_DEV_BYPASS_AUTH === "true";

  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CARD");
  const [card, setCard] = useState({ number: "", holder: "", expiry: "", cvv: "" });

  const refreshAccessToken = useCallback(async () => (await refresh())?.accessToken ?? null, [refresh]);

  // Create (or resume) a payment order for the given purpose, using the
  // loanId/bookId/bookTitle/amount already present in the URL (if any),
  // then switch the URL to include the resulting paymentId.
  const startPayment = useCallback(
    async (purpose: PaymentPurpose) => {
      setStage("loading");
      setErrorMessage("");
      try {
        const loanIdParam = params.get("loanId");
        const bookIdParam = params.get("bookId");
        const amountParam = params.get("amount");

        const created = await createPaymentOrder(
          {
            purpose,
            loanId: loanIdParam ? Number(loanIdParam) : undefined,
            bookId: bookIdParam ? Number(bookIdParam) : undefined,
            bookTitle: params.get("bookTitle") ?? undefined,
            amount: amountParam ? Number(amountParam) : undefined,
          },
          accessToken,
          refreshAccessToken,
        );

        // Reflect the purpose + new paymentId in the URL so a refresh
        // resumes the same order (and remembers the chosen type).
        const url = new URL(window.location.href);
        url.searchParams.set("purpose", purpose);
        url.searchParams.set("paymentId", created.paymentId);
        window.history.replaceState({}, "", url.toString());

        setOrder(created);
        setStage("form");
      } catch (err) {
        setStage("error");
        setErrorMessage(err instanceof Error ? err.message : "Could not start the payment. Please try again.");
      }
    },
    [params, accessToken, refreshAccessToken],
  );

  // ── Bootstrap: either resume an existing payment (paymentId in URL),
  // create a new one based on a purpose/loanId/bookId already present in
  // the URL, or — if no purpose was specified — let the user pick the
  // payment type themselves.
  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated && !devBypassAuth) {
      setStage("error");
      setErrorMessage("You need to be signed in to make a payment. Please sign in and try again.");
      return;
    }

    let active = true;

    async function bootstrap() {
      try {
        const existingId = params.get("paymentId");

        if (existingId) {
          const existing = await getPaymentOrder(existingId, accessToken, refreshAccessToken);
          if (!active) return;
          setOrder(existing);
          setStage(existing.status === "PENDING" ? "form" : statusToStage(existing.status));
          return;
        }

        const purpose = params.get("purpose");
        if (!isValidPurpose(purpose)) {
          // No (valid) purpose was passed in — let the user choose the
          // payment type manually instead of failing outright.
          if (!active) return;
          setStage("select");
          return;
        }

        if (!active) return;
        await startPayment(purpose);
      } catch (err) {
        if (!active) return;
        setStage("error");
        setErrorMessage(err instanceof Error ? err.message : "Could not start the payment. Please try again.");
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitializing, isAuthenticated]);

  function statusToStage(status: PaymentOrder["status"]): Stage {
    switch (status) {
      case "PAID":
        return "success";
      case "FAILED":
        return "failed";
      case "CANCELLED":
      case "EXPIRED":
        return "error";
      default:
        return "form";
    }
  }

  const submitPayment = useCallback(async () => {
    if (!order) return;

    setStage("processing");
    setErrorMessage("");

    try {
      const result = await confirmPaymentOrder(
        order.paymentId,
        {
          method,
          cardNumber: card.number || undefined,
          cardHolder: card.holder || undefined,
          expiry: card.expiry || undefined,
          cvv: card.cvv || undefined,
        },
        accessToken,
        refreshAccessToken,
      );

      setOrder(result);
      setStage(statusToStage(result.status));
      if (result.status === "FAILED") {
        setErrorMessage(result.failureReason ?? "Payment failed. Please try again.");
      }
    } catch (err) {
      setStage("error");
      setErrorMessage(err instanceof Error ? err.message : "Could not process the payment.");
    }
  }, [order, method, card, accessToken, refreshAccessToken]);

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    submitPayment();
  }

  // ── E-wallet (Momo/ZaloPay/VNPay) flow: show a QR code and, once the
  // user has had a moment to "scan" it, automatically confirm the
  // payment — simulating the wallet app notifying us of success.
  const walletAutoConfirmStarted = useRef(false);

  useEffect(() => {
    if (method !== "WALLET" || stage !== "form") {
      walletAutoConfirmStarted.current = false;
      return;
    }
    if (walletAutoConfirmStarted.current) return;
    walletAutoConfirmStarted.current = true;

    const timer = setTimeout(() => {
      submitPayment();
    }, 4000);

    return () => clearTimeout(timer);
  }, [method, stage, submitPayment]);

  async function handleCancel() {
    if (!order) {
      window.close();
      return;
    }
    try {
      await cancelPaymentOrder(order.paymentId, accessToken, refreshAccessToken);
    } catch {
      // ignore — closing the tab anyway
    }
    window.close();
  }

  function handleRetry() {
    setErrorMessage("");
    setStage("form");
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex min-h-dvh flex-col bg-[#F8F9FA]">
      <header className="bg-[#000054] px-5 py-4 lg:px-8">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <BrandMark tone="light" />
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/70">
            Secure payment
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-8 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-[#EDEDF2] bg-white shadow-[0_24px_60px_rgba(7,7,88,0.08)]">
          {stage === "loading" && <CenteredState title="Preparing your payment..." />}

          {stage === "select" && (
            <PurposeSelector onSelect={(purpose) => startPayment(purpose)} />
          )}

          {stage === "error" && (
            <CenteredState
              title="Something went wrong"
              description={errorMessage}
              tone="error"
              action={
                <button
                  onClick={() => window.close()}
                  className="rounded-full bg-[#000054] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#000080]"
                >
                  Close this tab
                </button>
              }
            />
          )}

          {order && (stage === "form" || stage === "processing") && (
            <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
              <OrderSummary order={order} />

              <div className="border-t border-[#EDEDF2] p-6 md:border-t-0 md:border-l">
                <h2 className="font-serif text-2xl font-bold text-[#000054]">Payment method</h2>

                <form onSubmit={handlePay} className="mt-4 flex flex-col gap-4">
                  <div className="grid gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <label
                        key={m.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                          method === m.id
                            ? "border-[#000054] bg-[#F4F5FA]"
                            : "border-[#EDEDF2] hover:border-[#D9DCE8]"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-[#000054]">{m.label}</p>
                          <p className="text-xs text-gray-500">{m.hint}</p>
                        </div>
                        <input
                          type="radio"
                          name="method"
                          value={m.id}
                          checked={method === m.id}
                          onChange={() => setMethod(m.id)}
                          className="h-4 w-4 accent-[#000054]"
                        />
                      </label>
                    ))}
                  </div>

                  {method === "CARD" && (
                    <div className="grid gap-3">
                      <TextField
                        label="Card number"
                        placeholder="4242 4242 4242 4242"
                        value={card.number}
                        onChange={(v) => setCard((c) => ({ ...c, number: v }))}
                        required
                      />
                      <TextField
                        label="Cardholder name"
                        placeholder="NGUYEN VAN A"
                        value={card.holder}
                        onChange={(v) => setCard((c) => ({ ...c, holder: v }))}
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <TextField
                          label="Expiry"
                          placeholder="MM/YY"
                          value={card.expiry}
                          onChange={(v) => setCard((c) => ({ ...c, expiry: v }))}
                          required
                        />
                        <TextField
                          label="CVV"
                          placeholder="123"
                          value={card.cvv}
                          onChange={(v) => setCard((c) => ({ ...c, cvv: v }))}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {method === "WALLET" && (
                    <WalletQrPanel order={order} waiting={stage === "form"} />
                  )}

                  {method === "BANK_TRANSFER" && (
                    <p className="rounded-lg bg-[#F4F5FA] px-4 py-3 text-sm text-[#555]">
                      You will be redirected to a bank confirmation screen after clicking &quot;Pay
                      now&quot;. (Simulated for this demo.)
                    </p>
                  )}

                  {errorMessage && stage === "form" && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</p>
                  )}

                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={stage === "processing"}
                      className="flex-1 rounded-full border border-[#D9DCE8] px-5 py-3 text-sm font-bold text-[#555] transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    {method !== "WALLET" && (
                      <button
                        type="submit"
                        disabled={stage === "processing"}
                        className="flex-[2] rounded-full bg-[#E60028] px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#c4001f] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {stage === "processing" ? (
                          <span className="inline-flex items-center justify-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Processing...
                          </span>
                        ) : (
                          `Pay ${money(order.amount, order.currency)}`
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {order && stage === "success" && (
            <SuccessPanel order={order} onClose={() => window.close()} />
          )}

          {order && stage === "failed" && (
            <CenteredState
              title="Payment failed"
              description={errorMessage || order.failureReason || "The payment could not be completed."}
              tone="error"
              action={
                <div className="flex gap-3">
                  <button
                    onClick={handleRetry}
                    className="rounded-full bg-[#000054] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#000080]"
                  >
                    Try again
                  </button>
                  <button
                    onClick={() => window.close()}
                    className="rounded-full border border-[#D9DCE8] px-5 py-2.5 text-sm font-bold text-[#555] transition-colors hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              }
            />
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          This is a separate payment tab. You can return to{" "}
          <button onClick={() => router.push("/user/ebook-loans")} className="text-[#337AB7] hover:underline">
            My ebooks
          </button>{" "}
          at any time — your status will update there automatically.
        </p>
      </main>
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────

function PurposeSelector({ onSelect }: { onSelect: (purpose: PaymentPurpose) => void }) {
  return (
    <div className="px-6 py-10">
      <p className="text-sm font-bold uppercase tracking-wide text-[#337AB7]">Select payment type</p>
      <h1 className="mt-3 font-serif text-2xl font-bold text-[#000054]">What would you like to pay for?</h1>
      <p className="mt-2 text-sm text-gray-600">
        No payment request was specified, so please choose what this payment is for.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {PURPOSE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className="flex flex-col items-start gap-1 rounded-xl border border-[#D9DCE8] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#000054] hover:shadow-lg"
          >
            <span className="text-base font-bold text-[#000054]">{opt.title}</span>
            <span className="text-sm text-gray-500">{opt.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WalletQrPanel({ order, waiting }: { order: PaymentOrder; waiting: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-[#D9DCE8] bg-[#F4F5FA] px-4 py-5 text-center">
      <p className="text-sm font-bold text-[#A50064]">Scan with Momo / ZaloPay / VNPay</p>
      <div className="h-44 w-44 overflow-hidden rounded-lg border border-[#D9DCE8] bg-white p-2">
        <QrCodePlaceholder seed={order.paymentId} />
      </div>
      <p className="text-xs text-gray-500">
        Amount: <span className="font-semibold text-[#000054]">{money(order.amount, order.currency)}</span>
      </p>
      <p className="flex items-center gap-2 text-xs text-gray-500">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        {waiting ? "Waiting for you to scan and confirm..." : "Confirming payment..."}
      </p>
      <p className="text-[11px] text-gray-400">
        (Demo only — the payment will confirm automatically in a few seconds.)
      </p>
    </div>
  );
}

/** A deterministic, QR-code-shaped placeholder. Not a real scannable code. */
function QrCodePlaceholder({ seed }: { seed: string }) {
  const size = 21;
  const cell = 100 / size;

  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  function next() {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  }

  const modules: ReactElement[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inFinder =
        (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9);
      if (inFinder) continue;
      if (next() > 0.55) {
        modules.push(
          <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#000054" />,
        );
      }
    }
  }

  function finder(x: number, y: number) {
    return (
      <g key={`finder-${x}-${y}`}>
        <rect x={x * cell} y={y * cell} width={cell * 7} height={cell * 7} fill="#000054" />
        <rect x={(x + 1) * cell} y={(y + 1) * cell} width={cell * 5} height={cell * 5} fill="#fff" />
        <rect x={(x + 2) * cell} y={(y + 2) * cell} width={cell * 3} height={cell * 3} fill="#000054" />
      </g>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label="QR code placeholder">
      <rect width="100" height="100" fill="#fff" />
      {modules}
      {finder(0, 0)}
      {finder(size - 7, 0)}
      {finder(0, size - 7)}
    </svg>
  );
}


function OrderSummary({ order }: { order: PaymentOrder }) {
  return (
    <div className="p-6">
      <p className="text-sm font-bold uppercase tracking-wide text-[#337AB7]">Order summary</p>
      <h1 className="mt-3 font-serif text-3xl font-bold text-[#000054]">
        {purposeTitle(order.purpose)}
      </h1>
      {order.bookTitle && (
        <p className="mt-2 text-sm text-gray-600">
          For book: <span className="font-semibold text-[#000054]">{order.bookTitle}</span>
        </p>
      )}

      <div className="mt-6 divide-y divide-[#EDEDF2] rounded-xl border border-[#EDEDF2]">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-semibold text-[#000054]">{money(item.amount, order.currency)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 text-base">
          <span className="font-bold text-[#000054]">Total</span>
          <span className="font-black text-[#E60028]">{money(order.amount, order.currency)}</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Order ID: <span className="font-mono">{order.paymentId}</span>
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Expires: {new Date(order.expiresAt).toLocaleString("en-US")}
      </p>
    </div>
  );
}

function SuccessPanel({ order, onClose }: { order: PaymentOrder; onClose: () => void }) {
  const resultMessage = (order.resultData?.message as string) ?? "Payment completed successfully.";

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
        ✓
      </div>
      <h1 className="font-serif text-3xl font-bold text-[#000054]">Payment successful</h1>
      <p className="max-w-md text-sm text-gray-600">{resultMessage}</p>
      <p className="mt-2 text-sm font-semibold text-[#000054]">
        Amount paid: {money(order.amount, order.currency)}
      </p>
      <p className="text-xs text-gray-400">
        Paid at {order.paidAt ? new Date(order.paidAt).toLocaleString("en-US") : "–"}
      </p>
      <button
        onClick={onClose}
        className="mt-4 rounded-full bg-[#000054] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#000080]"
      >
        Close this tab
      </button>
    </div>
  );
}

function CenteredState({
  title,
  description,
  tone = "neutral",
  action,
}: {
  title: string;
  description?: string;
  tone?: "neutral" | "error";
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <h1 className={`font-serif text-2xl font-bold ${tone === "error" ? "text-[#E60028]" : "text-[#000054]"}`}>
        {title}
      </h1>
      {description && <p className="max-w-md text-sm text-gray-600">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[#D9DCE8] px-3 py-2.5 text-sm text-[#000054] outline-none transition-colors focus:border-[#000054]"
      />
    </label>
  );
}

function purposeTitle(purpose: PaymentPurpose): string {
  switch (purpose) {
    case "EBOOK_RENEWAL":
      return "Renew ebook loan";
    case "EBOOK_LOAN_FEE":
      return "Borrow ebook";
    case "FINE":
      return "Settle library fine";
    default:
      return "Payment";
  }
}
