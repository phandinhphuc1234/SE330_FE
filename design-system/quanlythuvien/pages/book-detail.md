# Book Detail Page Override

> Page-specific UI/UX rules for `/books/{id}`.
>
> This file overrides `design-system/quanlythuvien/MASTER.md` only for the public book detail page. It must guide future UI edits without changing routes, API calls, state behavior, business logic, or backend contracts.

---

## 1. Page Purpose

The `/books/{id}` page helps a public reader inspect one library record, understand physical copy availability, place a hold when all physical copies are checked out, and access or pay for an ebook copy when ebook data exists.

This page is a book-focused product detail page, not an admin detail page and not a dashboard.

---

## 2. Visual Goal

Create a modern editorial library product page that feels premium, academic, readable, and trustworthy.

- Lead with the cover, title, author, category, and availability.
- Make physical availability and ebook access easy to compare without turning them into dashboard widgets.
- Add visual richness through warm off-white backgrounds, ivory/parchment panels, soft borders, subtle shadows, and serif title typography.
- Keep the page more eye-catching than a plain white layout while preserving calm academic restraint.

---

## 3. Existing Sections Found in Code

Inspected files:

- `src/app/books/[bookId]/page.tsx`
- `src/features/catalog/components/BookDetailPage.tsx`
- `src/features/catalog/services/catalogService.ts`
- `src/features/catalog/types/catalog.type.ts`
- `src/features/catalog/components/catalogHelpers.ts`
- `src/features/circulation/services/circulationService.ts`
- `src/features/circulation/types/circulation.type.ts`
- `src/features/ebook/services/ebookService.ts`
- `src/features/ebook/types/ebook.type.ts`
- `src/features/payments/services/paymentService.ts`
- `src/features/payments/types/payment.type.ts`

Actual route structure:

- `/books/{id}` is implemented by `src/app/books/[bookId]/page.tsx`.
- The route renders `BookDetailPage` from `src/features/catalog/components/BookDetailPage.tsx`.

Actual UI sections:

- `CatalogShell` wrapper with eyebrow, title, description, and "Back to books" action.
- Top-level error notice when book details fail to load.
- Loading skeleton state.
- Main book detail panel.
- Large book cover area with image or fallback cover.
- Category badge and "original" badge.
- Main title and author/published-date line.
- Secondary detail actions: wishlist, share, report issue.
- Metadata pill grid for ISBN, available copies, total copies, and edition.
- Physical availability panel with hold behavior when no copies are available.
- Ebook access panel with availability, license limit, loan duration, access type, file details, and ebook action.
- Ebook access policy notice.
- Tabbed book information area: book summary and about author.
- Related books section when related books exist.

---

## 4. Existing Data, API Calls, State, and Logic

Available `Book` fields from `catalog.type.ts`:

- `bookId`, `id`
- `title`
- `isbn`
- `imageUrl`
- `coverImage`
- `ebook`, `bookEbook`
- `authors`
- `category`, `categoryId`
- `publishedDate`
- `language`
- `edition`
- `totalCopies`
- `availableCopies`
- `ebookUrl`

Available `BookCoverImage` fields:

- `originalUrl`, `thumbnailUrl`, `detailUrl`, `altText`, `isPrimary`, `status`, plus provider/public id metadata.

Available `Author` fields:

- `authorId`, `id`, `name`, `bio`, `createdAt`, `updatedAt`.

Available `Category` fields:

- `categoryId`, `id`, `name`, `description`.

Available `BookEbookInfo` fields:

- `bookEbookId`, `bookId`
- `available`
- `status`
- `format`
- `sizeBytes`
- `maxConcurrentLoans`
- `loanDurationDays`
- `accessType`
- `requiresPayment`
- `accessFee`
- `currency`
- `accessDurationDays`
- `updatedAt`

Available hold fields:

- `holdId`, `id`, `bookId`, `bookTitle`, `title`, `status`, `queuePosition`, `assignedBarcode`, `barcode`, `placedAt`, `createdAt`, `expiresAt`, `pickupExpiresAt`.

Available ebook loan fields used by this page:

- `status`, especially `ACTIVE`
- `bookId`, `bookEbookId`, `paymentId`, `borrowedAt`, `expiredAt`, `expiresAt`, `ebookReadUrl`.

Existing API calls and behavior:

