"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DragEvent, FormEvent, ReactNode, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/types/api.type";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasStaffAccessFromToken } from "@/features/auth/utils/authRoles";
import { Author, Book, BookCoverImage, BookEbook, BookEbookInfo, Category, UpdateBookEbookPayload } from "../types/catalog.type";
import {
  addBookCover,
  createBook,
  getAuthors,
  getBook,
  getBookEbookInfo,
  getBookEbookManagementDetail,
  getCategories,
  updateBook,
  updateBookAuthors,
  updateBookCover,
  updateBookEbookMetadata,
  uploadBookEbook,
} from "../services/catalogService";
import { authorLabel, bookCoverAlt, bookCoverUrl, categoryIdOf, entityIdOf } from "./catalogHelpers";
import { CatalogShell, Notice } from "./CatalogShell";

const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_EBOOK_SIZE_BYTES = 100 * 1024 * 1024;
const AUTHOR_PICKER_PAGE_SIZE = 6;
const ACCEPTED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_EBOOK_TYPES = new Set(["application/pdf"]);

export function BookFormPage({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const params = useParams<{ bookId?: string }>();
  const { accessToken, currentUser, hasStaffAccess, refresh } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isEbookUploading, setIsEbookUploading] = useState(false);
  const [isEbookPolicySaving, setIsEbookPolicySaving] = useState(false);
  const [managedEbook, setManagedEbook] = useState<BookEbook | null>(null);
  const [ebookDetailError, setEbookDetailError] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<Set<string>>(() => new Set());
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const ebookFileInputRef = useRef<HTMLInputElement | null>(null);
  const authorSelectionSourceRef = useRef("");
  const isEdit = mode === "edit";
  const bookId = params.bookId ?? "";

  useEffect(() => {
    let isMounted = true;
    const tasks: Promise<unknown>[] = [getAuthors(authorSearch ? { q: authorSearch } : {}), getCategories()];

    if (isEdit && bookId) {
      tasks.push(getBook(bookId));
    }

    Promise.all(tasks)
      .then(([authorList, categoryList, bookRecord]) => {
        if (!isMounted) return;
        setAuthors(authorList as Author[]);
        setCategories(categoryList as Category[]);
        if (bookRecord) {
          setBook(bookRecord as Book);
        }
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Could not load form data.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authorSearch, bookId, isEdit]);

  useEffect(() => {
    if (!isEdit || !bookId) return;

    let isMounted = true;

    getBookEbookInfo(bookId)
      .then(async (ebookInfo) => {
        const bookEbookId = ebookInfo.bookEbookId;

        if (isMounted) {
          setManagedEbook(bookEbookFromPublicInfo(ebookInfo));
        }

        if (typeof bookEbookId !== "number") {
          return null;
        }

        try {
          return await loadBookEbookManagementDetail(bookId, String(bookEbookId), accessToken, async () => (await refresh())?.accessToken ?? null);
        } catch (detailError) {
          if (isMounted) {
            setEbookDetailError(detailError instanceof Error ? detailError.message : "Could not load ebook metadata.");
          }
          return null;
        }
      })
      .then((ebookDetail) => {
        if (!isMounted) return;
        if (ebookDetail) {
          setManagedEbook(ebookDetail);
          setEbookDetailError("");
        }
      })
      .catch((detailError) => {
        if (!isMounted) return;

        if (detailError instanceof ApiError && detailError.status === 404) {
          setManagedEbook(null);
          setEbookDetailError("");
          return;
        }

        setEbookDetailError(detailError instanceof Error ? detailError.message : "Could not load ebook metadata.");
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, bookId, isEdit, refresh]);

  useEffect(() => {
    const sourceKey = book ? `book:${entityIdOf(book)}` : `mode:${mode}`;

    if (authorSelectionSourceRef.current === sourceKey) {
      return;
    }

    authorSelectionSourceRef.current = sourceKey;
    setSelectedAuthorIds(new Set((book?.authors ?? []).map((author) => (typeof author === "string" ? "" : entityIdOf(author))).filter(Boolean)));
  }, [book, mode]);

  const visibleAuthors = useMemo(() => authors.slice(0, AUTHOR_PICKER_PAGE_SIZE), [authors]);

  const coverUrl = book ? bookCoverUrl(book, "detail") : "";
  const hasCover = Boolean(coverUrl);
  const ebook = managedEbook ?? bookEbookOf(book);
  const currentCategoryId = book ? categoryIdOf(book) : "";
  const currentLanguage = book?.language ?? "";
  const canUseMediaUploadApi = hasStaffAccess || hasStaffAccessFromToken(accessToken);
  const mediaUploadPermissionNotice = canUseMediaUploadApi
    ? ""
    : `Media upload requires LIBRARIAN or ADMIN. Current role is ${currentUser?.role ?? "unknown"}.`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const authorIds = Array.from(selectedAuthorIds).map((value) => Number(value)).filter(Boolean);
    const categoryId = Number(formData.get("categoryId")) || null;
    const metadataPayload = {
      title: String(formData.get("title") ?? "").trim(),
      publishedDate: String(formData.get("publishedDate") ?? ""),
      language: String(formData.get("language") ?? "").trim(),
      edition: String(formData.get("edition") ?? "").trim(),
      categoryId,
    };
    const isbn = String(formData.get("isbn") ?? "").trim();

    if (!metadataPayload.title || (!isEdit && !isbn)) {
      setError(isEdit ? "Title is required." : "Title and ISBN are required.");
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit && bookId) {
        const updatedBook = await updateBook(bookId, metadataPayload, accessToken);
        await updateBookAuthors(bookId, authorIds, accessToken);
        setBook((current) => ({
          ...(current ?? updatedBook),
          ...updatedBook,
          coverImage: current?.coverImage ?? updatedBook.coverImage,
          ebook: current?.ebook ?? updatedBook.ebook,
          bookEbook: current?.bookEbook ?? updatedBook.bookEbook,
          imageUrl: current?.imageUrl ?? updatedBook.imageUrl,
        }));
        setMessage("Book metadata and authors were updated.");
      } else {
        const created = await createBook({ ...metadataPayload, authorIds, isbn }, accessToken);
        setMessage("Book was created. You can now add physical copies.");
        const createdId = entityIdOf(created);
        if (createdId) {
          router.push(`/staff/books/${createdId}/copies`);
        }
      }
      setError("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save book.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCoverFile(file?: File | null) {
    if (!file) return;

    if (!isEdit || !bookId) {
      setError("Save this book before uploading a cover image.");
      return;
    }

    if (!ACCEPTED_COVER_TYPES.has(file.type)) {
      setError("Cover image must be JPG, PNG, or WEBP.");
      return;
    }

    if (file.size > MAX_COVER_SIZE_BYTES) {
      setError("Cover image must be 5MB or smaller.");
      return;
    }

    if (!canUseMediaUploadApi) {
      setError(mediaUploadPermissionNotice);
      return;
    }

    const shouldReplace = Boolean(book && bookCoverUrl(book, "detail"));
    setIsCoverUploading(true);
    try {
      const coverImage = await uploadCoverImage(bookId, file, shouldReplace, accessToken);

      setBook((current) => {
        if (!current) return current;
        return applyCoverToBook(current, coverImage);
      });
      setMessage(shouldReplace ? "Book cover was replaced." : "Book cover was uploaded.");
      setError("");
    } catch (uploadError) {
      if (uploadError instanceof ApiError && (uploadError.status === 401 || uploadError.status === 403)) {
        const refreshedSession = await refresh();

        if (refreshedSession?.accessToken) {
          try {
            const coverImage = await uploadCoverImage(bookId, file, shouldReplace, refreshedSession.accessToken);

            setBook((current) => {
              if (!current) return current;
              return applyCoverToBook(current, coverImage);
            });
            setMessage(shouldReplace ? "Book cover was replaced." : "Book cover was uploaded.");
            setError("");
            return;
          } catch (retryError) {
            setError(getCoverUploadErrorMessage(retryError, currentUser?.role));
            return;
          }
        }
      }

      setError(getCoverUploadErrorMessage(uploadError, currentUser?.role));
    } finally {
      setIsCoverUploading(false);
    }
  }

  function handleCoverInputChange(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    void handleCoverFile(input.files?.item(0));
    input.value = "";
  }

  function handleCoverDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    void handleCoverFile(event.dataTransfer.files.item(0));
  }

  async function handleEbookFile(file?: File | null) {
    if (!file) return;

    if (!isEdit || !bookId) {
      setError("Save this book before uploading an ebook PDF.");
      return;
    }

    if (!isAcceptedEbookFile(file)) {
      setError("Ebook media must be a PDF file.");
      return;
    }

    if (file.size > MAX_EBOOK_SIZE_BYTES) {
      setError("Ebook PDF must be 100MB or smaller.");
      return;
    }

    if (!canUseMediaUploadApi) {
      setError(mediaUploadPermissionNotice);
      return;
    }

    setIsEbookUploading(true);
    try {
      const uploadedEbook = await uploadBookEbook(bookId, file, accessToken);

      setBook((current) => {
        if (!current) return current;
        return applyEbookToBook(current, uploadedEbook);
      });
      setManagedEbook(uploadedEbook);
      setMessage("Ebook PDF was uploaded.");
      setError("");
    } catch (uploadError) {
      if (uploadError instanceof ApiError && (uploadError.status === 401 || uploadError.status === 403)) {
        const refreshedSession = await refresh();

        if (refreshedSession?.accessToken) {
          try {
            const uploadedEbook = await uploadBookEbook(bookId, file, refreshedSession.accessToken);

            setBook((current) => {
              if (!current) return current;
              return applyEbookToBook(current, uploadedEbook);
            });
            setManagedEbook(uploadedEbook);
            setMessage("Ebook PDF was uploaded.");
            setError("");
            return;
          } catch (retryError) {
            setError(getEbookUploadErrorMessage(retryError, currentUser?.role));
            return;
          }
        }
      }

      setError(getEbookUploadErrorMessage(uploadError, currentUser?.role));
    } finally {
      setIsEbookUploading(false);
    }
  }

  async function handleEbookPolicySave(payload: UpdateBookEbookPayload) {
    const bookEbookId = ebook?.bookEbookId;

    if (!isEdit || !bookId || typeof bookEbookId !== "number") {
      setError("Upload an ebook PDF before editing ebook policy.");
      return false;
    }

    if (!canUseMediaUploadApi) {
      setError(mediaUploadPermissionNotice);
      return false;
    }

    setIsEbookPolicySaving(true);
    try {
      const updatedEbook = await saveBookEbookPolicy(
        bookId,
        String(bookEbookId),
        payload,
        accessToken,
        async () => (await refresh())?.accessToken ?? null,
      );

      setBook((current) => {
        if (!current) return current;
        return applyEbookToBook(current, updatedEbook);
      });
      setManagedEbook(updatedEbook);
      setMessage("Ebook policy and pricing were updated.");
      setError("");
      return true;
    } catch (policyError) {
      setError(getEbookPolicyErrorMessage(policyError, currentUser?.role));
      return false;
    } finally {
      setIsEbookPolicySaving(false);
    }
  }

  function handleEbookInputChange(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    void handleEbookFile(input.files?.item(0));
    input.value = "";
  }

  function handleEbookDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    void handleEbookFile(event.dataTransfer.files.item(0));
  }

  function handleAuthorToggle(authorId: string, checked: boolean) {
    setSelectedAuthorIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(authorId);
      } else {
        next.delete(authorId);
      }

      return next;
    });
  }

  return (
    <CatalogShell
      protectedPage
      wide
      frameless
      eyebrow={isEdit ? "Edit catalog record" : "Create catalog record"}
      title={isEdit ? "Update book metadata" : "Create a new book"}
      description="Book metadata is managed separately from physical copies, matching the backend catalog workflow."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <BackToStaffBooks />
          <button
            type="submit"
            form="book-metadata-form"
            disabled={isLoading || isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Icon name="check" size={16} aria-hidden="true" />
            {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create book"}
          </button>
        </div>
      }
    >
      <div className="grid gap-3">
        {isLoading ? <Notice message="Loading form data..." /> : null}
        {message ? <Notice tone="success" message={message} /> : null}
        {error ? <Notice tone="error" message={error} /> : null}
      </div>

      <form
        key={book ? `${entityIdOf(book)}-${currentLanguage}-${currentCategoryId}` : mode}
        id="book-metadata-form"
        onSubmit={handleSubmit}
        className="mt-6 space-y-6 pb-28"
      >
        <div className="flex flex-col gap-6 lg:flex-row">
          <section className="min-w-0 rounded-2xl border border-[#E1E6F0] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] lg:flex-1">
            <h2 className="text-lg font-black text-[#0B1026]">Bibliographic details</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Title" name="title" defaultValue={book?.title} required />
              {isEdit ? (
                <ReadonlyField label="ISBN" value={book?.isbn || "N/A"} />
              ) : (
                <Field label="ISBN" name="isbn" defaultValue={book?.isbn} required />
              )}
              <Field label="Published date" name="publishedDate" type="date" defaultValue={book?.publishedDate ?? ""} />
              <SelectField label="Language" name="language" defaultValue={currentLanguage}>
                <option value="">No language</option>
                {currentLanguage && !["en", "vi", "English", "Vietnamese"].includes(currentLanguage) ? (
                  <option value={currentLanguage}>{currentLanguage}</option>
                ) : null}
                <option value="English">English</option>
                <option value="Vietnamese">Vietnamese</option>
                <option value="en">English (en)</option>
                <option value="vi">Vietnamese (vi)</option>
              </SelectField>
              <Field label="Edition" name="edition" defaultValue={book?.edition ?? ""} placeholder="e.g., 1st, 2nd revised" />
              <SelectField label="Category" name="categoryId" defaultValue={currentCategoryId}>
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={entityIdOf(category)} value={entityIdOf(category)}>
                    {category.name}
                  </option>
                ))}
              </SelectField>
            </div>

            <section className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#0B1026]">Authors</h2>
                  <p className="mt-1 text-sm text-[#59637A]">Select the catalog authors attached to this title.</p>
                </div>
                <Link href="/staff/authors" className="inline-flex items-center gap-2 text-sm font-black text-[#E60028] transition hover:text-[#0B1026]">
                  Manage authors
                  <Icon name="chevron-right" size={17} aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-4 rounded-2xl border border-[#E1E6F0] bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="min-w-0 flex-1">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-[#0B1026]">Search author name</span>
                    <input
                      value={authorSearch}
                      onChange={(event) => setAuthorSearch(event.target.value)}
                      placeholder="Filter author choices..."
                      className="mt-2 h-12 w-full rounded-xl border border-[#D5DBE8] bg-white px-4 text-sm outline-none transition focus:border-[#111827] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]"
                    />
                  </label>
                  <button type="button" onClick={() => setAuthorSearch("")} className="h-12 rounded-xl border border-[#D5DBE8] px-5 text-sm font-black text-[#0B1026] transition hover:border-[#111827]">
                    Clear
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {visibleAuthors.map((author) => {
                    const id = entityIdOf(author);
                    if (!id) return null;

                    return (
                      <label key={id} className="flex items-center gap-3 rounded-xl border border-[#E1E6F0] bg-white px-3 py-3 text-sm font-semibold text-[#111827]">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#F6F8FC] text-[#61708F]">
                          <Icon name="menu" size={15} aria-hidden="true" />
                        </span>
                        <input
                          name="authorIds"
                          value={id}
                          type="checkbox"
                          checked={selectedAuthorIds.has(id)}
                          onChange={(event) => handleAuthorToggle(id, event.target.checked)}
                          className="h-4 w-4 accent-[#E60028]"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-bold">{authorLabel(author)}</span>
                          <span className="block text-xs font-medium text-[#61708F]">Author</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </section>
          </section>

          <BookCoverPanel
            book={book}
            coverUrl={coverUrl}
            ebook={ebook}
            ebookDetailError={ebookDetailError}
            hasCover={hasCover}
            isCoverUploading={isCoverUploading}
            isEbookUploading={isEbookUploading}
            isEbookPolicySaving={isEbookPolicySaving}
            isEdit={isEdit}
            permissionNotice={mediaUploadPermissionNotice}
            fileInputRef={coverFileInputRef}
            ebookFileInputRef={ebookFileInputRef}
            onDrop={handleCoverDrop}
            onEbookDrop={handleEbookDrop}
            onEbookFile={handleEbookFile}
            onEbookPolicySave={handleEbookPolicySave}
            onFile={handleCoverFile}
            onOpenEbookFilePicker={() => ebookFileInputRef.current?.click()}
            onOpenFilePicker={() => coverFileInputRef.current?.click()}
            onEbookInputChange={handleEbookInputChange}
            onInputChange={handleCoverInputChange}
          />
        </div>

        </form>
    </CatalogShell>
  );
}

function BackToStaffBooks() {
  return (
    <Link href="/staff/books" className="inline-flex h-12 items-center gap-3 rounded-xl border border-[#D5DBE8] bg-white px-5 text-sm font-black text-[#0B1026] transition hover:border-[#111827]">
      <Icon name="arrow-left" size={18} aria-hidden="true" />
      Back to staff books
    </Link>
  );
}

function BookCoverPanel({
  book,
  coverUrl,
  ebook,
  ebookDetailError,
  hasCover,
  isCoverUploading,
  isEbookUploading,
  isEbookPolicySaving,
  isEdit,
  permissionNotice,
  fileInputRef,
  ebookFileInputRef,
  onDrop,
  onEbookDrop,
  onEbookFile,
  onEbookPolicySave,
  onFile,
  onOpenEbookFilePicker,
  onOpenFilePicker,
  onEbookInputChange,
  onInputChange,
}: {
  book: Book | null;
  coverUrl: string;
  ebook: BookEbook | null;
  ebookDetailError: string;
  hasCover: boolean;
  isCoverUploading: boolean;
  isEbookUploading: boolean;
  isEbookPolicySaving: boolean;
  isEdit: boolean;
  permissionNotice: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  ebookFileInputRef: RefObject<HTMLInputElement | null>;
  onDrop: (event: DragEvent<HTMLButtonElement>) => void;
  onEbookDrop: (event: DragEvent<HTMLButtonElement>) => void;
  onEbookFile: (file?: File | null) => void;
  onEbookPolicySave: (payload: UpdateBookEbookPayload) => Promise<boolean>;
  onFile: (file?: File | null) => void;
  onOpenEbookFilePicker: () => void;
  onOpenFilePicker: () => void;
  onEbookInputChange: (event: FormEvent<HTMLInputElement>) => void;
  onInputChange: (event: FormEvent<HTMLInputElement>) => void;
}) {
  const coverImage = book?.coverImage ?? null;
  const coverName = coverFileName(book, coverImage);

  return (
    <section className="min-w-0 rounded-2xl border border-[#E1E6F0] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] lg:flex-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onInputChange}
      />
      <input
        ref={ebookFileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={onEbookInputChange}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0B1026]">Book media</h2>
          <p className="mt-2 text-sm text-[#59637A]">Manage the primary cover and protected ebook PDF for this catalog record.</p>
          {permissionNotice ? (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
              {permissionNotice}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_190px]">
        <div className="rounded-2xl border border-[#E1E6F0] bg-white p-4">
          {hasCover && book ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              <CoverPreview book={book} coverUrl={coverUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-black text-[#0B1026]">{coverName}</p>
                  <StatusPill status={coverImage?.status ?? "ACTIVE"} />
                </div>
                <p className="mt-2 text-sm font-medium text-[#59637A]">
                  {formatProvider(coverImage?.provider)} <span aria-hidden="true">·</span> Primary cover
                </p>
                <label className="mt-5 block">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-[#0B1026]">Alt text / caption</span>
                  <textarea
                    value={coverImage?.altText ?? bookCoverAlt(book)}
                    readOnly
                    rows={3}
                    className="mt-2 w-full resize-none rounded-xl border border-[#D5DBE8] bg-[#F8FAFC] px-4 py-3 text-sm text-[#334155] outline-none"
                  />
                </label>
              </div>
            </div>
          ) : (
            <EmptyCoverState
              disabled={!isEdit || Boolean(permissionNotice)}
              onOpenFilePicker={onOpenFilePicker}
            />
          )}
        </div>

        <DropZone
          disabled={!isEdit || isCoverUploading || Boolean(permissionNotice)}
          onDrop={onDrop}
          onFile={onFile}
          onOpenFilePicker={onOpenFilePicker}
        />
      </div>

      <EbookUploadPanel
        book={book}
        ebook={ebook}
        detailError={ebookDetailError}
        disabled={!isEdit || isEbookUploading || Boolean(permissionNotice)}
        isUploading={isEbookUploading}
        isPolicySaving={isEbookPolicySaving}
        onDrop={onEbookDrop}
        onFile={onEbookFile}
        onOpenFilePicker={onOpenEbookFilePicker}
        onSavePolicy={onEbookPolicySave}
      />

      <div className="mt-6">
        <p className="text-sm font-black text-[#0B1026]">Image gallery</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <GalleryCard book={book} coverUrl={coverUrl} isPrimary />
          <GalleryPlaceholder label="Back cover" />
          <GalleryPlaceholder label="Sample page" />
          <button
            type="button"
            onClick={onOpenFilePicker}
            disabled={!isEdit || isCoverUploading || Boolean(permissionNotice)}
            className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#C9D1DE] bg-white p-4 text-sm font-black text-[#0B1026] transition hover:border-[#111827] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Icon name="plus" size={28} aria-hidden="true" />
            Add more images
          </button>
        </div>
      </div>
    </section>
  );
}

function CoverPreview({ book, coverUrl }: { book: Book; coverUrl: string }) {
  return (
    <div className="relative h-64 w-36 shrink-0 overflow-hidden rounded-lg bg-[#EEF1F6] ring-1 ring-black/5">
      <Image src={coverUrl} alt={bookCoverAlt(book)} fill unoptimized sizes="144px" className="object-cover" />
      <span className="absolute left-2 top-2 rounded-full bg-[#E60028] px-2 py-1 text-[11px] font-black text-white">Primary</span>
    </div>
  );
}

function EmptyCoverState({ disabled, onOpenFilePicker }: { disabled: boolean; onOpenFilePicker: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl bg-[#F8FAFC] p-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#61708F] shadow-sm">
        <Icon name="book-open" size={25} aria-hidden="true" />
      </span>
      <p className="mt-4 text-base font-black text-[#0B1026]">No cover image</p>
      <p className="mt-2 max-w-xs text-sm text-[#59637A]">Upload a JPG, PNG, or WEBP image for the primary catalog cover.</p>
      <button
        type="button"
        onClick={onOpenFilePicker}
        disabled={disabled}
        className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border border-[#D5DBE8] px-5 text-sm font-black text-[#0B1026] transition hover:border-[#111827] disabled:cursor-not-allowed disabled:opacity-55"
      >
        <Icon name="upload" size={16} aria-hidden="true" />
        Upload cover
      </button>
    </div>
  );
}

function DropZone({
  disabled,
  heading = "Upload new cover",
  hint = "Drag & drop image here",
  meta = "PNG, JPG, WEBP up to 5MB",
  onDrop,
  onFile,
  onOpenFilePicker,
}: {
  disabled: boolean;
  heading?: string;
  hint?: string;
  meta?: string;
  onDrop: (event: DragEvent<HTMLButtonElement>) => void;
  onFile: (file?: File | null) => void;
  onOpenFilePicker: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpenFilePicker}
      onDrop={onDrop}
      onDragOver={(event) => event.preventDefault()}
      onPaste={(event) => onFile(event.clipboardData.files.item(0))}
      disabled={disabled}
      className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D1DE] bg-white p-6 text-center text-sm transition hover:border-[#111827] disabled:cursor-not-allowed disabled:opacity-55"
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F6F8FC] text-[#61708F]">
        <Icon name="upload" size={23} aria-hidden="true" />
      </span>
      <span className="mt-4 font-black text-[#0B1026]">{heading}</span>
      <span className="mt-2 font-semibold text-[#334155]">{hint}</span>
      <span className="font-black text-[#E60028]">or browse files</span>
      <span className="mt-2 text-xs font-medium text-[#61708F]">{meta}</span>
    </button>
  );
}

function EbookUploadPanel({
  book,
  ebook,
  detailError,
  disabled,
  isUploading,
  isPolicySaving,
  onDrop,
  onFile,
  onOpenFilePicker,
  onSavePolicy,
}: {
  book: Book | null;
  ebook: BookEbook | null;
  detailError: string;
  disabled: boolean;
  isUploading: boolean;
  isPolicySaving: boolean;
  onDrop: (event: DragEvent<HTMLButtonElement>) => void;
  onFile: (file?: File | null) => void;
  onOpenFilePicker: () => void;
  onSavePolicy: (payload: UpdateBookEbookPayload) => Promise<boolean>;
}) {
  const hasEbook = Boolean(ebook);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_190px]">
      <div className="min-w-0 rounded-2xl border border-[#E1E6F0] bg-white p-4">
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#FFF1F3] text-[#E60028]">
              <span className="text-[10px] font-black uppercase leading-none">PDF</span>
            </span>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="truncate text-sm font-black text-[#0B1026]">
                  {hasEbook ? ebookFileName(book, ebook) : "No ebook PDF uploaded"}
                </p>
                {hasEbook ? (
                  <StatusPill status={ebook?.status ?? "ACTIVE"} />
                ) : (
                  <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-[#61708F]">
                    Pending
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-[#59637A]">
                {hasEbook ? formatEbookFormat(ebook) : "Protected PDF asset for ebook loans."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pl-0 sm:pl-[60px]">
            {hasEbook ? (
              <button
                type="button"
                onClick={() => setIsPolicyOpen(true)}
                disabled={disabled || isPolicySaving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D5DBE8] bg-white px-3 text-xs font-black text-[#0B1026] transition hover:border-[#111827] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Icon name="settings" size={15} aria-hidden="true" />
                Change policy
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenFilePicker}
              disabled={disabled}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D5DBE8] bg-white px-3 text-xs font-black text-[#0B1026] transition hover:border-[#111827] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Icon name="upload" size={15} aria-hidden="true" />
              {isUploading ? "Uploading..." : hasEbook ? "Replace PDF" : "Upload PDF"}
            </button>
          </div>
        </div>

        {hasEbook ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <MediaMeta label="Delivery / Storage" value={formatEbookDelivery(ebook)} />
            <MediaMeta label="Ebook ID" value={formatOptionalNumber(ebook?.bookEbookId)} />
            <MediaMeta label="Loan policy" value={formatEbookLoanPolicy(ebook)} />
            <MediaMeta label="Public ID" value={ebook?.publicId ?? "Cloudinary metadata pending"} />
            <MediaMeta label="Access duration" value={formatDurationDays(ebook?.accessDurationDays)} />
            <MediaMeta label="Size" value={formatFileSize(ebook?.sizeBytes)} />
            <MediaMeta label="Access" value={formatEbookAccessPolicy(ebook)} />
            <MediaMeta label="Updated" value={formatDateTime(ebook?.updatedAt)} />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[#D5DBE8] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#61708F]">
            Upload a protected PDF to enable ebook loans, pricing, and access policy controls.
          </div>
        )}

        {detailError && !hasEbook ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
            Ebook metadata API could not be loaded: {detailError}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onOpenFilePicker}
        onDrop={onDrop}
        onDragOver={(event) => event.preventDefault()}
        onPaste={(event) => onFile(event.clipboardData.files.item(0))}
        disabled={disabled}
        className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D1DE] bg-white p-5 text-center text-sm transition hover:border-[#111827] disabled:cursor-not-allowed disabled:opacity-55"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F6F8FC] text-[#61708F]">
          <Icon name="upload" size={23} aria-hidden="true" />
        </span>
        <span className="mt-4 font-black text-[#0B1026]">Upload new PDF</span>
        <span className="mt-2 font-semibold text-[#334155]">Drag & drop PDF here</span>
        <span className="font-black text-[#E60028]">or browse files</span>
        <span className="mt-2 text-xs font-medium text-[#61708F]">PDF up to 100MB</span>
      </button>

      {isPolicyOpen ? (
        <EbookPolicyModal
          ebook={ebook}
          disabled={!hasEbook || disabled || isPolicySaving}
          isSaving={isPolicySaving}
          onClose={() => setIsPolicyOpen(false)}
          onSave={onSavePolicy}
        />
      ) : null}
    </div>
  );
}

function EbookPolicyModal({
  ebook,
  disabled,
  isSaving,
  onClose,
  onSave,
}: {
  ebook: BookEbook | null;
  disabled: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: UpdateBookEbookPayload) => Promise<boolean>;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close ebook policy dialog"
        onClick={onClose}
        disabled={isSaving}
        className="absolute inset-0 bg-[#0B1026]/55 backdrop-blur-[2px] disabled:cursor-wait"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ebook-policy-title"
        className="relative z-10 max-h-[calc(100dvh-3rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#E1E6F0] bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.28)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#E60028]">Ebook settings</p>
            <h2 id="ebook-policy-title" className="mt-2 text-2xl font-black text-[#0B1026]">
              Change ebook policy
            </h2>
            <p className="mt-1 max-w-xl text-sm font-medium text-[#59637A]">
              Update pricing, access duration, concurrent loan limit, and ebook availability status.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#D5DBE8] text-[#0B1026] transition hover:border-[#111827] disabled:cursor-not-allowed disabled:opacity-55"
            aria-label="Close"
          >
            <Icon name="x" size={18} aria-hidden="true" />
          </button>
        </div>

        <EbookPolicyEditor
          key={ebookPolicyEditorKey(ebook)}
          ebook={ebook}
          disabled={disabled}
          isSaving={isSaving}
          onSave={onSave}
          onSaved={onClose}
        />
      </section>
    </div>
  );
}

type EbookPolicyDraft = {
  accessType: "FREE" | "PAID";
  accessFee: string;
  currency: string;
  accessDurationDays: string;
  maxConcurrentLoans: string;
  loanDurationDays: string;
  status: string;
};

function EbookPolicyEditor({
  ebook,
  disabled,
  isSaving,
  onSave,
  onSaved,
}: {
  ebook: BookEbook | null;
  disabled: boolean;
  isSaving: boolean;
  onSave: (payload: UpdateBookEbookPayload) => Promise<boolean>;
  onSaved?: () => void;
}) {
  const [draft, setDraft] = useState<EbookPolicyDraft>(() => ebookPolicyDraftOf(ebook));
  const isFree = draft.accessType === "FREE";

  function updateDraft<K extends keyof EbookPolicyDraft>(key: K, value: EbookPolicyDraft[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(key === "accessType" && value === "FREE" ? { accessFee: "0" } : {}),
    }));
  }

  async function handleSave() {
    const didSave = await onSave(ebookPolicyPayloadOf(draft));

    if (didSave) {
      onSaved?.();
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-[#E1E6F0] bg-[#F8FAFC] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-black text-[#0B1026]">Ebook policy & pricing</h3>
          <p className="mt-1 text-xs font-medium text-[#61708F]">
            Set FREE/PAID access, price, license limit, and reading duration.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || isSaving}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Icon name="check" size={15} aria-hidden="true" />
          {isSaving ? "Saving..." : "Save policy"}
        </button>
      </div>

      {!ebook ? (
        <p className="mt-4 rounded-xl border border-dashed border-[#C9D1DE] bg-white px-3 py-3 text-xs font-bold text-[#61708F]">
          Upload an ebook PDF before editing pricing and loan policy.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <PolicySelect
            label="Access type"
            value={draft.accessType}
            disabled={disabled}
            onChange={(value) => updateDraft("accessType", value as EbookPolicyDraft["accessType"])}
          >
            <option value="FREE">FREE</option>
            <option value="PAID">PAID</option>
          </PolicySelect>
          <PolicyInput
            label="Access fee"
            type="number"
            min="0"
            step="1000"
            value={draft.accessFee}
            disabled={disabled || isFree}
            onChange={(value) => updateDraft("accessFee", value)}
          />
          <PolicySelect
            label="Currency"
            value={draft.currency}
            disabled={disabled || isFree}
            onChange={(value) => updateDraft("currency", value)}
          >
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </PolicySelect>
          <PolicyInput
            label="Access duration days"
            type="number"
            min="1"
            value={draft.accessDurationDays}
            disabled={disabled}
            onChange={(value) => updateDraft("accessDurationDays", value)}
          />
          <PolicyInput
            label="Max concurrent loans"
            type="number"
            min="1"
            value={draft.maxConcurrentLoans}
            disabled={disabled}
            onChange={(value) => updateDraft("maxConcurrentLoans", value)}
          />
          <PolicyInput
            label="Loan duration days"
            type="number"
            min="1"
            value={draft.loanDurationDays}
            disabled={disabled}
            onChange={(value) => updateDraft("loanDurationDays", value)}
          />
          <PolicySelect
            label="Status"
            value={draft.status}
            disabled={disabled}
            onChange={(value) => updateDraft("status", value)}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </PolicySelect>
        </div>
      )}
    </section>
  );
}

function PolicyInput({
  disabled,
  label,
  min,
  onChange,
  step,
  type = "text",
  value,
}: {
  disabled: boolean;
  label: string;
  min?: string;
  onChange: (value: string) => void;
  step?: string;
  type?: string;
  value: string;
}) {
  return (
    <label>
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#61708F]">{label}</span>
      <input
        type={type}
        min={min}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-[#D5DBE8] bg-white px-3 text-sm font-bold text-[#0B1026] outline-none transition focus:border-[#111827] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)] disabled:cursor-not-allowed disabled:bg-[#EEF1F6] disabled:text-[#8A94A6]"
      />
    </label>
  );
}

function PolicySelect({
  children,
  disabled,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label>
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#61708F]">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-[#D5DBE8] bg-white px-3 text-sm font-bold text-[#0B1026] outline-none transition focus:border-[#111827] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)] disabled:cursor-not-allowed disabled:bg-[#EEF1F6] disabled:text-[#8A94A6]"
      >
        {children}
      </select>
    </label>
  );
}

function MediaMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#F8FAFC] px-3 py-2">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#61708F]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[#0B1026]">{value}</p>
    </div>
  );
}

function GalleryCard({ book, coverUrl, isPrimary }: { book: Book | null; coverUrl: string; isPrimary?: boolean }) {
  if (!book || !coverUrl) {
    return <GalleryPlaceholder label="Primary cover" />;
  }

  return (
    <article className="rounded-2xl border border-[#E1E6F0] bg-white p-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#EEF1F6]">
        <Image src={coverUrl} alt={bookCoverAlt(book)} fill unoptimized sizes="180px" className="object-cover" />
        {isPrimary ? <span className="absolute left-2 top-2 rounded-full bg-[#E60028] px-2 py-1 text-[11px] font-black text-white">Primary</span> : null}
      </div>
      <p className="mt-3 truncate text-xs font-black text-[#0B1026]">{coverFileName(book, book.coverImage ?? null)}</p>
      <p className="mt-1 text-xs text-[#61708F]">{formatProvider(book.coverImage?.provider)}</p>
      <StatusPill status={book.coverImage?.status ?? "ACTIVE"} />
    </article>
  );
}

function GalleryPlaceholder({ label }: { label: string }) {
  return (
    <article className="rounded-2xl border border-[#E1E6F0] bg-white p-3 opacity-70">
      <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-[#F6F8FC] text-[#94A3B8]">
        <Icon name="file" size={28} aria-hidden="true" />
      </div>
      <p className="mt-3 text-xs font-black text-[#0B1026]">{label}</p>
      <p className="mt-1 text-xs text-[#61708F]">Pending</p>
    </article>
  );
}

function Field({
  label,
  name,
  defaultValue = "",
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#0B1026]">
        {label}
        {required ? <span className="text-[#E60028]"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-xl border border-[#D5DBE8] bg-white px-4 text-sm text-[#0B1026] outline-none transition placeholder:text-[#8A94A6] focus:border-[#111827] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]"
      />
    </label>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0B1026]">{label}</p>
      <div className="mt-2 flex h-12 items-center rounded-xl border border-[#D5DBE8] bg-[#F8FAFC] px-4 text-sm font-semibold text-[#334155]">
        {value}
      </div>
    </div>
  );
}

function SelectField({
  children,
  defaultValue = "",
  label,
  name,
}: {
  children: ReactNode;
  defaultValue?: string | number | null;
  label: string;
  name: string;
}) {
  return (
    <label className="relative">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#0B1026]">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-2 h-12 w-full appearance-none rounded-xl border border-[#D5DBE8] bg-white px-4 pr-10 text-sm font-semibold text-[#0B1026] outline-none transition focus:border-[#111827] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]"
      >
        {children}
      </select>
      <Icon name="chevron-down" size={17} aria-hidden="true" className="pointer-events-none absolute bottom-4 right-4 text-[#0B1026]" />
    </label>
  );
}

function StatusPill({ status }: { status?: string | null }) {
  const normalizedStatus = (status || "ACTIVE").replace(/_/g, " ").toLowerCase();

  return (
    <span className="inline-flex w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black capitalize text-emerald-700">
      {normalizedStatus}
    </span>
  );
}

function bookEbookOf(book: Book | null) {
  return book?.ebook ?? book?.bookEbook ?? null;
}

function bookEbookFromPublicInfo(ebookInfo: BookEbookInfo): BookEbook {
  return {
    bookEbookId: ebookInfo.bookEbookId,
    bookId: ebookInfo.bookId,
    status: ebookInfo.status,
    format: ebookInfo.format,
    mimeType: ebookInfo.format?.toLowerCase() === "pdf" ? "application/pdf" : null,
    sizeBytes: ebookInfo.sizeBytes,
    maxConcurrentLoans: ebookInfo.maxConcurrentLoans,
    loanDurationDays: ebookInfo.loanDurationDays,
    accessType: ebookInfo.accessType,
    accessFee: ebookInfo.accessFee,
    currency: ebookInfo.currency,
    accessDurationDays: ebookInfo.accessDurationDays,
    updatedAt: ebookInfo.updatedAt,
  };
}

function applyCoverToBook(book: Book, coverImage: BookCoverImage): Book {
  const imageUrl = coverImage.thumbnailUrl ?? coverImage.detailUrl ?? coverImage.originalUrl ?? book.imageUrl ?? null;

  return {
    ...book,
    imageUrl,
    coverImage,
  };
}

function applyEbookToBook(book: Book, ebook: BookEbook): Book {
  return {
    ...book,
    ebook,
    bookEbook: ebook,
  };
}

async function loadBookEbookManagementDetail(
  bookId: string,
  bookEbookId: string,
  accessToken: string | null,
  refreshAccessToken: () => Promise<string | null>,
) {
  try {
    return await getBookEbookManagementDetail(bookId, bookEbookId, accessToken);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        return getBookEbookManagementDetail(bookId, bookEbookId, refreshedToken);
      }
    }

    throw error;
  }
}

async function saveBookEbookPolicy(
  bookId: string,
  bookEbookId: string,
  payload: UpdateBookEbookPayload,
  accessToken: string | null,
  refreshAccessToken: () => Promise<string | null>,
) {
  try {
    return await updateBookEbookMetadata(bookId, bookEbookId, payload, accessToken);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        return updateBookEbookMetadata(bookId, bookEbookId, payload, refreshedToken);
      }
    }

    throw error;
  }
}

function uploadCoverImage(bookId: string, file: File, shouldReplace: boolean, accessToken: string | null) {
  return shouldReplace ? updateBookCover(bookId, file, accessToken) : addBookCover(bookId, file, accessToken);
}

function isAcceptedEbookFile(file: File) {
  return ACCEPTED_EBOOK_TYPES.has(file.type) || file.name.toLowerCase().endsWith(".pdf");
}

function getCoverUploadErrorMessage(error: unknown, role?: string | null) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return `Cover upload was forbidden by the backend. Current profile role is ${role ?? "unknown"}; this API requires LIBRARIAN or ADMIN authority in the access token.`;
    }

    if (error.status === 401) {
      return "Your session expired while uploading the cover. Please sign in again and retry.";
    }
  }

  return error instanceof Error ? error.message : "Could not upload cover image.";
}

function getEbookUploadErrorMessage(error: unknown, role?: string | null) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return `Ebook PDF upload was forbidden by the backend. Current profile role is ${role ?? "unknown"}; this API requires LIBRARIAN or ADMIN authority in the access token.`;
    }

    if (error.status === 401) {
      return "Your session expired while uploading the ebook PDF. Please sign in again and retry.";
    }

    if (error.status >= 500) {
      return `Backend could not store the ebook PDF. This usually means the PDF upload pipeline or Cloudinary configuration failed on the server. ${formatApiErrorDiagnostic(error)}`;
    }
  }

  return error instanceof Error ? error.message : "Could not upload ebook PDF.";
}

function getEbookPolicyErrorMessage(error: unknown, role?: string | null) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return `Ebook policy update was forbidden by the backend. Current profile role is ${role ?? "unknown"}; this API requires LIBRARIAN or ADMIN authority in the access token.`;
    }

    if (error.status === 401) {
      return "Your session expired while updating ebook policy. Please sign in again and retry.";
    }

    return formatApiErrorDiagnostic(error);
  }

  return error instanceof Error ? error.message : "Could not update ebook policy.";
}

