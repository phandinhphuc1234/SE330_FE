"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Category } from "../types/catalog.type";
import { createCategory, getCategories, updateCategory } from "../services/catalogService";
import { entityIdOf } from "./catalogHelpers";
import { CatalogShell, Notice, SecondaryAction } from "./CatalogShell";
import { compareText, downloadCsv, SortableHeader, SortDirection } from "./tableUtilities";

type CategorySortKey = "name" | "description";

export function CategoriesAdminPage() {
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formValues, setFormValues] = useState({ description: "", name: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirtyCategoryIds, setDirtyCategoryIds] = useState<string[]>([]);
  const [tableSort, setTableSort] = useState<{ key: CategorySortKey; direction: SortDirection }>({
    key: "name",
    direction: "asc",
  });

  useEffect(() => {
    let isMounted = true;
    getCategories()
      .then((items) => {
        if (isMounted) setCategories(items);
      })
      .catch((fetchError) => {
        if (isMounted) setError(fetchError instanceof Error ? fetchError.message : "Could not load categories.");
      });
    return () => {
      isMounted = false;
    };
  }, [message]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
    };

    if (!payload.name) {
      setError("Category name is required.");
      return;
    }

    try {
      if (editing) {
        await updateCategory(entityIdOf(editing), payload, accessToken);
        setMessage("Category updated.");
      } else {
        await createCategory(payload, accessToken);
        setMessage("Category created.");
      }
      setEditing(null);
      setFormValues({ description: "", name: "" });
      setError("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save category.");
    }
  }

  async function handleInlineSave(category: Category, form: HTMLFormElement) {
    const categoryId = entityIdOf(category);
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
    };

    if (!payload.name) {
      setError("Category name is required.");
      return;
    }

    try {
      await updateCategory(categoryId, payload, accessToken);
      setMessage(`Updated ${payload.name}.`);
      setDirtyCategoryIds((current) => current.filter((id) => id !== categoryId));
      setError("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not update category.");
    }
  }

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => compareText(a[tableSort.key] ?? "", b[tableSort.key] ?? "", tableSort.direction)),
    [categories, tableSort],
  );

  function updateSort(key: CategorySortKey) {
    setTableSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function markCategoryDirty(categoryId: string) {
    setDirtyCategoryIds((current) => (current.includes(categoryId) ? current : [...current, categoryId]));
  }

  function exportCategories() {
    downloadCsv(
      "categories.csv",
      ["Name", "Description"],
      sortedCategories.map((category) => [category.name, category.description || ""]),
    );
  }

  return (
    <CatalogShell
      protectedPage
      eyebrow="Admin taxonomy"
      title="Manage categories"
      description="Create and edit categories. No delete action is shown because the current API does not expose category deletion."
      actions={<SecondaryAction href="/admin/books">Back to admin books</SecondaryAction>}
    >
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#DED5C8] bg-[#F7F3EA] p-5">
          <h2 className="text-lg font-bold text-[#2B2723]">{editing ? "Edit category" : "Create category"}</h2>
          <label className="mt-4 block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#2B2723]">Name</span>
            <input
              name="name"
              value={formValues.name}
              onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-[#D8CCBC] bg-white px-4 py-3 outline-none focus:border-[#7A263A]"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#2B2723]">Description</span>
            <textarea
              name="description"
              value={formValues.description}
              onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              className="mt-2 w-full rounded-xl border border-[#D8CCBC] bg-white px-4 py-3 outline-none focus:border-[#7A263A]"
            />
          </label>
          <button type="submit" className="mt-5 rounded-full bg-[#7A263A] px-5 py-3 text-sm font-bold text-white">
            {editing ? "Save category" : "Create category"}
          </button>
        </form>

        <section>
          <div className="grid gap-3">
            {message ? <Notice tone="success" message={message} /> : null}
            {error ? <Notice tone="error" message={error} /> : null}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DED5C8] bg-white p-4">
            <p className="text-sm font-semibold text-[#5F574F]">
              {categories.length} categories
              {dirtyCategoryIds.length ? <span className="ml-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{dirtyCategoryIds.length} unsaved</span> : null}
            </p>
            <button type="button" onClick={exportCategories} className="rounded-full border border-[#D8CCBC] px-4 py-2 text-sm font-bold text-[#2B2723] hover:border-[#7A263A]">
              Export categories
            </button>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-[#DED5C8]">
            <table className="w-full border-collapse bg-white text-left text-sm">
              <thead className="bg-[#2B2723] text-white">
                <tr>
                  <th className="px-4 py-3"><SortableHeader active={tableSort.key === "name"} direction={tableSort.direction} onClick={() => updateSort("name")}>Name</SortableHeader></th>
                  <th className="px-4 py-3"><SortableHeader active={tableSort.key === "description"} direction={tableSort.direction} onClick={() => updateSort("description")}>Description</SortableHeader></th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((category) => {
                  const categoryId = entityIdOf(category);

                  return (
                  <tr key={categoryId} className="border-t border-[#DED5C8] align-top">
                    <td className="px-4 py-3">
                      <form id={`category-${categoryId}`} onSubmit={(event) => event.preventDefault()}>
                        <input name="name" defaultValue={category.name} onChange={() => markCategoryDirty(categoryId)} className="w-full rounded-lg border border-[#D8CCBC] px-3 py-2 font-bold text-[#2B2723] outline-none focus:border-[#7A263A]" />
                      </form>
                    </td>
                    <td className="px-4 py-3 text-[#5F574F]">
                      <textarea form={`category-${categoryId}`} name="description" defaultValue={category.description || ""} onChange={() => markCategoryDirty(categoryId)} rows={3} className="w-full rounded-lg border border-[#D8CCBC] px-3 py-2 outline-none focus:border-[#7A263A]" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleInlineSave(category, document.getElementById(`category-${categoryId}`) as HTMLFormElement)}
                          className="rounded-full border border-[#D8CCBC] px-3 py-1.5 font-bold text-[#2B2723]"
                        >
                          {dirtyCategoryIds.includes(categoryId) ? "Save changes" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(category);
                            setFormValues({ description: category.description ?? "", name: category.name });
                          }}
                          className="rounded-full border border-[#D8CCBC] px-3 py-1.5 font-bold text-[#7A263A]"
                        >
                          Open form
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </CatalogShell>
  );
}
