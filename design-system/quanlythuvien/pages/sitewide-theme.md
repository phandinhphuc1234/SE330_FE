# Sitewide Athenaeum Theme

Applies to every route outside the immersive home page. Page-specific documents may refine layout, but must keep this shared visual language.

## Visual language

- Use warm ivory (`#F7F3EA`) for page backgrounds, paper white (`#FFFCF5` or white) for working surfaces, and warm beige (`#DED5C8`) for borders.
- Use burgundy (`#7A263A`) for primary actions, active navigation, links, and focused controls. Use deep burgundy (`#5A1C2B`) for hover and dark accents.
- Use charcoal (`#2B2723`) and ink (`#171412`) for primary text; muted copy uses warm brown-gray (`#6F675E` or `#776D63`).
- Use muted gold (`#B8872B` / `#E1C38B`) only for small editorial accents, not for long body text.
- Preserve semantic status colors for success, warning, destructive actions, overdue records, and validation errors.

## Typography

- Source Serif is the sitewide editorial font for page titles and section headings.
- Be Vietnam Pro remains the interface font for body copy, form controls, tables, filters, and labels.
- Headings should have a calm editorial rhythm and must wrap without clipping in both English and Vietnamese.

## Surfaces and spacing

- Pages use one clear heading region followed by content; avoid duplicate page titles and deeply nested decorative cards.
- Primary panels use 12-20px radii, thin warm borders, restrained shadows, and generous internal spacing.
- Tables use a deep burgundy header and warm paper rows. Hover states change surface color without moving the row.
- Form controls use paper backgrounds, warm borders, and a visible burgundy focus ring.
- Modals, empty states, pagination, and feedback messages inherit the same paper-and-ink treatment.

## Route families

- Public catalog and account pages use `CatalogShell` as the shared warm workspace.
- About, borrowing guide, and notices retain photographic heroes through `InstitutionalShell`, with burgundy/gold editorial accents.
- Authentication pages retain their split photographic composition while replacing cold navy chrome with warm charcoal, burgundy, ivory, and gold.
- Staff and admin pages may be denser, but use the same tokens, typography, controls, tables, and paper panels.
- The ebook reader may keep a dark reading canvas; its navigation and supporting panels must still follow the shared palette.

## Non-negotiable behavior

- Do not change routes, API calls, request/response fields, authorization checks, or business logic during theme work.
- Keep focus visibility, keyboard behavior, loading/error/empty states, and touch targets of at least 44px.
- Verify layouts at 375px, 768px, 1024px, and 1440px without horizontal page overflow.
