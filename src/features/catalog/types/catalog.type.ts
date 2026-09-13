export type Author = {
  authorId?: number;
  id?: number;
  name: string;
  bio?: string | null;
  imageUrl?: string | null;
  imageProvider?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthorSearchParams = {
  q?: string;
  name?: string;
  page?: string;
  size?: string;
};

export type Category = {
  categoryId?: number;
  id?: number;
  name: string;
  description?: string | null;
};

export type BookCoverImage = {
  id?: number;
  bookId?: number;
  provider?: string | null;
  publicId?: string | null;
  originalUrl?: string | null;
  thumbnailUrl?: string | null;
  detailUrl?: string | null;
  altText?: string | null;
  isPrimary?: boolean;
  status?: string | null;
  oldImageStatus?: string | null;
};

export type BookEbook = {
  bookEbookId?: number;
  bookId?: number;
  provider?: string | null;
  publicId?: string | null;
  resourceType?: string | null;
  deliveryType?: string | null;
  format?: string | null;
  mimeType?: string | null;
  originalFilename?: string | null;
  version?: number | null;
  sizeBytes?: number | null;
  checksum?: string | null;
  status?: string | null;
  maxConcurrentLoans?: number | null;
  loanDurationDays?: number | null;
  accessType?: string | null;
  accessFee?: number | null;
  currency?: string | null;
  accessDurationDays?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type UpdateBookEbookPayload = {
  maxConcurrentLoans?: number;
  loanDurationDays?: number;
  accessType?: "FREE" | "PAID";
  accessFee?: number;
  currency?: string;
  accessDurationDays?: number;
  status?: string;
};

export type BookEbookInfo = {
  bookEbookId?: number;
  bookId?: number;
  available?: boolean;
  status?: string | null;
  format?: string | null;
  sizeBytes?: number | null;
  maxConcurrentLoans?: number | null;
  loanDurationDays?: number | null;
  accessType?: string | null;
  requiresPayment?: boolean;
  accessFee?: number | null;
  currency?: string | null;
  accessDurationDays?: number | null;
  updatedAt?: string | null;
};

export type Book = {
  bookId?: number;
  id?: number;
  title: string;
  isbn: string;
  imageUrl?: string | null;
  coverImage?: BookCoverImage | null;
  ebook?: BookEbook | null;
  bookEbook?: BookEbook | null;
  authors?: Author[] | string[];
  category?: Category | string | null;
  categoryId?: number | null;
  publishedDate?: string | null;
  language?: string | null;
  edition?: string | null;
  totalCopies?: number;
  availableCopies?: number;
  ebookUrl?: string | null;
};

export type BookCopy = {
  copyId?: number;
  id?: number;
  bookId?: number;
  barcode: string;
  status?: string;
  condition?: string | null;
  location?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BookCopySearchParams = {
  status?: string;
  barcode?: string;
  condition?: string;
  location?: string;
};

export type BookSearchParams = {
  q?: string;
  title?: string;
  isbn?: string;
  authorId?: string;
  author?: string;
  categoryId?: string;
  availableOnly?: string;
  language?: string;
  page?: string;
  size?: string;
  sort?: string;
};

export type BookPayload = {
  title: string;
  isbn: string;
  publishedDate?: string;
  language?: string;
  edition?: string;
  categoryId?: number | null;
  authorIds?: number[];
};

export type UpdateBookPayload = Omit<BookPayload, "authorIds" | "isbn">;

export type CopyPayload = {
  barcode: string;
  condition?: string;
  location?: string;
};

export type BulkCopyPayload = {
  quantity?: number;
  barcodes?: string[];
  condition?: string;
  location?: string;
};

export type ImportCsvResult = {
  jobId?: string;
  id?: string;
  filename?: string;
  originalFilename?: string;
  status?: string;
  processedRows?: number;
  totalRows?: number;
  successRows?: number;
  failedRows?: number;
  createdBooks?: number;
  createdCopies?: number;
  errorMessage?: string | null;
  createdAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  errors?: Array<{
    rowNumber?: number;
    isbn?: string;
    barcode?: string;
    code?: string;
    message?: string;
  }>;
};

export type PageResult<T> = {
  items: T[];
  totalElements?: number;
  totalPages?: number;
  page?: number;
  size?: number;
};
