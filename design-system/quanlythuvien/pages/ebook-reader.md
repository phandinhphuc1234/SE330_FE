# Ebook reader page override

This file extends `../MASTER.md` for the protected PDF reader and its AI-assisted retrieval surface.

## Product intent

- Keep the PDF as the primary reading surface.
- Present AI as a focused reading assistant with two explicit modes: grounded
  `Ask this book` and raw `Find passages` evidence search.
- Every generated answer must be grounded or visibly abstain. Grounded answers
  show their source context and provide a page jump.

## Layout

- Desktop: use a collapsible `360-400px` evidence rail to the right of the PDF.
- Mobile and tablet: place the evidence panel before the PDF when opened so it is immediately visible without covering the document.
- Closing the panel must restore the full reader width without losing the current PDF page or query results.
- Fullscreen mode remains dedicated to the PDF canvas.

## AI reading panel

- Label the feature `AI reading assistant` and explain that it is restricted to
  the current ebook.
- Default to `Ask this book`; keep `Find passages` as a secondary tab.
- Offer mode-specific suggestions, a visible textarea label, a character
  counter, and one primary submit action.
- Generated answers use an editorial answer block, never chat bubbles. Display
  grounded/abstained status in text, not color alone.
- Sources use numbered cards with excerpt text, relevance, chapter/page metadata,
  and a `Go to page` action.
- State clearly that answers should be checked against the cited page.

## States

- Loading: preserve panel height with warm-neutral skeleton blocks and distinguish
  answer generation from passage search.
- Empty: explain that no matching passage was found and suggest a more specific query.
- Abstain: explain that the ebook did not provide enough evidence; do not render
  it as an infrastructure error.
- `EBOOK_AI_NOT_READY`: explain that the ebook is still being prepared for AI search; do not invalidate the reading session.
- Session errors: tell the user that the secure session is being renewed and require an explicit retry of the search.
- Other errors: show a calm retryable error without exposing infrastructure details.

## Interaction and accessibility

- The panel toggle uses `aria-expanded` and `aria-controls`.
- Search submission works with the button and `Ctrl/Cmd + Enter` inside the textarea.
- Result navigation changes the current PDF page only when a valid page number exists.
- Keep visible focus states, 44px touch targets, and text labels alongside icons.
- Do not log, persist, or place the user's query in the URL.
