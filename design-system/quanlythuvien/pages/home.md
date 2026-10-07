# Home page refinement

## Scope and continuity

- Refine the existing homepage; retain the brand, architectural hero image, search, six library services, new-books carousel, borrowing guidance, notices, and footer in their current order.
- Interpret the reference mix as approximately 50% Bauman Rare Books (literary typography and restrained materials), 30% AbeBooks (clear book discovery), and 20% NYPL/Open Library (direct access to library tasks).
- Preserve the existing catalogue request, role-based search destinations, book detail routes, and English/Vietnamese support. Do not add marketplace fields or workflows.

## Layout and hierarchy

- Align all sections to the existing 1280px content width. Use 16px mobile and 24–32px desktop gutters.
- Keep the photographic hero, with a warm dark overlay and prominent search. Aim for roughly 500–560px desktop height rather than a full viewport.
- Present services 01–06 as a compact library directory: small folio numbers, Lucide line icons, serif titles, concise descriptions, and links to existing routes. Use three desktop columns, two tablet columns, and one mobile column.
- Preserve the interactive cover carousel and library photograph. Reduce its oversized spacing; place a readable ivory information panel alongside the books on desktop, below on mobile. Keep controls accessible and prevent cover overflow.
- Treat the borrowing guidance as one quiet three-part band, and notices as a divided reading list rather than another repeated card grid.
- Finish with a charcoal, warm-ivory footer aligned to the page. Provide existing catalogue, account, and information destinations; omit placeholder social links and nonfunctional subscription controls.

## Visual treatment

- Inherit the master ivory, burgundy, charcoal, and restrained gold palette. Preserve the existing sans-serif UI font; use Source Serif 4 for homepage editorial headings and the footer.
- Keep serif typography scoped to these components, avoiding global font changes.
- Use fine rules, subtle paper surfaces, and modest 10–12px corner radii. Remove bright red/cyan gradients, floating-card hover movement, and large number badges.
- Keep images and book covers as the main visual accents; no additional stock imagery or generated assets are needed.

## States and verification

- Distinguish new-book loading, empty, and failed-request states. Offer retry using the same catalogue request.
- Preserve cover proportions, handle missing/broken covers, and only display returned metadata.
- All links and controls need visible focus and at least 44px touch targets. Respect reduced motion, with no automatic carousel rotation.
- Verify English and Vietnamese layouts, 375/768/1024/1440px widths, search submission, carousel navigation, and actual footer destinations. Run lint and build.
