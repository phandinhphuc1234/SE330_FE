# The Athenaeum Design System

> Source of truth for future UI work in the Next.js frontend.
>
> When working on a specific page, first check `design-system/quanlythuvien/pages/[page-name].md`.
> If a page-specific file exists, its rules override this Master file. If not, follow this file.

---

## 1. Product Design Principles

The Athenaeum is a public-facing library catalog with academic credibility and modern SaaS usability. The interface must help readers discover, evaluate, and access books without feeling like an analytics dashboard.

- **Book-first:** Covers, titles, authors, availability, and access actions are the visual center. Interface chrome stays quiet.
- **Editorial, not decorative:** Use refined typography, balanced composition, and subtle material depth instead of ornamental flourishes.
- **Calm density:** Avoid large empty areas, but do not crowd metadata. Use structured groups, dividers, and compact rhythm.
- **Trust before excitement:** Colors, copy, and interaction states should feel reliable, scholarly, and polished.
- **Content hierarchy over widgets:** Prioritize reading flow, search intent, and book evaluation. Do not introduce dashboard KPIs or analytics language.
- **Modern utility:** Forms, filters, payments, and availability states should feel fast, direct, and SaaS-quality.
- **Accessible by default:** Every color, state, and layout decision must preserve legibility and keyboard usability.

---

## 2. Brand Personality

The Athenaeum should feel like a contemporary academic library: curated, thoughtful, literate, and precise.

**Attributes**

- Literary
- Academic
- Premium
- Trustworthy
- Modern
- Quietly sophisticated
- Content-led

**Tone**

- Clear and direct for actions: "Borrow", "Read ebook", "Reserve", "Sign in to continue".
- Scholarly but not archaic for editorial moments.
- Helpful in empty and error states without becoming playful.

**Visual References**

- University press catalogs
- Independent literary journals
- Museum archive interfaces
- Premium academic SaaS products
- High-quality online bookstores with restrained editorial layout

---

## 3. Color Tokens

Use warm neutrals as the base and one restrained accent at a time. Burgundy is the primary brand accent. Navy, forest, and gold are supporting accents for status, links, or small editorial details.

### Core Palette

| Token | Hex | Use |
|---|---:|---|
| `--athenaeum-bg` | `#F7F3EA` | Main app background, warm off-white |
| `--athenaeum-bg-subtle` | `#FBF8F1` | Lighter page bands, hero background |
| `--athenaeum-surface` | `#FFFFFF` | Primary cards, forms, popovers |
| `--athenaeum-surface-ivory` | `#FFFCF5` | Featured cards, book detail panels |
| `--athenaeum-surface-parchment` | `#EFE6D6` | Subtle editorial blocks, callouts |
| `--athenaeum-ink` | `#171412` | Primary text |
| `--athenaeum-charcoal` | `#2B2723` | Headings and strong labels |
| `--athenaeum-muted` | `#6F675E` | Secondary metadata |
| `--athenaeum-faint` | `#9A9187` | Tertiary text, placeholders |
| `--athenaeum-border` | `#DED5C8` | Default borders |
| `--athenaeum-border-strong` | `#CBBEAE` | Card hover borders, section dividers |

### Accent Palette

| Token | Hex | Use |
|---|---:|---|
| `--athenaeum-burgundy` | `#7A263A` | Primary actions, active filters, key emphasis |
| `--athenaeum-burgundy-dark` | `#5A1C2B` | Primary hover, pressed states |
| `--athenaeum-burgundy-soft` | `#F3E5E8` | Subtle selected backgrounds |
| `--athenaeum-navy` | `#243B53` | Links, secondary actions, academic contrast |
| `--athenaeum-navy-soft` | `#E7EEF4` | Soft link/status backgrounds |
| `--athenaeum-forest` | `#2F5D50` | Available/success states |
| `--athenaeum-forest-soft` | `#E5F0EB` | Available/success backgrounds |
| `--athenaeum-gold` | `#B8872B` | Premium highlights, ratings, small dividers |
| `--athenaeum-gold-soft` | `#F4E8CC` | Highlight backgrounds |

### Semantic Tokens

