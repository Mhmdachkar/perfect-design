# Polish & Internationalization Plan

## 1. Performance — kill the page-switch lag

Root cause: every route refetches on mount, no prefetching, no client-side cache between navigations, heavy `useSuspenseQuery` waterfalls.

- Bump router preloading: `defaultPreload: "intent"`, `defaultPreloadDelay: 50`, `defaultPreloadStaleTime: 0` (Query owns freshness).
- Set sensible Query defaults globally: `staleTime: 30s`, `gcTime: 5min`, `refetchOnWindowFocus: false`.
- Add `<Link preload="intent">` on every sidebar entry (already `Link`, just add preload).
- Introduce **Zustand** for shared UI/session state that currently re-renders the whole shell:
  - `useUiStore` → sidebar collapsed, command-palette open, **language**, **currency display**.
  - `useFiltersStore` → per-page filters (clients search, expenses category, etc.) so toggling tabs doesn't re-query.
- Replace per-row `confirm()` deletes with optimistic `useMutation` + cache patch (no full refetch).
- Memoize heavy chart computations (`useMemo`) on dashboard/reports.

## 2. Bilingual EN / AR with full RTL

Stack: **i18next + react-i18next** with a single language store in Zustand (persisted to `localStorage`, also written to `profiles.locale` when signed in).

- `src/lib/i18n.ts` — init with `en` and `ar` resource bundles.
- `src/locales/en.json` + `src/locales/ar.json` — namespaced keys (`nav`, `dashboard`, `clients`, `workshops`, `payments`, `expenses`, `calendar`, `reports`, `settings`, `auth`, `common`).
- Language switcher in app shell header (🇬🇧 EN / 🇱🇧 AR) + on the auth page.
- On language change: set `document.documentElement.lang` and `dir` (`rtl` for Arabic), mirror Tailwind via `dir="rtl"` (use logical properties `ms-*/me-*/ps-*/pe-*` for new styles; audit existing `ml/mr/pl/pr` on the shell, sidebar, dialogs).
- Load Arabic font (`IBM Plex Sans Arabic`) via `<link>` in `__root.tsx`; apply when `dir=rtl`.
- Localize dates/numbers: extend `lib/format.ts` to accept locale; Arabic uses `ar-EG` for numerals (or keep Latin digits — configurable).
- Translate every visible string across routes, dialogs, empty states, toasts.

## 3. Light theme — 70% white, 30% accent

Flip the design system from dark-first to **light-first**.

- `src/styles.css`: rewrite `:root` tokens — `--background: oklch(0.99 0 0)`, `--foreground: oklch(0.15 0 0)`, `--surface-1: #ffffff`, `--surface-2: oklch(0.97 0 0)`, `--border: oklch(0.92 0 0)`, `--muted: oklch(0.96 0 0)`.
- Accent stays as the brand color (existing indigo/violet) used sparingly: primary buttons, active nav, KPI deltas, chart series, status pills — ~30% of pixels.
- Adjust `.surface-card` (subtle shadow instead of glass), `.dot-bg`, status pill palettes for contrast on white.
- Auth page: light background, soft gradient accent.
- Keep `.dark` class tokens for an optional toggle later, but default is light.

## 4. Remove Tax

- Drop `tax` from the expense category enum (migration: convert existing `tax` rows to `other`, then `ALTER TYPE … RENAME` workflow).
- Remove from `CATS` array in `expenses.tsx` and from any reports breakdowns.

## 5. Remaining features (finish the build)

- **Invoices / PDF**: simple invoice generator for workshops — branded PDF (jsPDF + html2canvas) downloadable from workshop detail; respects current language + RTL.
- **Global search (⌘K)**: command palette across clients, workshops, payments, expenses using existing data — wired to Zustand `commandOpen`.
- **Notifications center**: in-app bell with upcoming deadlines + overdue payments (computed from `workshop_financials` view).
- **Client expenses link**: add nullable `client_id` + `workshop_id` to `expenses` (migration) and re-enable the Expenses tab on the client profile.
- **Recycle bin polish**: bulk select + restore.
- **Settings → Preferences**: language, default currency, date format.

## Technical notes

- New deps: `i18next`, `react-i18next`, `i18next-browser-languagedetector`, `zustand`, `jspdf`, `html2canvas`.
- Migration order: (a) drop `tax` from enum, (b) add `client_id`/`workshop_id` FKs on `expenses`, (c) add `locale` + `preferred_currency` to `profiles`.
- All new strings go through `t("…")`; no hardcoded copy in components.
- RTL audit: replace `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`/`text-left`/`text-right` with logical equivalents (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`/`text-end`) on shared shell, dialogs, tables, kanban.

## Delivery order

1. Theme flip + Zustand + Query/Router perf defaults (visible immediately).
2. i18n scaffolding + EN/AR bundles + language switcher + RTL.
3. Tax removal migration + expenses tweaks.
4. Expenses ↔ client/workshop linkage migration + UI.
5. Command palette, notifications, invoice PDF.
6. Settings preferences + recycle bin polish.

Shipping in that order so the user sees the speed and look change first, then features layer on.
