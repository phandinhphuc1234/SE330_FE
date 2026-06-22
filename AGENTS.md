# AGENTS.md

## Project

This is a Next.js frontend for a Library Management System.

## Stack

- Next.js
- TypeScript
- TailwindCSS
- shadcn/ui
- Lucide React

## UI/UX Design System

Use the design system at:

design-system/quanlythuvien/MASTER.md

When working on a specific page, also check:

design-system/quanlythuvien/pages/[page-name].md

If the page-specific file exists, it overrides MASTER.md.

## Rules

When redesigning UI:

- Keep existing API calls unchanged
- Keep existing business logic unchanged
- Do not invent backend fields
- Do not change routes unless explicitly requested
- Use TailwindCSS and existing shadcn/ui components
- Use Lucide icons instead of emojis
- Keep responsive design for mobile, tablet, and desktop
- Add good loading, empty, and error states when possible

## Verification

After editing, run:

npm run lint
npm run build

## Page Override Workflow

For any UI/UX redesign task, follow this hierarchy strictly:

1. Read `AGENTS.md`
2. Read `design-system/quanlythuvien/MASTER.md`
3. Identify the target page type
4. Check whether a matching page override exists in:
   `design-system/quanlythuvien/pages/[page-name].md`
5. If the page override exists, it overrides MASTER.md for that page.
6. If the page override does not exist and the page has a unique layout, create the override first before editing code.

Recommended page override names:

- `catalog.md` for the public books/catalog listing page
- `book-detail.md` for the public book detail page
- `ebook-reader.md` for the online ebook reading page
- `auth.md` for login/register pages
- `admin-dashboard.md` for admin overview/dashboard pages
- `admin-books.md` for admin book management pages
- `admin-members.md` for member management pages
- `staff-circulation.md` for borrowing/returning/checkin/checkout pages
- `payment.md` for payment, VNPAY, fines, and transaction result pages

Page overrides should only define page-specific layout, hierarchy, component behavior, and visual emphasis. They should not duplicate the entire MASTER.md.