- `getBook(params.bookId)` loads the book.
- `getBookEbookInfo(params.bookId)` loads ebook access info; a 404 is treated as "no ebook info" without visible error.
- `getBooks({ categoryId, size: "8", page: "0", sort: "title,asc" })` loads related books and excludes the current book.
- `getMyHolds(accessToken, refreshAccessToken)` loads current member holds when authenticated and filters by current numeric book id.
- `createHold(String(numericBookId), accessToken, refreshAccessToken)` places a hold when physical copies are out of stock.
- `borrowEbook(numericBookId, accessToken, refreshAccessToken)` borrows a free ebook.
- `createPayment(...)` creates a VNPAY ebook payment for paid ebook access.
- `window.location.assign(payment.paymentUrl)` redirects to payment provider when returned.
- `sessionStorage["athenaeum.pendingEbookPayment"]` stores pending ebook payment metadata as a convenience.

Existing state and conditions:

- `isLoading`, `error`, `book`, `relatedBooks`, `ebookInfo`, `ebookInfoError`.
- `activeTab` toggles between `summary` and `author`.
- `ebookLoan`, `isBorrowingEbook`, `ebookBorrowError`.
- `isCreatingPayment`, `paymentError`.
- `userHolds`, `isPlacingHold`, `holdError`, `holdSuccess`.
- Physical availability is currently determined by `(book.availableCopies ?? 0) === 0`.
- Ebook availability is determined by `ebookInfo?.available` and `ebookInfo?.status?.toUpperCase() === "ACTIVE"`.
- Paid ebook access is determined by `ebookInfo.requiresPayment` or `ebookInfo.accessType?.toUpperCase() === "PAID"`.

Do not invent additional fields such as rating, reviews, shelf location, publisher, page count, description, discount, payment provider logo, download permission, or DRM details unless they are added to the actual types/API first.

---

## 5. Layout Structure

The page should use a warm editorial composition:

1. Shell heading and back action.
2. Primary detail surface with cover and information.
3. Metadata and access panels grouped near the title.
4. Summary/author tab area.
5. Related books grid.

Page background should be warm off-white or soft stone. The main detail surface may be ivory or white, but never appear as a plain white island on a plain white page.

Preferred structure inside the main panel:

- Left: cover presentation.
- Right: title, author, metadata, physical availability, ebook access, and ebook policy.
- Below full width: tabs and related books.

---

## 6. Desktop Layout Rules

At `1024px` and above:

- Use a max content width consistent with MASTER: target `1180px` for detail content.
- Use a two-column hero/detail grid.
- Cover column: `320-400px`, sticky only if it does not interfere with the header or mobile flow.
- Content column: flexible with a comfortable max line length.
- Keep metadata pills in a 2-4 column grid depending on available width.
- Physical availability and ebook access panels may stack vertically in the content column.
- Related books should use a compact horizontal grid, preserving `2:3` cover ratio.
- Avoid large top padding above the cover; the cover should align visually with the title region.

At `1440px`:

- Do not stretch text to the viewport edge.
- Related books may show up to 6 items if each card remains readable.
- The cover, title block, and access panels should feel like one composed product detail area.

---

## 7. Tablet Layout Rules

At `768px`:

- Use a two-column layout when there is enough width: cover plus title/access content.
- Keep the cover width around `260-320px`.
- Metadata pills should use 2 columns.
- Physical availability and ebook access panels should be full width inside the content column or stacked below the title block.
- Detail action buttons may wrap, but should remain visually secondary.
- Tabs should remain horizontal if labels fit; otherwise allow wrapping without overflow.

---

## 8. Mobile Layout Rules

At `375px`:

- Stack sections in this order:
  1. Back action and shell heading.
  2. Cover.
  3. Category/original badges.
  4. Title.
  5. Author and published date.
  6. Primary availability and ebook actions.
  7. Metadata pills.
  8. Ebook policy notice.
  9. Summary/author tabs.
  10. Related books.
- Use `16px` page padding.
- The cover should be centered and no wider than the viewport can comfortably support.
- Primary action buttons should become full width.
- Avoid horizontal scrolling in metadata grids, tab labels, and ebook info rows.
- Long titles must wrap cleanly and not force viewport overflow.

---

## 9. Typography Hierarchy

- Page/title book heading: serif, large, calm, and readable.
- Book title should be the visual H1-level moment inside the detail panel, even if implemented as `h2`.
- Category, original badge, metadata labels, action buttons, and ebook rows use sans-serif.
- Author and published date line should be sans-serif, muted, and close to the title.
- Section headings such as ebook access, physical availability, related books, and about author may use serif for editorial emphasis.
- Body copy in summary/author panels uses sans-serif with generous line height.
- Do not use monospace as a primary style.

---

## 10. Book Cover Presentation Rules