| Token | Hex | Use |
|---|---:|---|
| `--color-success` | `#2F5D50` | Available, paid, completed |
| `--color-warning` | `#B8872B` | Limited copies, pending payment |
| `--color-danger` | `#A33A3A` | Error, unavailable, destructive |
| `--color-danger-soft` | `#F6E4E1` | Error backgrounds |
| `--color-info` | `#243B53` | Informational notices |
| `--focus-ring` | `#7A263A` | Keyboard focus ring |

### Color Usage Rules

- Use warm off-white or very light stone page backgrounds, never pure white as the only page color.
- Keep primary text near-black. Body text must not be lighter than `#6F675E`.
- Use burgundy sparingly for the most important action or selected state on a screen.
- Use gold only as a small premium accent, not as large fills.
- Avoid purple/orange dashboard palettes, neon accents, saturated gradients, and monochrome beige-only screens.
- Do not rely on color alone to communicate availability, errors, or selected filters. Pair with text and Lucide icons.

---

## 4. Typography System

Use a refined serif for major editorial and book moments, paired with a highly readable sans-serif for product UI.

### Recommended Google Fonts

**Primary pairing**

- **Serif:** `Source Serif 4`
- **Sans:** `Inter`
- **Google Fonts:** `Source Serif 4` weights 400, 500, 600, 700 and `Inter` weights 400, 500, 600, 700

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:wght@400;500;600;700&display=swap');
```

**Alternative editorial pairing**

- **Serif:** `Literata`
- **Sans:** `Source Sans 3`
- Use when the UI should feel more bookish and less SaaS.

### Font Roles

| Role | Font | Use |
|---|---|---|
| Display / Hero | Source Serif 4 | Hero headlines, book titles, editorial section headings |
| Page H1 | Source Serif 4 | Book detail titles, catalog page headline |
| Section H2/H3 | Source Serif 4 or Inter | Serif for editorial sections; sans for utility panels |
| Body | Inter | Descriptions, metadata, forms, navigation |
| Metadata | Inter | Author, ISBN, category, language, publication info |
| Buttons | Inter | All buttons and controls |
| Monospace | None by default | Only for technical IDs when unavoidable |

### Type Scale

| Token | Size / Line Height | Weight | Use |
|---|---|---:|---|
| `text-display` | 48px / 56px | 600 | Desktop hero only |
| `text-h1` | 40px / 48px | 600 | Book detail title, catalog H1 |
| `text-h2` | 30px / 38px | 600 | Major sections |
| `text-h3` | 24px / 32px | 600 | Card groups, detail panels |
| `text-title` | 20px / 28px | 600 | Book card title, panel title |
| `text-body` | 16px / 26px | 400 | Descriptions and primary copy |
| `text-body-sm` | 14px / 22px | 400 | Metadata, helper text |
| `text-caption` | 12px / 18px | 500 | Badges, labels, compact metadata |

### Typography Rules

- Book titles may use serif. Metadata, controls, badges, and payment details use sans-serif.
- Avoid using all caps except short labels of 1-3 words with increased letter spacing.
- Do not use negative letter spacing. Keep `letter-spacing: 0` unless using small uppercase labels.
- Hero and book title text must wrap gracefully on mobile. Never let long titles overflow cards or buttons.
- Do not use Fira Code or any monospace font as the primary visual identity.

---

## 5. Spacing and Layout Rules

The interface should feel full, intentional, and readable. Use consistent rhythm instead of oversized empty zones.

### Spacing Tokens

| Token | Value | Use |
|---|---:|---|
| `space-1` | 4px | Icon/text gaps, tight inline spacing |
| `space-2` | 8px | Small controls, badge gaps |
| `space-3` | 12px | Compact card padding, form gaps |
| `space-4` | 16px | Default component padding |
| `space-5` | 20px | Card internal spacing |
| `space-6` | 24px | Section subgroups |
| `space-8` | 32px | Major component gaps |
| `space-10` | 40px | Page section spacing |
| `space-12` | 48px | Hero/content separation |
| `space-16` | 64px | Large desktop section spacing |

### Layout Rules

- Use `24px` page padding on desktop and `16px` on mobile.
- Prefer grids and aligned columns over floating isolated cards.
- Keep vertical rhythm tighter inside utility surfaces such as filters, metadata, and payment panels.
- Use subtle dividers to create density without clutter.
- Do not place UI cards inside other decorative cards.
- Avoid hero sections that consume the whole viewport; catalog content should be partially visible below the hero on common desktop and mobile screens.

---

## 6. Container Widths

Use consistent container widths so catalog and detail pages feel related.

| Page / Region | Max Width | Notes |
|---|---:|---|
| Global header inner | 1280px | Align with primary page content |
| Catalog page | 1280px | Hero, search, filters, book grid |
| Catalog readable copy | 760px | Hero text and explanatory text |
| Catalog grid | 1280px | Book cards, responsive columns |
| Book detail page | 1180px | Cover, title, metadata, availability, ebook |
| Book detail reading column | 720px | Description and editorial copy |
| Forms / auth / payment | 560px | Focused workflows |
| Modal content | 520px | Dialogs and confirmations |

### Detail Page Column Ratios

- Desktop: cover/media column `320-380px`, content column flexible, side/action column `300-360px` if present.
- Tablet: cover and key actions may sit in a two-column grid.
- Mobile: stack cover, title, actions, metadata, then description.

---

## 7. Card Styles

Cards should feel like premium paper surfaces, not dashboard widgets.

### Default Card

- Background: `#FFFFFF` or `#FFFCF5`
- Border: `1px solid #DED5C8`
- Radius: `12px`
- Shadow: `0 8px 24px rgba(23, 20, 18, 0.06)`
- Padding: `20px` desktop, `16px` mobile
- Hover: border `#CBBEAE`, shadow `0 12px 30px rgba(23, 20, 18, 0.09)`

