"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/types/api.type";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasStaffAccessFromToken } from "@/features/auth/utils/authRoles";
import { Author } from "../types/catalog.type";
import { createAuthor, getAuthors, updateAuthor, updateAuthorImage } from "../services/catalogService";
import { entityIdOf } from "./catalogHelpers";
import { CatalogShell, Notice } from "./CatalogShell";
import { compareText, downloadCsv, SortableHeader, SortDirection } from "./tableUtilities";

type AuthorSortKey = "name" | "bio";

const AUTHOR_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const AUTHOR_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const AUTHOR_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export function AuthorsAdminPage() {
  const { accessToken, currentUser, hasStaffAccess, refresh } = useAuth();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [editing, setEditing] = useState<Author | null>(null);
  const [formValues, setFormValues] = useState({ bio: "", name: "" });
  const [selectedPortrait, setSelectedPortrait] = useState<File | null>(null);
  const [selectedPortraitPreviewUrl, setSelectedPortraitPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [dirtyAuthorIds, setDirtyAuthorIds] = useState<string[]>([]);
  const [tableSort, setTableSort] = useState<{ key: AuthorSortKey; direction: SortDirection }>({
    key: "name",
    direction: "asc",
  });
  const canUseAuthorImageApi = hasStaffAccess || hasStaffAccessFromToken(accessToken);
  const authorImagePermissionNotice = `Author portrait upload requires LIBRARIAN or ADMIN authority. Current role: ${currentUser?.role ?? "unknown"}. If this account was recently changed, please log out and log in again.`;

  useEffect(() => {
    let isMounted = true;
    getAuthors(authorSearch ? { name: authorSearch } : {})
      .then((items) => {
        if (isMounted) setAuthors(items);
      })
      .catch((fetchError) => {
        if (isMounted) setError(fetchError instanceof Error ? fetchError.message : "Could not load authors.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingAuthors(false);
      });
    return () => {
      isMounted = false;
    };
  }, [authorSearch, message]);

  useEffect(() => {
    return () => {
      if (selectedPortraitPreviewUrl) {
        URL.revokeObjectURL(selectedPortraitPreviewUrl);
      }
    };
  }, [selectedPortraitPreviewUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      name: formValues.name.trim(),
      bio: formValues.bio.trim(),
    };

    if (!payload.name) {
      setError("Author name is required.");
      return;
    }

    if (selectedPortrait && !canUseAuthorImageApi) {
      setError(authorImagePermissionNotice);
      return;
    }

    setIsSubmitting(true);

    try {
      if (editing) {
        const authorId = entityIdOf(editing);
        let savedAuthor = await updateAuthor(authorId, payload, accessToken);

        if (selectedPortrait) {
          savedAuthor = await saveAuthorPortrait(
            authorId,
            selectedPortrait,
            accessToken,
            async () => (await refresh())?.accessToken ?? null,
          );
        }

        setAuthors((current) => upsertAuthor(current, { ...editing, ...savedAuthor }, authorId));
        setMessage(selectedPortrait ? "Author and portrait updated." : "Author updated.");
      } else {
        let savedAuthor = await createAuthor(payload, accessToken);
        const authorId = entityIdOf(savedAuthor);

        if (selectedPortrait) {
          if (!authorId) {
            throw new Error("Author was created but the backend did not return an author ID for image upload.");
          }

          savedAuthor = await saveAuthorPortrait(
            authorId,
            selectedPortrait,
            accessToken,
            async () => (await refresh())?.accessToken ?? null,
          );
        }

        setAuthors((current) => upsertAuthor(current, savedAuthor, authorId));
        setMessage(selectedPortrait ? "Author created with portrait." : "Author created.");
      }

      resetAuthorForm();
      setError("");
    } catch (submitError) {
      setError(getAuthorSaveErrorMessage(submitError, currentUser?.role));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleInlineSave(author: Author, form: HTMLFormElement) {
    const authorId = entityIdOf(author);
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      bio: String(formData.get("bio") ?? "").trim(),
    };

    if (!payload.name) {
      setError("Author name is required.");
      return;
    }

    try {
      const updatedAuthor = await updateAuthor(authorId, payload, accessToken);
      setAuthors((current) => upsertAuthor(current, { ...author, ...updatedAuthor }, authorId));
      setMessage(`Updated ${payload.name}.`);
      setDirtyAuthorIds((current) => current.filter((id) => id !== authorId));
      setError("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not update author.");
    }
  }

  const sortedAuthors = useMemo(
    () => [...authors].sort((a, b) => compareText(a[tableSort.key] ?? "", b[tableSort.key] ?? "", tableSort.direction)),
    [authors, tableSort],
  );
  const authorsWithPortraits = useMemo(() => authors.filter((author) => Boolean(author.imageUrl?.trim())).length, [authors]);

  function updateSort(key: AuthorSortKey) {
    setTableSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function markAuthorDirty(authorId: string) {
    setDirtyAuthorIds((current) => (current.includes(authorId) ? current : [...current, authorId]));
  }

  function exportAuthors() {
    downloadCsv(
      "authors.csv",
      ["Name", "Bio", "Image URL", "Image provider"],
      sortedAuthors.map((author) => [author.name, author.bio || "", author.imageUrl || "", author.imageProvider || ""]),
    );
  }

  function handleSearchAuthors(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthorSearch(searchDraft.trim());
  }

  function handleFormPortraitChange(event: ChangeEvent<HTMLInputElement>) {
    const file = readAuthorImageFile(event, setError);

    if (!file) {
      setSelectedPortrait(null);
      setSelectedPortraitPreviewUrl("");
      return;
    }

    setSelectedPortrait(file);
    setSelectedPortraitPreviewUrl(URL.createObjectURL(file));
    setError("");
  }

  function openAuthorInForm(author: Author) {
    setEditing(author);
    setFormValues({ bio: author.bio ?? "", name: author.name });
    setError("");
  }

  function resetAuthorForm() {
    setEditing(null);
    setFormValues({ bio: "", name: "" });
    setSelectedPortrait(null);
    setSelectedPortraitPreviewUrl("");
  }

  return (
    <CatalogShell
      protectedPage
      wide
      frameless
      hideHeader
      eyebrow="Author registry"
      title="Manage authors"
      description="Create, edit, and organize author records used across the catalog."
    >
      <section className="mx-auto w-full max-w-[1600px] rounded-[22px] border border-[#DCE4F0] bg-white px-5 py-6 shadow-[0_22px_70px_rgba(15,23,42,0.10)] md:px-8 md:py-8 xl:px-9">
        <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-wide text-[#173A73]">Author registry</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-[#071330] md:text-[2.45rem]">Manage authors</h1>
            <p className="mt-2 max-w-2xl text-base font-medium leading-7 text-[#51617E]">
              Create, edit, and organize author records used across the catalog.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={exportAuthors}
              className="inline-flex h-14 cursor-pointer items-center justify-center gap-3 rounded-xl bg-[#E60028] px-8 text-sm font-black text-white shadow-[0_16px_30px_rgba(230,0,40,0.20)] transition hover:bg-[#C90024]"
            >
              <Icon name="download" size={18} />
              Export authors
            </button>
            <Link
              href="/staff/books"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-xl border border-[#D9E1EE] bg-white px-8 text-sm font-black text-[#071330] shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:border-[#AAB7CA] hover:text-[#E60028]"
            >
              <Icon name="arrow-left" size={18} />
              Back to staff books
            </Link>
          </div>
        </header>

        <div className="mt-8 grid gap-6 xl:grid-cols-[460px_minmax(0,1fr)]">
          <AuthorEditorCard
            editing={editing}
            formValues={formValues}
            selectedPortrait={selectedPortrait}
            selectedPortraitPreviewUrl={selectedPortraitPreviewUrl}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onPortraitChange={handleFormPortraitChange}
            onFormValueChange={setFormValues}
            onReset={resetAuthorForm}
          />

          <section className="min-w-0">
            <div className="grid gap-3">
              {message ? <Notice tone="success" message={message} /> : null}
              {error ? <Notice tone="error" message={error} /> : null}
            </div>

            <form onSubmit={handleSearchAuthors} className="flex flex-col gap-3 rounded-2xl border border-[#D9E1EE] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)] md:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search authors by name</span>
                <Icon name="search" size={21} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#7A8AA6]" />
                <input
                  name="authorSearch"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Search authors by name..."
                  className="h-14 w-full rounded-xl border border-[#D9E1EE] bg-white pl-14 pr-4 text-base font-medium text-[#071330] outline-none transition placeholder:text-[#7A8AA6] focus:border-[#173A73] focus:shadow-[0_0_0_4px_rgba(23,58,115,0.10)]"
                />
              </label>
              <button type="submit" className="h-14 cursor-pointer rounded-xl bg-[#071330] px-8 text-sm font-black text-white transition hover:bg-[#15264C]">
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchDraft("");
                  setAuthorSearch("");
                }}
                className="h-14 cursor-pointer rounded-xl border border-[#D9E1EE] bg-white px-8 text-sm font-black text-[#071330] shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:border-[#AAB7CA]"
              >
                Clear
              </button>
            </form>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AuthorMetricCard icon="users" label="Authors total" value={authors.length} help="Total authors in catalog" tone="blue" />
              <AuthorMetricCard icon="image" label="With portraits" value={authorsWithPortraits} help="Authors with images" tone="green" />
              <AuthorMetricCard icon="edit" label="Unsaved edits" value={dirtyAuthorIds.length} help="Changes not saved" tone="gold" />
              <AuthorMetricCard icon="file" label="First page" value={authors.length} help="Shown on this page" tone="purple" />
            </div>

            <AuthorTable
              authors={sortedAuthors}
              dirtyAuthorIds={dirtyAuthorIds}
              isLoading={isLoadingAuthors}
              tableSort={tableSort}
              onSort={updateSort}
              onMarkDirty={markAuthorDirty}
              onInlineSave={handleInlineSave}
              onOpenForm={openAuthorInForm}
            />
          </section>
        </div>
      </section>
    </CatalogShell>
  );
}

function AuthorEditorCard({
  editing,
  formValues,
  selectedPortrait,
  selectedPortraitPreviewUrl,
  isSubmitting,
  onSubmit,
  onPortraitChange,
  onFormValueChange,
  onReset,
}: {
  editing: Author | null;
  formValues: { bio: string; name: string };
  selectedPortrait: File | null;
  selectedPortraitPreviewUrl: string;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPortraitChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFormValueChange: (value: { bio: string; name: string } | ((current: { bio: string; name: string }) => { bio: string; name: string })) => void;
  onReset: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[#D9E1EE] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF4FF] text-[#1473D2]">
          <Icon name="edit" size={21} />
        </span>
        <div className="min-w-0">
          <h2 className="text-2xl font-black leading-tight text-[#071330]">{editing ? "Edit author" : "Create new author"}</h2>
          <p className="mt-2 text-base font-medium text-[#64708B]">
            {editing ? "Update this author's profile and portrait." : "Add a new author to the catalog."}
          </p>
        </div>
      </div>

      <label className="mt-7 block">
        <span className="text-sm font-black text-[#071330]">Portrait image (optional)</span>
        <span className="mt-3 flex min-h-[225px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#CAD5E7] bg-white px-5 py-7 text-center transition hover:border-[#E60028] hover:bg-[#FFF8F9]">
          <AuthorImagePreview
            authorName={editing?.name || formValues.name || "Author"}
            currentImageUrl={editing?.imageUrl ?? ""}
            selectedPortrait={selectedPortrait}
            selectedPortraitPreviewUrl={selectedPortraitPreviewUrl}
          />
          <span className="mt-5 text-base font-black text-[#071330]">
            {selectedPortrait ? "Preview selected portrait" : editing?.imageUrl ? "Current portrait preview" : "Upload portrait"}
          </span>
          <span className="mt-2 text-sm font-medium text-[#64708B]">JPG, PNG or WEBP - Max 5MB</span>
          <span className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-[#D9E1EE] bg-white px-7 text-sm font-black text-[#071330] shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            {selectedPortrait || editing?.imageUrl ? "Replace image" : "Choose file"}
          </span>
          {selectedPortrait ? (
            <span className="mt-3 max-w-full truncate rounded-lg bg-[#EEF9F2] px-3 py-2 text-xs font-bold text-[#22734E]">
              {selectedPortrait.name} - {formatFileSize(selectedPortrait.size)}
            </span>
          ) : null}
          <input type="file" accept={AUTHOR_IMAGE_ACCEPT} onChange={onPortraitChange} className="sr-only" />
        </span>
      </label>

      <label className="mt-7 block">
        <span className="text-sm font-black text-[#071330]">Author full name *</span>
        <input
          name="name"
          value={formValues.name}
          onChange={(event) => onFormValueChange((current) => ({ ...current, name: event.target.value }))}
          placeholder="Enter author full name"
          className="mt-3 h-14 w-full rounded-xl border border-[#C9D5E8] bg-white px-4 text-base font-medium text-[#071330] outline-none transition placeholder:text-[#7A8AA6] focus:border-[#173A73] focus:shadow-[0_0_0_4px_rgba(23,58,115,0.10)]"
        />
      </label>

      <label className="mt-6 block">
        <span className="text-sm font-black text-[#071330]">Bio / Description</span>
        <textarea
          name="bio"
          value={formValues.bio}
          onChange={(event) => onFormValueChange((current) => ({ ...current, bio: event.target.value }))}
          rows={6}
          placeholder="Share a short bio about the author..."
          className="mt-3 w-full resize-y rounded-xl border border-[#C9D5E8] bg-white px-4 py-4 text-base font-medium leading-6 text-[#071330] outline-none transition placeholder:text-[#7A8AA6] focus:border-[#173A73] focus:shadow-[0_0_0_4px_rgba(23,58,115,0.10)]"
        />
      </label>

      <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-14 cursor-pointer items-center justify-center gap-3 rounded-xl bg-[#E60028] px-8 text-sm font-black text-white shadow-[0_16px_30px_rgba(230,0,40,0.20)] transition hover:bg-[#C90024] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name={isSubmitting ? "upload" : "plus"} size={18} animate={isSubmitting ? "pulse" : "none"} />
          {editing ? "Save author" : "Create author"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="h-14 cursor-pointer rounded-xl border border-[#D9E1EE] bg-white px-8 text-sm font-black text-[#071330] shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:border-[#AAB7CA]"
        >
          Reset
        </button>
      </div>
    </form>
  );
}

function AuthorMetricCard({
  icon,
  label,
  value,
  help,
  tone,
}: {
  icon: "users" | "image" | "edit" | "file";
  label: string;
  value: number;
  help: string;
  tone: "blue" | "green" | "gold" | "purple";
}) {
  const toneClass = {
    blue: "bg-[#EAF4FF] text-[#1473D2]",
    green: "bg-[#DFF8E9] text-[#1F9D62]",
    gold: "bg-[#FFF1D6] text-[#D58A00]",
    purple: "bg-[#F1E3FF] text-[#8D42D6]",
  }[tone];

  return (
    <div className="flex min-h-[106px] items-center gap-4 rounded-2xl border border-[#D9E1EE] bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${toneClass}`}>
        <Icon name={icon} size={23} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#64708B]">{label}</p>
        <p className="mt-1 text-3xl font-black leading-none text-[#071330]">{value}</p>
        <p className="mt-2 truncate text-sm font-medium text-[#51617E]">{help}</p>
      </div>
    </div>
  );
}

function AuthorTable({
  authors,
  dirtyAuthorIds,
  isLoading,
  tableSort,
  onSort,
  onMarkDirty,
  onInlineSave,
  onOpenForm,
}: {
  authors: Author[];
  dirtyAuthorIds: string[];
  isLoading: boolean;
  tableSort: { key: AuthorSortKey; direction: SortDirection };
  onSort: (key: AuthorSortKey) => void;
  onMarkDirty: (authorId: string) => void;
  onInlineSave: (author: Author, form: HTMLFormElement) => void;
  onOpenForm: (author: Author) => void;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#D9E1EE] bg-white shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] border-collapse text-left text-sm">
          <thead className="bg-[#071330] text-white">
            <tr>
              <th className="w-[120px] px-6 py-4 font-black">Portrait</th>
              <th className="px-4 py-4 font-black">
                <SortableHeader active={tableSort.key === "name"} direction={tableSort.direction} onClick={() => onSort("name")}>
                  Author name
                </SortableHeader>
              </th>
              <th className="px-4 py-4 font-black">
                <SortableHeader active={tableSort.key === "bio"} direction={tableSort.direction} onClick={() => onSort("bio")}>
                  Bio
                </SortableHeader>
              </th>
              <th className="w-[310px] px-6 py-4 font-black">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="border-t border-[#E4EAF4]">
                  <td className="px-6 py-5">
                    <div className="h-12 w-12 animate-pulse rounded-full bg-[#EEF2F7]" />
                  </td>
                  <td className="px-4 py-5">
                    <div className="h-4 w-40 animate-pulse rounded bg-[#EEF2F7]" />
                    <div className="mt-3 h-3 w-24 animate-pulse rounded bg-[#F4F6FA]" />
                  </td>
                  <td className="px-4 py-5">
                    <div className="h-14 w-full animate-pulse rounded-xl bg-[#F4F6FA]" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-11 w-40 animate-pulse rounded-xl bg-[#F4F6FA]" />
                  </td>
                </tr>
              ))
            ) : authors.length ? (
              authors.map((author) => {
                const authorId = entityIdOf(author);

                return (
                  <tr key={authorId} className="border-t border-[#E4EAF4] align-middle">
                    <td className="px-6 py-5">
                      <AuthorAvatar author={author} />
                    </td>
                    <td className="px-4 py-5">
                      <form id={`author-${authorId}`} onSubmit={(event) => event.preventDefault()}>
                        <input type="hidden" name="name" value={author.name} readOnly />
                      </form>
                      <p className="max-w-[260px] truncate text-base font-black text-[#071330]">{author.name}</p>
                      <p className="mt-1 text-sm font-medium text-[#51617E]">{author.imageUrl ? "Portrait ready" : "No portrait"}</p>
                    </td>
                    <td className="px-4 py-5">
                      <textarea
                        form={`author-${authorId}`}
                        name="bio"
                        defaultValue={author.bio || ""}
                        onChange={() => onMarkDirty(authorId)}
                        rows={2}
                        placeholder="-"
                        className="min-h-[60px] w-full resize-y rounded-lg border border-[#D9E1EE] bg-white px-4 py-3 text-base font-medium leading-5 text-[#071330] outline-none transition placeholder:text-[#071330] focus:border-[#173A73] focus:shadow-[0_0_0_4px_rgba(23,58,115,0.10)]"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onInlineSave(author, document.getElementById(`author-${authorId}`) as HTMLFormElement)}
                          className="h-11 cursor-pointer rounded-xl border border-[#D9E1EE] bg-white px-6 text-sm font-black text-[#071330] shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:border-[#AAB7CA]"
                        >
                          {dirtyAuthorIds.includes(authorId) ? "Save*" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenForm(author)}
                          className="h-11 cursor-pointer rounded-xl border border-[#D9E1EE] bg-white px-6 text-sm font-black text-[#071330] shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:border-[#AAB7CA] hover:text-[#E60028]"
                        >
                          Open form
                        </button>
                        <button
                          type="button"
                          aria-label={`More actions for ${author.name}`}
                          className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl text-[#51617E] transition hover:bg-[#F4F6FA] hover:text-[#071330]"
                        >
                          <Icon name="more-vertical" size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <div className="mx-auto max-w-sm">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#F3E5E8] text-[#7A263A]">
                      <Icon name="users" size={25} />
                    </span>
                    <p className="mt-4 text-base font-black text-[#071330]">No authors found</p>
                    <p className="mt-2 text-sm font-medium text-[#51617E]">Try another search term or create a new author.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col justify-between gap-4 border-t border-[#E4EAF4] px-6 py-5 text-sm font-medium text-[#51617E] md:flex-row md:items-center">
        <p>{authors.length ? `Showing 1 to ${authors.length} of ${authors.length} authors` : "Showing 0 authors"}</p>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Previous page" className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-[#D9E1EE] text-[#51617E] transition hover:border-[#AAB7CA]">
            <Icon name="chevron-left" size={17} />
          </button>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#E60028] text-sm font-black text-white">1</span>
          <button type="button" aria-label="Next page" className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-[#D9E1EE] text-[#51617E] transition hover:border-[#AAB7CA]">
            <Icon name="chevron-right" size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthorAvatar({ author }: { author: Author }) {
  const imageUrl = author.imageUrl?.trim();
  const tone = getAuthorTone(author.name);

  return (
    <div className={`relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-black ${tone}`}>
      {imageUrl ? (
        <Image src={imageUrl} alt={`${author.name} portrait`} fill unoptimized sizes="48px" className="object-cover" />
      ) : (
        <span>{authorInitials(author.name)}</span>
      )}
    </div>
  );
}

function AuthorImagePreview({
  authorName,
  currentImageUrl,
  selectedPortrait,
  selectedPortraitPreviewUrl,
}: {
  authorName: string;
  currentImageUrl: string;
  selectedPortrait: File | null;
  selectedPortraitPreviewUrl: string;
}) {
  const previewUrl = selectedPortraitPreviewUrl || currentImageUrl.trim();
  const previewLabel = selectedPortrait ? "Selected image" : previewUrl ? "Current image" : "No image selected";

  return (
    <span className="relative flex h-56 w-full max-w-[320px] items-center justify-center overflow-hidden rounded-2xl border border-[#D9E1EE] bg-[#F8FAFD] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.70)]">
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt={`${authorName} portrait preview`}
          fill
          unoptimized
          sizes="320px"
          className="object-cover"
        />
      ) : (
        <span className="flex flex-col items-center justify-center text-[#8E2F6F]">
          <span className="grid h-20 w-20 place-items-center rounded-full border border-[#E2C5D2] bg-[#F6DDE7]">
            <Icon name="camera" size={28} />
          </span>
          <span className="mt-4 text-sm font-bold text-[#64708B]">No portrait selected</span>
        </span>
      )}
      <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-black text-[#071330] shadow-[0_8px_18px_rgba(15,23,42,0.10)]">
        {previewLabel}
      </span>
    </span>
  );
}

async function saveAuthorPortrait(
  authorId: string,
  file: File,
  accessToken: string | null,
  refreshAccessToken: () => Promise<string | null>,
) {
  try {
    return await updateAuthorImage(authorId, file, accessToken);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        return updateAuthorImage(authorId, file, refreshedToken);
      }
    }

    throw error;
  }
}

function getAuthorSaveErrorMessage(error: unknown, role?: string | null) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return `Author portrait upload was forbidden by the backend. Current profile role is ${role ?? "unknown"}; this API requires LIBRARIAN or ADMIN authority in the access token.`;
    }

    if (error.status === 401) {
      return "Your session expired while saving the author portrait. Please sign in again and retry.";
    }
  }

  return error instanceof Error ? error.message : "Could not save author.";
}

function readAuthorImageFile(event: ChangeEvent<HTMLInputElement>, setError: (message: string) => void) {
  const file = event.currentTarget.files?.[0] ?? null;

  if (!file) {
    return null;
  }

  const validationError = validateAuthorImage(file);

  if (validationError) {
    setError(validationError);
    event.currentTarget.value = "";
    return null;
  }

  return file;
}

function validateAuthorImage(file: File) {
  if (file.size > AUTHOR_IMAGE_MAX_BYTES) {
    return "Author portrait must be 5MB or smaller.";
  }

  const fileName = file.name.toLowerCase();
  const hasSupportedExtension = AUTHOR_IMAGE_EXTENSIONS.some((extension) => fileName.endsWith(extension));
  const hasSupportedMimeType = AUTHOR_IMAGE_ACCEPT.split(",").includes(file.type);

  if (!hasSupportedExtension && !hasSupportedMimeType) {
    return "Author portrait must be a JPG, PNG, or WEBP file.";
  }

  return "";
}

function upsertAuthor(authors: Author[], updatedAuthor: Author, fallbackId: string) {
  const updatedId = entityIdOf(updatedAuthor) || fallbackId;

  if (!updatedId) {
    return authors;
  }

  const exists = authors.some((author) => entityIdOf(author) === updatedId);

  if (!exists) {
    return [updatedAuthor, ...authors];
  }

  return authors.map((author) => (entityIdOf(author) === updatedId ? { ...author, ...updatedAuthor } : author));
}

function getAuthorTone(name: string) {
  const tones = [
    "bg-[#F9DCE7] text-[#9B244A]",
    "bg-[#F0D8F6] text-[#7A278F]",
    "bg-[#F7E2DA] text-[#9A452D]",
    "bg-[#CBEDEA] text-[#0C7870]",
    "bg-[#FFF0CC] text-[#B67800]",
  ];
  const index = name.charCodeAt(0) % tones.length;
  return tones[index];
}

function authorInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "A";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