- Preserve a `2:3` cover ratio.
- Use the existing `bookCoverUrl(book, "detail")` and `bookCoverAlt(book)` logic.
- Real covers should be large enough to inspect on desktop, ideally `320-380px` wide.
- Place the cover on a warm parchment or ivory presentation area, not a cold gray box.
- Use a subtle premium shadow: stronger than card shadows but not heavy.
- Keep cover radius around `8px`.
- Missing-cover fallback must use only existing fields: category label and title are available.
- Missing-cover fallback should feel like a designed library placeholder, not a black dashboard gradient.
- Do not crop covers unpredictably. If object-cover is used, keep the image container stable.

---

## 11. Main Book Information Rules

Show only fields that exist in the current code/types.

Primary information:

- `title`
- authors from `authors` using `authorLabel`
- `publishedDate` when present
- category from `category` using `categoryLabel`
- `isbn`
- `availableCopies`
- `totalCopies`
- `edition`

Rules:

- Keep title and authors above metadata.
- Category badge should be quiet but visible; use burgundy, navy, or charcoal sparingly.
- The "original" badge should be secondary, not styled like a primary status.
- Published date should not dominate title or author.
- If optional values are missing, use the existing code behavior or omit during future refactor; do not add fake fallback data beyond existing text constants.

---

## 12. Metadata/Card Rules

Current metadata pills:

- ISBN
- Available copies
- Total copies
- Edition

Design rules:

- Cards should use ivory/white surfaces with soft neutral borders.
- Use compact Lucide icons matching the existing `Icon` abstraction.
- Labels should be small, uppercase or semibold sans-serif.
- Values should be clear and readable, with truncation only when needed.
- Do not turn metadata into KPI cards. Avoid dashboard language, charts, or large numeric emphasis.
- If adding existing fields later, only use real fields from `Book`: `publishedDate`, `language`, `category`, `edition`, `totalCopies`, `availableCopies`, `isbn`.

---

## 13. Action Button Rules

Existing actions:

- Back to books link.
- Add to wishlist button.
- Share this book button.
- Report an issue button.
- Place Hold button when all copies are checked out and no hold exists.
- My Holds link when a hold exists.
- Ebook buttons/links: Read ebook, Ebook not available, Pay with VNPAY, Sign in to pay, Borrow Ebook, Sign in to borrow.

Rules:

- The strongest visual action should be the current actionable access button: place hold, borrow ebook, pay, or read ebook.
- Secondary actions such as wishlist/share/report should be quieter and must not compete with access actions.
- Disabled actions need clear disabled styling and text.
- Use full-width buttons inside access panels on mobile.
- Use Lucide icons only; no emojis.
- Avoid hover transforms that move layout. Border, color, and shadow changes are preferred.
- Keep all current handlers and routing unchanged.

---

## 14. Availability/Status Rules

Physical availability:

- Available when `(book.availableCopies ?? 0) > 0`.
- Out of stock when `(book.availableCopies ?? 0) === 0`.
- Available state should use forest green accents and clear text.
- Out-of-stock/hold state should use warm gold or amber for waiting, with burgundy reserved for the hold action.
- Success after hold placement should use forest green and include the existing success text.
- Error after hold attempt should use danger styling and preserve the returned message.

Ebook availability:

- Available when `ebookInfo?.available` is true and `status` resolves to `ACTIVE`.
- Unavailable when ebook info is missing, inactive, or `available` is false.
- Paid access should be visually clear but not sales-like.
- Free access should emphasize online reader access, not download.

All status states must include readable text. Do not communicate state by color or icon alone.

---

## 15. Ebook/Payment/Access Section Rules

This section exists in the code and must be included in future redesigns.

Current ebook rows:

- Availability
- License limit
- Loan duration
- Access
- File

Current ebook actions:

- Active loan: link to `/books/${bookId}/read`.
- Unavailable: disabled "Ebook not available" button.
- Paid and authenticated: create VNPAY payment.
- Paid and signed out: link to `/login`.
- Free and authenticated: borrow ebook.
- Free and signed out: link to `/login`.

Design rules:

- Treat this as a secure access panel, not a checkout advertisement.
- Use ivory or parchment-like surface with a subtle warm gold or burgundy accent.
- Keep payment language factual: "Pay with VNPAY", "Complete payment to unlock this ebook".
- Show access fee only through existing `accessFee` and `currency` formatting.
- Do not invent discounts, subscription language, file download, printing, provider branding, or extra payment steps.
- Preserve the online-reader-only policy notice because the code includes it.
- Payment and borrowing errors should appear inside the panel near the relevant action.
- If `ebookInfoError` exists, show it as a local panel error, not as a page-fatal error.