function formatApiErrorDiagnostic(error: ApiError) {
  const parts = [`Status ${error.status}`];

  if (error.code) {
    parts.push(`code ${error.code}`);
  }

  if (error.traceId) {
    parts.push(`trace ${error.traceId}`);
  }

  if (error.message) {
    parts.push(`message: ${error.message}`);
  }

  return parts.join(" · ");
}

function coverFileName(book: Book | null, coverImage: BookCoverImage | null) {
  if (coverImage?.publicId) {
    return `${coverImage.publicId.split("/").pop()}.jpg`;
  }

  const sourceUrl = coverImage?.originalUrl ?? coverImage?.detailUrl ?? coverImage?.thumbnailUrl;
  if (sourceUrl) {
    const fileName = sourceUrl.split("?")[0]?.split("/").pop();
    if (fileName) return fileName;
  }

  const isbn = book?.isbn?.trim();
  return isbn ? `${isbn}_cover_primary.jpg` : "cover_primary.jpg";
}

function ebookFileName(book: Book | null, ebook: BookEbook | null) {
  const originalFilename = ebook?.originalFilename?.trim();
  if (originalFilename) {
    return originalFilename.toLowerCase().endsWith(".pdf") ? originalFilename : `${originalFilename}.pdf`;
  }

  const publicName = ebook?.publicId?.split("/").pop();
  if (publicName) {
    return publicName.toLowerCase().endsWith(".pdf") ? publicName : `${publicName}.pdf`;
  }

  const isbn = book?.isbn?.trim();
  return isbn ? `${isbn}_ebook.pdf` : "ebook.pdf";
}

