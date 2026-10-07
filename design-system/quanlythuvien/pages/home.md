# Home page refinement

## Scope and continuity

- Refine the existing homepage; retain the brand, architectural hero image, search, six library services, new-books carousel, borrowing guidance, notices, and footer in their current order.
- Interpret the reference mix as approximately 50% Bauman Rare Books (literary typography and restrained materials), 30% AbeBooks (clear book discovery), and 20% NYPL/Open Library (direct access to library tasks).
- Preserve the existing catalogue request, role-based search destinations, book detail routes, and English/Vietnamese support. Do not add marketplace fields or workflows.

## Layout and hierarchy

- Every homepage section is a full-width horizontal band with no floating outer card or exposed sliver from an adjacent section. Give each band a minimum height equal to the visible viewport below the sticky navigation and use vertical scroll snapping on desktop. Keep each band visually self-contained; constrain only its inner content to 1280px. Use 16px mobile and 24–32px desktop gutters.
- Keep the photographic hero with a warm dark overlay and prominent search. On desktop, pair the main search composition with one compact editorial callout on the right. Keep the hero around 420–500px rather than a full viewport.
- Present services as a compact split layout: editorial introduction and action on the left, six service cards in a 3-by-2 directory on the right. Collapse to two and one columns responsively.
- Preserve an interactive new-books carousel and the library photograph, but show returned books as a compact horizontal shelf of individual cards. Keep previous/next controls, cover fallbacks, loading, empty, and retry behavior.
- Treat the borrowing guidance as one compact three-part band. Present notices as an editorial introduction beside one bordered reading list.
- Finish with a charcoal, warm-ivory footer aligned to the page. Provide existing catalogue, account, and information destinations; omit placeholder social links and nonfunctional subscription controls.

## Visual treatment

- Inherit the master ivory, burgundy, charcoal, and restrained gold palette. Preserve the existing sans-serif UI font; use Source Serif 4 for homepage editorial headings and the footer.
- Keep serif typography scoped to these components, avoiding global font changes.
- Use fine rules, subtle paper surfaces, and modest 10–12px corner radii. Remove bright red/cyan gradients, floating-card hover movement, and large number badges.
- Keep images and book covers as the main visual accents; no additional stock imagery or generated assets are needed.
- Use burgundy icon discs and circular arrow affordances to echo the supplied reference without copying decorative artwork literally.
- Use the supplied classical line-art paper background for the Services band and the supplied botanical/book paper background for the Notices band. Keep both images decorative and preserve readable ivory surfaces behind actionable content.
- Because each desktop band fills the visible viewport, scale typography, controls, cards, and internal spacing to use that canvas confidently. Avoid leaving compact dashboard-sized content floating in the middle of a large section.

## States and verification

- Distinguish new-book loading, empty, and failed-request states. Offer retry using the same catalogue request.
- Preserve cover proportions, handle missing/broken covers, and only display returned metadata.
- All links and controls need visible focus and at least 44px touch targets. Respect reduced motion, with no automatic carousel rotation.
- Verify English and Vietnamese layouts, 375/768/1024/1440px widths, search submission, carousel navigation, and actual footer destinations. Run lint and build.