### Featured / Editorial Card

- Background: `#FFFCF5`
- Border: `1px solid #D8CCBC`
- Optional top rule: `2px solid #B8872B`
- Use for ebook access, curated recommendations, or prominent availability states.

### Compact Metadata Card

- Background: `rgba(255, 252, 245, 0.72)` or `#FFFFFF`
- Border: `1px solid #E5DCD0`
- Radius: `10px`
- Padding: `12-16px`
- Use small Lucide icon, label, and value.

### Card Rules

- Cards must have a clear content purpose: book, metadata group, payment/access, status, or recommendation.
- Avoid generic dashboard card titles like "Overview", "Stats", or "Metrics".
- Do not use heavy shadows, glassmorphism, neon borders, or purple/orange fills.
- Hover effects may lift visually via shadow or border only; avoid scale transforms that shift layout.

---

## 8. Button Styles

Buttons should be clear, restrained, and consistent with shadcn/ui patterns.

### Primary Button

- Use for the main action on a screen: borrow, reserve, read ebook, pay.
- Background: `#7A263A`
- Text: `#FFFFFF`
- Hover: `#5A1C2B`
- Radius: `10px`
- Height: `44px` default, `48px` for primary checkout/access actions
- Font: Inter, 14-15px, weight 600
- Shadow: `0 6px 16px rgba(122, 38, 58, 0.18)` only for high-emphasis actions

### Secondary Button

- Background: `#FFFFFF` or transparent
- Text: `#243B53` or `#7A263A`
- Border: `1px solid #CBBEAE`
- Hover: `#FBF8F1`

### Ghost Button

- Use for navigation, subtle actions, and filter clearing.
- Text: `#2B2723`
- Hover background: `#EFE6D6`
- Must still show visible focus state.

### Destructive Button

- Background: `#A33A3A`
- Text: `#FFFFFF`
- Hover: `#7F2D2D`

### Button Rules

- Use Lucide icons only when they clarify action: `Search`, `BookOpen`, `CreditCard`, `Download`, `Heart`, `Bookmark`, `Filter`, `ChevronDown`.
- Icon size: `16px` inside normal buttons, `18px` in larger primary actions.
- Keep button labels short. No label should wrap inside a standard button.
- All clickable elements must use `cursor-pointer`, visible hover, and visible keyboard focus.

---

## 9. Form, Search, and Filter Styles

