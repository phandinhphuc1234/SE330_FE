// src/features/ebook/types/ebook.type.ts

export type EbookLoanStatus = "ACTIVE" | "EXPIRED" | "RETURNED";

export type EbookLoan = {
  loanId?: number;
  id?: number;
  memberId?: number;
  bookId?: number;
  bookEbookId?: number;
  paymentId?: number | null;
  bookTitle?: string;
  isbn?: string;
  status?: EbookLoanStatus;
  borrowedAt?: string;
  expiredAt?: string;
  expiresAt?: string;
  returnedAt?: string | null;
  renewCount?: number;
  maxRenewals?: number;
  canRenew?: boolean;
  /** Chỉ có khi status === ACTIVE */
  ebookReadUrl?: string | null;
};

export type BorrowEbookRequest = Record<string, never>;

export type EbookPageParams = {
  history?: boolean;
  page?: number;
  size?: number;
};

export type EbookReadingSessionResponse = {
  sessionId: number;
  sessionToken: string;
  bookId: number;
  bookEbookId: number;
  loanId: number;
  loanExpiresAt: string;
  sessionExpiresAt: string;
  serverNow: string;
};

export type EbookSignedContentResponse = {
  signedUrl: string;
  expiresAt: string;
  serverNow: string;
};

export type EbookReadingSessionRefreshResponse = {
  sessionId: number;
  status: string;
  loanExpiresAt: string;
  sessionExpiresAt: string;
  serverNow: string;
};

export type EbookReadingSessionCloseResponse = {
  sessionId: number;
  status: string;
  closedAt: string;
  serverNow: string;
};

export type StoredReaderSession = {
  sessionId: number;
  sessionToken: string;
  bookId: number;
  bookEbookId: number;
  loanId: number;
  loanExpiresAt: string;
  sessionExpiresAt: string;
};

export type EbookSemanticSearchRequest = {
  query: string;
  topK?: number;
  scoreThreshold?: number;
};

export type EbookSemanticSearchCitation = {
  documentId?: string | null;
  bookId: number;
  ebookId: number;
  chapterTitle?: string | null;
  chapterIndex?: number | null;
  pageStart?: number | null;
  pageEnd?: number | null;
  chunkIndex?: number | null;
};

export type EbookSemanticSearchHit = {
  chunkId?: string | null;
  score: number;
  text?: string | null;
  citation: EbookSemanticSearchCitation;
};

export type EbookSemanticSearchResponse = {
  bookId: number;
  ebookId: number;
  resultCount: number;
  results: EbookSemanticSearchHit[];
};

export type EbookAnswerRequest = {
  question: string;
  topK?: number;
  scoreThreshold?: number;
};

export type EbookAnswerCitation = {
  documentId?: string | null;
  bookId: number;
  ebookId: number;
  chapterTitle?: string | null;
  chapterIndex?: number | null;
  pageStart?: number | null;
  pageEnd?: number | null;
  chunkIndex?: number | null;
  chunkId: string;
  excerpt?: string | null;
  score: number;
};

export type EbookAnswerResponse = {
  bookId: number;
  ebookId: number;
  answer: string;
  grounded: boolean;
  abstained: boolean;
  reason?: string | null;
  citations: EbookAnswerCitation[];
  promptVersion: string;
};
