import type { PDFDocumentProxy } from "pdfjs-dist";

export type ReaderOutlineItem = {
  id: string;
  title: string;
  page: number | null;
  items: ReaderOutlineItem[];
};

export function clampReaderPage(value: number, total: number) {
  return Math.min(
    Math.max(1, Math.trunc(Number.isFinite(value) ? value : 1)),
    Math.max(1, total),
  );
}

/** Resolve real PDF destinations. Broken entries remain headings, never fake page 1 links. */
export async function readReaderOutline(
  doc: Pick<
    PDFDocumentProxy,
    "getOutline" | "getDestination" | "getPageIndex" | "numPages"
  >,
) {
  const outline = await doc.getOutline();
  let remaining = 1000;
  async function resolve(
    items: NonNullable<typeof outline>,
    prefix = "",
    depth = 0,
  ): Promise<ReaderOutlineItem[]> {
    const result: ReaderOutlineItem[] = [];
    if (depth > 12) return result;
    for (const [index, item] of items.entries()) {
      if (remaining-- <= 0) break;
      let page: number | null = null;
      try {
        const destination =
          typeof item.dest === "string"
            ? await doc.getDestination(item.dest)
            : item.dest;
        if (Array.isArray(destination) && destination[0] != null) {
          const pageIndex =
            typeof destination[0] === "number"
              ? destination[0]
              : await doc.getPageIndex(destination[0]);
          if (
            Number.isInteger(pageIndex) &&
            pageIndex >= 0 &&
            pageIndex < doc.numPages
          )
            page = pageIndex + 1;
        }
      } catch {
        /* A malformed destination must not prevent reading the PDF. */
      }
      const id = `${prefix}${index}`;
      result.push({
        id,
        title: item.title?.trim() || "Untitled section",
        page,
        items: await resolve(item.items || [], `${id}.`, depth + 1),
      });
    }
    return result;
  }
  return resolve(outline || []);
}

export function flattenReaderOutline(
  items: ReaderOutlineItem[],
): ReaderOutlineItem[] {
  return items.flatMap((item) => [item, ...flattenReaderOutline(item.items)]);
}

export function activeReaderSection(items: ReaderOutlineItem[], page: number) {
  return (
    flattenReaderOutline(items)
      .filter((item) => item.page != null && item.page <= page)
      .sort(
        (a, b) =>
          (b.page ?? 0) - (a.page ?? 0) ||
          b.id.split(".").length - a.id.split(".").length,
      )[0] ?? null
  );
}

export function filterReaderOutline(
  items: ReaderOutlineItem[],
  query: string,
): ReaderOutlineItem[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return items;
  return items.flatMap((item) => {
    const children = filterReaderOutline(item.items, term);
    return item.title.toLocaleLowerCase().includes(term)
      ? [item]
      : children.length
        ? [{ ...item, items: children }]
        : [];
  });
}
