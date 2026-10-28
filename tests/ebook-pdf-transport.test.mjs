import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchReaderPdf, PdfTransportError } from "../src/features/ebook/services/pdfTransport.ts";

const api = "https://api.library.test";
const content = { signedUrl: "/api/ebooks/3343/reader/file", requiresAuthorization: true };
const pdf = () => new Response("%PDF-1.7\nexample", { headers: { "Content-Type": "application/pdf" } });

test("private PDF sends JWT/session only to the fixed API path, with no URL tokens or cache", async () => {
  let calls = 0;
  const fetcher = async (url, init) => {
    calls++;
    assert.equal(url, `${api}/api/ebooks/3343/reader/file`);
    assert.equal(init.headers.get("Authorization"), "Bearer access");
    assert.equal(init.headers.get("X-Reading-Session"), "session");
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "error");
    return pdf();
  };
  const bytes = await fetchReaderPdf(content, 3343, "session", "access", api, undefined, fetcher);
  assert.equal(new TextDecoder().decode(bytes).slice(0, 5), "%PDF-");
  assert.equal(calls, 1);
});

for (const path of ["https://evil.test/steal", "//evil.test/x", "/api/ebooks/3342/reader/file", "/api/ebooks/3343/reader/file?token=x"]) {
  test(`reject credential forwarding to ${path}`, async () => {
    await assert.rejects(fetchReaderPdf({ ...content, signedUrl: path }, 3343, "session", "access", api,
      undefined, async () => { throw new Error("must not fetch"); }), PdfTransportError);
  });
}

test("legacy Cloudinary fetch must omit all JWT/session credentials", async () => {
  await fetchReaderPdf({ signedUrl: "https://res.cloudinary.com/demo/raw/authenticated/file.pdf" },
    3343, "session", "access", api, undefined, async (url, init) => {
      assert.equal(init.headers.get("Authorization"), null);
      assert.equal(init.headers.get("X-Reading-Session"), null);
      assert.equal(init.credentials, "omit");
      return pdf();
    });
});

test("private loopback storage URL from an old backend is not requested", async () => {
  await assert.rejects(fetchReaderPdf({ signedUrl: "http://127.0.0.1:8333/private/file.pdf" },
    3343, "session", "access", api, undefined, async () => { throw new Error("must not fetch"); }), PdfTransportError);
});

test("401 retries exactly once with refreshed access token", async () => {
  let calls = 0;
  let refreshes = 0;
  await fetchReaderPdf(content, 3343, "session", "expired", api, async () => { refreshes++; return "fresh"; },
    async (url, init) => {
      calls++;
      assert.equal(init.headers.get("Authorization"), calls === 1 ? "Bearer expired" : "Bearer fresh");
      return calls === 1 ? new Response("", { status: 401 }) : pdf();
    });
  assert.equal(calls, 2);
  assert.equal(refreshes, 1);
});

test("403 is not retried and preserves the reader error code", async () => {
  let refreshes = 0;
  await assert.rejects(fetchReaderPdf(content, 3343, "wrong", "access", api,
    async () => { refreshes++; return "fresh"; }, async () => new Response('{"code":"READING_SESSION_FORBIDDEN"}',
      { status: 403, headers: { "Content-Type": "application/json" } })),
  (error) => error.status === 403 && error.code === "READING_SESSION_FORBIDDEN");
  assert.equal(refreshes, 0);
});

test("HTML/JSON success responses must not be passed to PDF.js", async () => {
  await assert.rejects(fetchReaderPdf(content, 3343, "session", "access", api, undefined,
    async () => new Response("<html>login</html>")), (error) => error.status === 502);
});