function formatProvider(provider?: string | null) {
  if (!provider) return "Cloudinary";
  return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
}

function formatEbookFormat(ebook?: BookEbook | null) {
  const format = ebook?.format ? ebook.format.toUpperCase() : "PDF";
  return [format, ebook?.mimeType].filter(Boolean).join(" · ");
}

function formatEbookDelivery(ebook?: BookEbook | null) {
  const delivery = [ebook?.resourceType, ebook?.deliveryType].filter(Boolean).join(" / ");
  return [formatProvider(ebook?.provider), delivery].filter(Boolean).join(" · ");
}

function formatEbookLoanPolicy(ebook?: BookEbook | null) {
  const concurrentLoans =
    typeof ebook?.maxConcurrentLoans === "number" ? `${ebook.maxConcurrentLoans} concurrent` : "Loan limit pending";
  const duration = typeof ebook?.loanDurationDays === "number" ? `${ebook.loanDurationDays} days` : "";

  return [concurrentLoans, duration].filter(Boolean).join(" · ");
}

function ebookPolicyDraftOf(ebook?: BookEbook | null): EbookPolicyDraft {
  const accessType = ebook?.accessType?.toUpperCase() === "PAID" ? "PAID" : "FREE";

  return {
    accessType,
    accessFee: String(ebook?.accessFee ?? 0),
    currency: ebook?.currency || "VND",
    accessDurationDays: String(ebook?.accessDurationDays ?? ebook?.loanDurationDays ?? 14),
    maxConcurrentLoans: String(ebook?.maxConcurrentLoans ?? 1),
    loanDurationDays: String(ebook?.loanDurationDays ?? ebook?.accessDurationDays ?? 14),
    status: ebook?.status || "ACTIVE",
  };
}