Search is a primary catalog workflow. It should feel capable and polished without becoming visually heavy.

### Search Bar

- Background: `#FFFFFF`
- Border: `1px solid #DED5C8`
- Radius: `14px`
- Height: `52-56px`
- Shadow: `0 10px 30px rgba(23, 20, 18, 0.07)`
- Include Lucide `Search` icon at the start.
- Placeholder text: `#9A9187`
- Focus ring: `0 0 0 3px rgba(122, 38, 58, 0.16)`

### Filters

- Use segmented controls, select menus, checkboxes, and chips depending on complexity.
- Active filter chip:
  - Background: `#F3E5E8`
  - Border: `#CFA9B3`
  - Text: `#5A1C2B`
- Inactive filter chip:
  - Background: `#FFFFFF`
  - Border: `#DED5C8`
  - Text: `#2B2723`
- Filter panels should be compact, aligned, and easy to scan.

### Inputs and Selects

- Height: `40-44px`
- Radius: `10px`
- Border: `#DED5C8`
- Background: `#FFFFFF`
- Text: `#171412`
- Focus: burgundy ring and border.
- Error: red border plus helper text, never color alone.

### Form Rules

- Every input requires a visible label or accessible label.
- Helper text should be concise and muted.
- Loading filters should preserve layout height to prevent jumps.
- Do not use placeholder text as the only label.

---

## 10. Book Card Design Rules

Book cards are the core catalog component. They must communicate the book before the interface.

### Required Content Priority

1. Book cover
2. Title
3. Author
4. Availability/access status
5. Category or publication metadata
6. Primary action or detail link

### Visual Structure

- Cover ratio: `2:3`.
- Cover width should remain stable per breakpoint.
- Card background: `#FFFFFF` or `#FFFCF5`.
- Card radius: `12px`.
- Cover radius: `8px`.
- Cover shadow: `0 10px 22px rgba(23, 20, 18, 0.16)`.
- Title: serif or strong sans, 16-18px, 2-line clamp.
- Author and metadata: sans, 13-14px, muted.
- Use subtle top/bottom dividers only when metadata is dense.

### Catalog Grid

- 375px: 1 column or compact 2-column only if covers remain legible.
- 768px: 2-3 columns.
- 1024px: 3-4 columns.
- 1440px: 4-5 columns depending on card width.
- Minimum card width: `180px`.
- Preferred card width: `220-260px`.

### Interaction

- Hover: slightly stronger cover shadow, card border darkens, title color may shift to burgundy.
- Do not enlarge the entire card with transform scale.
- The whole card may link to detail, but explicit actions must remain keyboard accessible.
- Favorite/bookmark actions should use Lucide icons and clear accessible labels.

### Missing Cover

- Use a designed fallback cover, not a blank gray box.
- Fallback background: `#EFE6D6`
- Include title initials or a simple `BookOpen` icon in `#7A263A`.
- Preserve the same 2:3 cover ratio.

---

## 11. Book Detail Page Rules

The book detail page should feel like a premium editorial product page for a scholarly catalog.

### Layout Priority

1. Large cover or media region
2. Book title and author
3. Primary access actions
4. Availability status
5. Metadata cards
6. Description / abstract
7. Ebook/payment section
8. Related or recommended books

### Cover Region

- Cover should be large enough to inspect: `300-380px` wide on desktop.
- Use warm surface or parchment backdrop behind the cover.
- Apply subtle shadow and avoid dark blurred backgrounds.
- If cover is unavailable, use the designed fallback cover.

### Title Region

- Title uses serif H1.
- Author, publisher, category, and year use sans-serif metadata styling.
- Long titles should wrap naturally with max line length around `12-14` words.

### Metadata Cards

- Use compact cards for ISBN, language, publication year, category, pages, publisher, or shelf location.
- Do not invent backend fields. Render only fields that exist.
- If a value is missing, omit the card or show a carefully worded unavailable state if necessary.

### Availability Section

- Make availability visually prominent but not alarming.
- Available:
  - Accent: forest `#2F5D50`
  - Background: `#E5F0EB`
  - Icon: Lucide `CheckCircle` or `BookCheck`
