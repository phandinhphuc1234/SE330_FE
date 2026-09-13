# Admin And Staff Books Override

Applies to `/admin/books`, `/staff/books`, `/staff/books/import`, and import job tracking screens.

## Layout

- Staff book-management pages may be denser than public catalog pages, but should still use warm library surfaces instead of plain dashboard panels.
- Import workflows should present the sequence as file selection, processing, and review, with compact step cards that never let file names or status text overflow.
- Keep the primary upload panel and result panel aligned in a two-column desktop layout, stacking cleanly on tablet and mobile.

## Visual Emphasis

- Use red/burgundy only for primary import actions, active workflow states, unread notification emphasis, and errors.
- Success may use forest accents in small status indicators, but import completion notifications should remain readable on warm or red-tinted backgrounds.
- Long technical values such as filenames, job IDs, and `processed/total` counts must wrap or truncate inside their cards.

## Component Behavior

- File inputs need a visible selected-file state and a clear disabled state when the current role cannot import.
- Result summaries should use compact metric cards with stable dimensions and no oversized KPI typography.
- Progress and notification states must include text, not color alone.
