# Admin Navigation Override

Applies to the shared navbar when the authenticated user has ADMIN access.

## Hierarchy

- Keep four frequent destinations visible: Overview, Books, Circulation, and Borrowers.
- Group secondary tools (statistics, payments, categories, authors, and CSV imports) under a single Management disclosure.
- Do not mix public informational pages into the admin's primary navigation. Their routes stay available through the public site and notification menu.
- Keep language, notifications, and the existing account menu separate from operational navigation.

## Responsive Layout

- Use one compact horizontal row on wide desktop screens, with no horizontal scrolling container or carousel.
- On narrower screens, replace the navigation row with a 44px menu button and a right-aligned vertical disclosure.
- Opening a disclosure must not cause horizontal page overflow. Bound its height on small screens and allow vertical scrolling only when needed.
- Preserve existing brand styling, library neutrals, and burgundy emphasis for the active admin destination.

## Interaction

- Use real links with `aria-current` for the current destination; do not change routes or access checks.
- Disclosures open by click or keyboard, announce their expanded state, and close on Escape or outside pointer interaction.
- Close navigation after choosing a destination. Keep focus visible and return focus to the trigger when dismissed with Escape.
- Keep account actions and notification behavior unchanged.
- Keep the language toggle in the mobile navigation panel, freeing space for the brand, notifications, and account controls in the header.

## Verification

- Check English and Vietnamese labels, desktop and mobile disclosure behavior, and layouts at 375, 768, 1024, and 1440px.
- Check that public and librarian navigation are not changed by the admin-only redesign.
