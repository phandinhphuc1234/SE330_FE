# Premium PDF reader redesign — 29/10/2026

Scope: frontend implementation on `codex/premium-pdf-reader`. No backend,
authentication contract, ebook API service, PDF transport, route or dependency
version was changed. Release status is tracked by the pull request checks and
Vercel deployment, separately from the local implementation evidence below.

Design follows the owner's supplied reference and brief, inspired by
[Ronas IT's reading-app concept](https://dribbble.com/shots/25983609-Reading-Web-App-UI-Design),
using The Athenaeum's ivory, charcoal and burgundy design tokens. The original
PDF is not rebuilt as HTML or replaced with reference-image text/page counts.

## Problems found and implementation

The previous reader nested a catalog hero, padded white card and dark canvas
container. It rendered one fixed-size canvas without a text/annotation layer.
The AI rail had a 560px minimum height but no viewport maximum, so long results
could grow the workspace instead of scrolling independently.

The revised route owns one `100dvh` flex workspace, retaining the existing
navbar and ProtectedGate while removing its catalog hero/footer. The PDF and
rails have explicit minimum-size/overflow constraints; a bottom composer stays
outside the AI result scroller. Desktop rails take no column space when hidden.
Tablet/mobile use one modal drawer at a time, above the navbar, with focus
containment, Escape dismissal, a visible close button and focus restoration.

`PdfReadingSurface` reuses PDF.js `PDFViewer`, `PDFLinkService` and
`PDFFindController`, not a new engine. It supplies text and annotation layers,
page-aware scrolling, native lazy rendering/render queue, continuous and
single-page modes, fit-width/fit-page/manual zoom and local PDF text search.
ResizeObserver recalculates automatic fits when a rail or viewport changes.
PDF scripting/annotation editing is not enabled. Rendering limits are 16 MP
and 8192px per canvas dimension; no claim of a large-document stress test is made.

Contents resolve actual PDF bookmark destinations and keep their hierarchy.
Missing/malformed destinations do not become invented page-1 links. PDFs with
no outline show a page navigator; very large fallback lists are capped at 500
rows with direct page entry still available. Outline traversal is bounded.

The existing Ask/search payloads, score settings, session renewal/recovery and
citation validation remain unchanged. The companion offers Ask, Notes and
Search; Search distinguishes local PDF text (no AI call) from the existing
semantic passage search. Earlier responses remain available even when a later
request fails. User questions/history are not persisted or put into URLs.

## Implemented and checked

- [x] Dark PDF wrapper removed; original pages use most available width.
- [x] Both desktop rails collapse independently, retaining the current page.
- [x] At 1440px, PDF viewport widened approximately 753 → 1026 → 1386px as
  the contents and then assistant closed; focus mode caps reading width at 1120px.
- [x] Text selection/search layers exist; only four canvases were rendered for
  the 22-page fixture near page 3, rather than rasterizing all pages at once.
- [x] Local phrase search highlighted “Read Committed” and reported 16 matches.
- [x] Table of contents filtering and real page navigation worked.
- [x] Continuous PageDown scrolling updated current page 3 → 4; single-page
  mode displayed only the selected page; fit-page preserved Table 13.1's grid.
- [x] Citation button navigated to PDF page 5 and the corresponding source text.
- [x] A 25-paragraph simulated answer scrolled inside its rail; document height
  remained 1000px and the composer remained visible.
- [x] Simulated abstention and service failure are distinct; the PDF remains
  usable and earlier responses are retained after an error.
- [x] Notes saved with their page link and remained after closing/reopening a
  drawer. Their tab-memory scope is visibly stated.
- [x] Focus mode hides navbar/rails and keeps navigation; exiting restores layout.
- [x] 375×812, 768×1024, 1024×900 and 1440×1000 responsive checks: no outer
  horizontal overflow at default fit width. On the 1024px check, the PDF viewport
  and its scroll width both measured 978px.
- [x] Mobile drawer header/close remains above the navbar. Shift+Tab wraps
  within the tablet drawer; Escape returns focus to its opener.
- [x] Browser console check returned no warnings/errors at the final screenshot.

## Validation boundary

UI testing used a **loopback-only mock API on 127.0.0.1:3101** and the actual
licensed 22-page PostgreSQL PDF (151,620 bytes, SHA-256
`73eb52598379f4c6799e85a73e02eb2cc18535fa29f534fe484ac12cbe91bd26`).
The Next.js preview is at `http://127.0.0.1:3100/books/3343/read`, with its API
override restricted to that dev-server process. No `.env`, production
credentials, browser tokens or server data were used/changed. AI responses,
abstention and errors in this preview are simulated layout fixtures, not Gemini
evaluation or production authorization evidence.

Screenshots are local under `output/ui-qa/premium-reader/`, including
`desktop-1440.png`, `mobile-375.png`, `tablet-768.png`, `laptop-1024.png`,
`tablet-drawer.png`, `table-fit-page.png` and `ai-error-preserves-reader.png`.

Automated checks: `npm run test:reader` — **16 passed** (10 unchanged private-PDF
transport cases, six new navigation/outline cases). Lint — zero errors, one
pre-existing `EbookBorrowButton.tsx` navigation warning. Final `npm run build`
completed compile, TypeScript, 37 static pages and optimization successfully.
One earlier final-build attempt failed after prerender on a Windows `UNKNOWN`
read of `.next/server/pages-manifest.json`; the unchanged retry succeeded.
The file was readable as `{}` afterward. No source/type-check bypass, custom
build-engine switch or destructive directory cleanup was used to obtain PASS.

## Deliberate limits and follow-up

- Notes, bookmarks and up to eight prior answers are memory-only for this open
  reader. Reloading/leaving clears them; no account sync or durable note API is claimed.
- Reflow is not implemented. PDF fonts/content, including SQL/tables/images,
  stay original; zoom is not a font-size rewrite.
- Scanned/image-only PDFs need a text layer for local search; no OCR was added.
- Unit tests cover absent/broken/nested outlines. A separate image-heavy or
  hundreds-of-pages browser stress test has not been run.
- Local checks are not evidence of CI or production deployment. Confirm the
  pull request checks and Vercel production deployment for the released commit.
  A post-deploy MEMBER smoke with the real API/LLM remains a separate release gate.
- Existing production RAG quota/provider failures are not fixed or hidden by
  this UI work, and these fixture results must not be added to RAG CV metrics.

## Follow-up: make hidden panels easy to reopen

The owner found the icon-only toolbar toggles hard to discover after closing
both sidebars. They now have a dedicated, always-visible row above the PDF:
`Show contents` / `Open AI assistant`, or `Mở mục lục` / `Mở trợ lý AI` in
Vietnamese. Labels change to the hide action while open; `aria-expanded` and
`aria-controls` remain intact. Buttons stay text-labeled and at least 44px high
on mobile, and remain available in focus mode. Opening from focus mode now uses
the visible state, so the requested panel really opens even if its saved
desktop state was already open.

Browser checks on the loopback fixture confirmed closing both sidebars with
their close buttons, reopening both from the new row, reopening the AI rail
from focus, English/Vietnamese labels, and opening/closing each mobile drawer.
At 375/768/1024/1440px, document scroll width equaled viewport width and document
height stayed within the viewport. On 375px both toggle targets measured 44px
high. A mobile viewport screenshot is `output/ui-qa/premium-reader/panels-mobile.jpg`.
These checks do not call Gemini or verify production authorization.
Lint was rerun with zero errors (the same existing navigation warning), all
16 reader tests passed, and the production build completed successfully.
