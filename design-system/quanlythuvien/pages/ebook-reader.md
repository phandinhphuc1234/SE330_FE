# Ebook reader page override

This file extends `../MASTER.md` for the protected PDF reader and its AI-assisted retrieval surface.

## Product intent

- Keep the PDF as the primary reading surface.
- Present AI as a focused reading assistant with two explicit modes: grounded
  `Ask this book` and raw `Find passages` evidence search.
- Every generated answer must be grounded or visibly abstain. Grounded answers
  show their source context and provide a page jump.

## Layout (premium reader revision, 29/10/2026)

- Follow the supplied three-column reference: charcoal contents rail, large warm
  reading surface, ivory companion rail. Preserve the existing site navbar.
- The reader owns one viewport height; omit the catalog hero/footer on this route.
  Use `min-height: 0` / `min-width: 0` throughout. Each rail scrolls independently;
  answers never grow the workspace. Keep the question composer at the bottom.
- Desktop (1280px+): independently collapsible 250-280px contents and 320-360px
  companion rails. Hidden rails take zero layout space. Tablet/mobile use modal
  overlay drawers with focus restoration, Escape dismissal and a close button.
- Use PDF.js's existing viewer/render queue, text/annotation layers, real outline,
  local text search, continuous scrolling and optional single-page mode. Fit width
  is the default and recalculates on resize/panel changes; retain the current page.
- Never rebuild PDF text into a fake book page or copy reference page counts,
  chapter names or facts. No outline means an honest numbered-page navigator.
- Focus mode hides navbar/rails and minimizes toolbar without losing reading
  position, query/results or notes. Keep exit/navigation visible.
- Notes/bookmarks and question history are tab-memory only, clearly labeled;
  no new backend fields/endpoints or persistence of AI queries/tokens.
- No reflow mode in this revision: the default must preserve tables/SQL/images.

## AI reading panel

- Label the feature `AI reading assistant` and explain that it is restricted to
  the current ebook.
- Default to `Ask`; offer `Notes` and `Search`. Search distinguishes local PDF
  text search from the existing semantic `Find passages` call.
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
- Keep both panel toggles in a dedicated, always-visible row above the reading
  workspace, with action text (`Show/Hide contents`, `Open/Hide AI assistant`)
  in the selected site language. Do not reduce them to icons on mobile or in
  focus mode. Opening a panel from focus mode exits focus and opens that panel.
- Search submission works with the button and `Ctrl/Cmd + Enter` inside the textarea.
- Result navigation changes the current PDF page only when a valid page number exists.
- Keep visible focus states, 44px touch targets, and text labels alongside icons.
- Do not log, persist, or place the user's query in the URL.