function ebookPolicyEditorKey(ebook?: BookEbook | null) {
  if (!ebook) {
    return "no-ebook";
  }

  return [
    ebook.bookEbookId,
    ebook.status,
    ebook.accessType,
    ebook.accessFee,
    ebook.currency,
    ebook.accessDurationDays,
    ebook.maxConcurrentLoans,
    ebook.loanDurationDays,
    ebook.updatedAt,
  ].join(":");
}

function ebookPolicyPayloadOf(draft: EbookPolicyDraft): UpdateBookEbookPayload {
  const accessType = draft.accessType;

  return {
    accessType,
    accessFee: accessType === "FREE" ? 0 : toPositiveNumber(draft.accessFee, 0),
    currency: draft.currency || "VND",
    accessDurationDays: toPositiveNumber(draft.accessDurationDays, 1),
    maxConcurrentLoans: toPositiveNumber(draft.maxConcurrentLoans, 1),
    loanDurationDays: toPositiveNumber(draft.loanDurationDays, 1),
    status: draft.status || "ACTIVE",
  };
}

function toPositiveNumber(value: string, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.max(fallback, Math.trunc(parsedValue));
}

function formatEbookAccessPolicy(ebook?: BookEbook | null) {
  const accessType = ebook?.accessType?.toUpperCase() || "FREE";
  const fee =
    typeof ebook?.accessFee === "number" && ebook.accessFee > 0
      ? formatMoney(ebook.accessFee, ebook.currency)
      : accessType === "PAID"
        ? "Fee pending"
        : "No fee";

  return `${accessType} · ${fee}`;
}

function formatMoney(amount: number, currency?: string | null) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "VND",
      maximumFractionDigits: currency === "VND" || !currency ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency || ""}`.trim();
  }
}

function formatDurationDays(days?: number | null) {
  return typeof days === "number" ? `${days} days` : "Duration pending";
}

function formatOptionalNumber(value?: number | null) {
  return typeof value === "number" ? String(value) : "Pending";
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(sizeBytes?: number | null) {
  if (typeof sizeBytes !== "number") {
    return "Size pending";
  }

  if (sizeBytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(sizeBytes) / Math.log(1024)), units.length - 1);
  const value = sizeBytes / 1024 ** unitIndex;
  const fractionDigits = unitIndex === 0 || value >= 10 ? 0 : 1;

  return `${value.toFixed(fractionDigits)} ${units[unitIndex]}`;
}