- Limited:
  - Accent: gold `#B8872B`
  - Background: `#F4E8CC`
  - Icon: Lucide `Clock` or `AlertCircle`
- Unavailable:
  - Accent: red `#A33A3A`
  - Background: `#F6E4E1`
  - Icon: Lucide `XCircle`
- Always include text, not icon/color alone.

### Detail Page Rules

- Preserve existing API calls, business logic, and routes.
- Do not add fields that are not returned by the backend.
- Avoid a sparse product-page look; group content into purposeful regions.
- Keep primary actions visible near title on mobile after the cover.

---

## 12. Ebook and Payment Section Rules

Ebook access and payment should feel secure, clear, and premium.

### Section Style

- Use a featured card or panel, not a generic dashboard widget.
- Background: `#FFFCF5`
- Border: `1px solid #D8CCBC`
- Optional accent rule: `2px solid #B8872B`
- Radius: `14px`
- Padding: `20-24px`

### Content Priority

1. Access status: included, paid, pending, unavailable
2. Price or fee if provided by backend
3. Primary action: read, purchase, continue payment, download
4. Supporting constraints: format, expiration, availability, terms
5. Secondary action: view details, cancel, contact support

### Payment UX

- Use Lucide `CreditCard`, `ShieldCheck`, `LockKeyhole`, or `BookOpen` where relevant.
- Communicate security with concise text and visual hierarchy; do not overuse badges.
- Price typography should be clear and sans-serif, not oversized.
- Pending/error payment states must explain the next action.
- Do not invent pricing, formats, discounts, or provider details.

---

## 13. Navigation and Header Rules

The header should feel like a refined library product, not an admin shell.

### Header

- Background: `rgba(251, 248, 241, 0.92)` or `#FBF8F1`
- Border bottom: `1px solid #DED5C8`
- Backdrop blur may be used subtly if readability remains strong.
- Height: `64-72px` desktop, `56-64px` mobile.
- Inner max width: `1280px`.

### Brand

- Brand text: "The Athenaeum"
- Brand may use serif for the wordmark.
- Keep brand presentation restrained and legible.

### Navigation Links

- Font: Inter, 14-15px, weight 500.
- Default: `#2B2723`
- Hover/active: `#7A263A`
- Active state should include color plus underline, border, or background.

### Mobile Navigation

- Use a simple drawer or collapsible menu.
- Keep search access prominent.
- Touch targets must be at least `44px`.
- Avoid hiding primary catalog access behind multiple taps.

---

## 14. Empty, Loading, and Error States

States should be useful, visually consistent, and calm.

### Empty States

- Use Lucide icons, never emojis.
- Icon color: `#7A263A` or `#9A9187`.
- Background: `#FFFCF5`
- Border: `1px dashed #CBBEAE`
- Include:
  - Clear title
  - One helpful sentence
  - One relevant action when possible
- Example tone: "No books match these filters. Try removing a filter or searching by author."

### Loading States

- Prefer skeletons that match final layout: cover blocks, title lines, metadata lines.
- Use warm neutral skeleton colors:
  - Base: `#EFE6D6`
  - Highlight: `#FBF8F1`
- Preserve layout dimensions to avoid jumps.
- Avoid full-screen spinners except for initial route-level loading.

### Error States

- Use direct, non-blaming language.
- Include retry action when applicable.
- Error panel:
  - Background: `#F6E4E1`
  - Border: `#E2B8B2`
  - Text: `#7F2D2D`
- Do not expose raw API errors to users unless needed for support.

---

## 15. Accessibility Rules

Accessibility is part of the visual system.

- Maintain WCAG AA contrast: 4.5:1 for normal text, 3:1 for large text and icons.
- Every interactive element must have visible focus styles.
- Focus ring: `2px solid #7A263A` plus `2px` offset or equivalent shadcn ring.
- Do not remove browser focus outlines without replacing them.
- All images require useful `alt` text. Book covers should include title and author when available.
- Icon-only buttons require accessible labels.
- Forms require visible labels or programmatic labels.
- Do not use color as the only indicator for status or selection.
- Respect `prefers-reduced-motion`.
- Keep animations between `150-250ms` and use easing such as `ease-out`.
- Ensure keyboard navigation order follows the visual reading order.
- Ensure touch targets are at least `44px` on mobile.

