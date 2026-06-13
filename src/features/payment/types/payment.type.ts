// src/features/payment/types/payment.type.ts

export type PaymentPurpose = "EBOOK_RENEWAL" | "EBOOK_LOAN_FEE" | "FINE";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "EXPIRED";

export type PaymentMethod = "CARD" | "WALLET" | "BANK_TRANSFER";

export type PaymentLineItem = {
  label: string;
  amount: number;
};

export type PaymentOrder = {
  paymentId: string;
  userId: number;
  purpose: PaymentPurpose;
  loanId?: number | null;
  bookId?: number | null;
  bookTitle?: string | null;
  currency: string;
  amount: number;
  items: PaymentLineItem[];
  status: PaymentStatus;
  method?: PaymentMethod | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  paidAt?: string | null;
  resultData?: Record<string, unknown> | null;
  failureReason?: string | null;
};

export type CreatePaymentRequest = {
  purpose: PaymentPurpose;
  loanId?: number;
  bookId?: number;
  bookTitle?: string;
  amount?: number;
  currency?: string;
};

export type ConfirmPaymentRequest = {
  method: PaymentMethod;
  cardNumber?: string;
  cardHolder?: string;
  expiry?: string;
  cvv?: string;
};