---

## 16. Loading State Rules

Current loading state uses `BookDetailSkeleton`.

Rules:

- Skeleton should match the final layout: cover block, title lines, metadata pills, access panels, and lower content block.
- Use warm neutral skeleton colors from MASTER: parchment base and off-white highlight.
- Preserve stable dimensions so the page does not jump when data loads.
- Do not show a tiny spinner for this page unless it is inside an already stable action button.

---

## 17. Empty/Not-Found State Rules

Current behavior:

- If loading finishes and `book` is null, the component renders no detail content.
- If `getBook` throws, the page shows a `Notice` error.

Future UI rule:

- If implementing a not-found state, keep API logic unchanged.
- Use a calm editorial empty panel with title, short explanation, and a back-to-books action.
- Do not invent a fake book record.
- Do not redirect automatically unless the route behavior is explicitly changed by the user.

---

## 18. Error State Rules

Current error sources:

- Book load error via `getBook`.
- Ebook info load error via `getBookEbookInfo`, except 404 is hidden.
- Hold placement error via `createHold`.
- Ebook borrow error via `borrowEbook`.
- Payment creation, missing target, and payment redirect errors via `createPayment`.

Rules:

- Page-level book load errors should appear above the main content area using the existing `Notice` pattern or equivalent.
- Ebook info errors should stay inside the ebook access panel.
- Hold errors should stay inside the physical availability panel.
- Payment/borrow errors should stay near the ebook action button.
- Error styling should use danger soft surfaces, not loud red full-width banners unless page-fatal.
- Preserve backend error messages when the current code already surfaces them.

---

## 19. Accessibility Requirements

- The book cover image must keep meaningful alt text from `bookCoverAlt(book)`.
- Fallback cover text must remain readable at all breakpoints.
- Tab buttons must retain `role="tab"`, `aria-selected`, and associated readable labels.
- Add `role="tabpanel"` or equivalent semantics when editing tab content.
- All buttons and links must be keyboard reachable.
- Focus states must be visible on back link, action buttons, hold button, ebook buttons, tabs, and related book links.
- Disabled buttons must use actual `disabled` where applicable.
- Icon-only or icon-leading controls must retain text labels or accessible names.
- Status panels must include text in addition to icon/color.
- Touch targets must be at least `44px` on mobile.
- Respect `prefers-reduced-motion`; avoid motion-heavy hover effects.

---

## 20. Anti-Patterns to Avoid

- Editing React/Next.js code before reading this override and MASTER.
- Changing `/books/{id}` route structure or API contracts.
- Inventing fields such as ratings, reviews, publisher, page count, shelf location, description, or download URL.
- Removing physical hold logic or ebook payment logic.
- Making ebook payment look like a marketing pricing card.
- Purple/orange analytics dashboard styling.
- Generic shadcn dashboard cards on a plain white background.
- Bland white-only surfaces with no editorial depth.
- Heavy shadows, neon colors, bright gradients, or glassmorphism.
- Emojis as icons.
- Oversized empty hero space that pushes availability and ebook access too far down.
- Treating `availableCopies` and `totalCopies` like dashboard KPIs.
- Color-only availability or payment states.
- Layout-shifting hover scale effects.
- Hiding primary actions below long metadata on mobile.

---

## 21. Checklist Before Codex Edits This Page

- [ ] Read `AGENTS.md`.
- [ ] Read `design-system/quanlythuvien/MASTER.md`.
- [ ] Read this page override.
- [ ] Inspect `src/app/books/[bookId]/page.tsx`.
- [ ] Inspect `src/features/catalog/components/BookDetailPage.tsx`.
- [ ] Confirm current fields from `catalog.type.ts`, `ebook.type.ts`, `payment.type.ts`, and `circulation.type.ts`.
- [ ] Preserve `getBook`, `getBookEbookInfo`, `getBooks`, `getMyHolds`, `createHold`, `borrowEbook`, and `createPayment` behavior.
- [ ] Preserve authentication checks and refresh-token behavior.
- [ ] Preserve payment idempotency key and pending payment session storage behavior.
- [ ] Preserve conditional rendering for physical availability, holds, ebook availability, paid access, active loan, and signed-out states.
- [ ] Use only existing book, ebook, hold, loan, and payment fields.
- [ ] Keep Lucide/Icon usage; no emojis.
- [ ] Keep responsive behavior for `375px`, `768px`, `1024px`, and `1440px`.
- [ ] Ensure loading, error, and not-found/empty states are visually handled.
- [ ] Verify no horizontal overflow, text clipping, or inaccessible focus states.