---

## 16. Responsive Rules

Design and verify at these breakpoints: `375px`, `768px`, `1024px`, and `1440px`.

### 375px Mobile

- Page padding: `16px`.
- Header height: `56-64px`.
- Catalog hero: concise; content below hero must remain reachable without excessive scrolling.
- Search bar stacks above filters.
- Book detail stacks in this order: cover, title/author, primary action, availability, metadata, description, ebook/payment.
- Book cards: 1 column by default; 2 columns only if card content remains readable.
- Buttons may become full width for primary actions.

### 768px Tablet

- Page padding: `24px`.
- Catalog grid: 2-3 columns.
- Filters may wrap into two rows.
- Book detail can use two columns for cover and summary/actions.
- Keep payment/access panel close to primary book information.

### 1024px Laptop

- Page padding: `24-32px`.
- Catalog grid: 3-4 columns.
- Hero and search may share a composed editorial region.
- Book detail uses stable cover column plus flexible content column.
- Side panels are allowed if they do not squeeze descriptions below comfortable line length.

### 1440px Desktop

- Use max-width containers; do not let content stretch edge-to-edge.
- Catalog grid: 4-5 columns.
- Hero can be more editorial, but should not exceed the useful page rhythm.
- Book detail may use three zones: cover, main content, access/status panel.
- Preserve readable line lengths for descriptions and long metadata.

---

## 17. Anti-Patterns to Avoid

- Purple/orange analytics dashboard palette.
- Data-heavy dashboard language, KPI cards, chart widgets, or admin-shell styling.
- Fira Code or monospace as a primary identity font.
- Neon colors, saturated gradients, glow effects, or loud accent fills.
- Generic shadcn dashboard look with plain white cards on a plain white page.
- Too much empty whitespace that makes pages feel unfinished.
- Bland white-only surfaces without warm neutral layering.
- Overly playful UI, emojis, cartoon illustrations, or decorative mascots.
- Heavy glassmorphism or low-contrast translucent cards.
- Large full-viewport heroes that hide the catalog experience.
- Oversized marketing copy on functional catalog pages.
- Rounded bubbly pills everywhere; use medium radius and editorial restraint.
- Layout-shifting hover transforms.
- Invented backend fields, routes, payment details, or availability data.
- Icon-only status communication without text.
- Weak placeholder-only forms.

---

## 18. Pre-Delivery Checklist for Codex UI Work

Before finishing any UI task for The Athenaeum, verify:

- [ ] Page-specific design-system file was checked when relevant.
- [ ] Existing API calls, business logic, backend fields, and routes were preserved.
- [ ] Layout follows the editorial library catalog direction, not a dashboard direction.
- [ ] Background uses warm neutral layering, not white-only surfaces.
- [ ] Major headings/book moments use serif typography; UI controls use sans-serif.
- [ ] Colors use the approved tokens, with burgundy/gold/navy/forest used sparingly.
- [ ] Book covers use stable `2:3` ratios and designed fallbacks.
- [ ] Book cards include clear title, author, status, and action/detail affordance.
- [ ] Detail page prioritizes cover, title, access actions, availability, metadata, and description.
- [ ] Ebook/payment section is clear, secure-feeling, and does not invent payment data.
- [ ] Loading, empty, and error states are present where the user can reasonably encounter them.
- [ ] All icons are Lucide icons; no emojis are used as UI icons.
- [ ] Hover states are subtle and do not shift layout.
- [ ] Focus states are visible and keyboard navigation is usable.
- [ ] Text contrast meets WCAG AA.
- [ ] Text does not overflow buttons, cards, filters, or metadata panels.
- [ ] Responsive layouts were checked at `375px`, `768px`, `1024px`, and `1440px`.
- [ ] No horizontal scrolling appears on mobile.
- [ ] Motion is subtle and respects `prefers-reduced-motion`.
- [ ] Final UI feels literary, premium, academic, modern, readable, and trustworthy.
