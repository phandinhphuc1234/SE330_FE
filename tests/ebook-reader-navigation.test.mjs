import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clampReaderPage,
  readReaderOutline,
  activeReaderSection,
  filterReaderOutline,
} from "../src/features/ebook/components/readerNavigation.ts";

test("page bounds reject nonfinite values and clamp without fractional pages", () => {
  assert.equal(clampReaderPage(-4, 22), 1);
  assert.equal(clampReaderPage(99, 22), 22);
  assert.equal(clampReaderPage(5.9, 22), 5);
  assert.equal(clampReaderPage(NaN, 22), 1);
  assert.equal(clampReaderPage(Infinity, 22), 1);
  assert.equal(clampReaderPage(5, 0), 1);
});
test("outline uses actual named/index/reference destinations and one-based pages", async () => {
  const items = await readReaderOutline({
    numPages: 22,
    getOutline: async () => [
      {
        title: "Chapter 13",
        dest: "chapter",
        items: [{ title: "MVCC", dest: [4], items: [] }],
      },
      { title: "Locks", dest: [{ num: 42, gen: 0 }], items: [] },
    ],
    getDestination: async () => [0],
    getPageIndex: async () => 10,
  });
  assert.equal(items[0].page, 1);
  assert.equal(items[0].items[0].page, 5);
  assert.equal(items[1].page, 11);
  assert.equal(activeReaderSection(items, 6)?.title, "MVCC");
});
test("missing PDF bookmarks remain empty, not invented chapters", async () => {
  assert.deepEqual(
    await readReaderOutline({ numPages: 22, getOutline: async () => null }),
    [],
  );
});
test("broken, remote and out-of-range outline destinations never become page 1 links", async () => {
  const items = await readReaderOutline({
    numPages: 22,
    getOutline: async () => [
      { title: "Missing", dest: "missing", items: [] },
      { title: "Outside", dest: [999], items: [] },
      { title: "Remote", url: "https://example.test", items: [] },
    ],
    getDestination: async () => {
      throw new Error("missing");
    },
  });
  assert.deepEqual(
    items.map((item) => item.page),
    [null, null, null],
  );
});
test("outline filtering keeps ancestor path without changing the source tree", () => {
  const entries = [
    {
      id: "0",
      title: "Concurrency",
      page: 1,
      items: [
        { id: "0.0", title: "MVCC", page: 3, items: [] },
        { id: "0.1", title: "Locking", page: 10, items: [] },
      ],
    },
  ];
  const filtered = filterReaderOutline(entries, " locking ");
  assert.equal(filtered[0].items.length, 1);
  assert.equal(filtered[0].items[0].page, 10);
  assert.equal(entries[0].items.length, 2);
  assert.deepEqual(filterReaderOutline(entries, "not present"), []);
});
test("untrusted outlines have a bounded UI item count", async () => {
  const items = await readReaderOutline({
    numPages: 1,
    getOutline: async () =>
      Array.from({ length: 1500 }, (_, index) => ({
        title: `Section ${index}`,
        dest: [0],
        items: [],
      })),
  });
  assert.equal(items.length, 1000);
});
