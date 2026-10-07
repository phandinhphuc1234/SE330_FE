# Admin Dashboard Override

This page is an operational workspace for administrators. It may use compact metrics, but every value must help staff understand or complete real library work.

## Hierarchy

- Keep the global admin navbar; do not add a sidebar.
- Use one page title and one short description. Do not repeat a second dashboard header inside the content.
- Show exactly four primary metrics: active loans/access, overdue loans/access, holds ready for pickup, and unpaid fine total.
- Put the actionable work queue before secondary reporting.
- Keep today's borrow/return activity in one compact supporting panel.
- Show a circulation trend only when a real time-series API is available. Until then, use an honest empty state.

## Data Integrity

- Never render mock chart data in the production dashboard.
- Do not combine overlapping statuses in a pie or donut chart.
- Do not label snapshot data as live or real-time.
- Loading, error, zero, and unavailable states must be visually distinct.
- Currency values must be formatted as text; never interpolate React elements into strings.

## Visual Treatment

- Use the white, black, and neutral gray tokens from `MASTER.md`.
- Cards use 12px radius, thin gray borders, restrained neutral shadows, and no hover translation.
- Use Source Serif styling for the page and section headings; use the sans-serif UI font for labels and controls.
- Black identifies primary actions; status meaning comes from icon and copy, with gray surface levels used only for hierarchy.
- Avoid colored SaaS-dashboard chrome, nested decorative cards, gradients, and animated live badges.

## Responsive Behavior

- 375px: single-column metrics and panels; controls fill or wrap without horizontal scrolling.
- 768px: two-column metrics; action queue remains above today's activity.
- 1024px and wider: four metrics in one row; work queue uses the wider column.
- Keep touch targets at least 44px and preserve visible keyboard focus.

## Localization

- Every visible dashboard label, helper, empty state, error action, date, and button must switch through `LanguageContext`.
- Vietnamese and English layouts must tolerate natural text expansion without truncation.
