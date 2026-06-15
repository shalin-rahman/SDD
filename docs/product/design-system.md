# EMCAP design system (component catalog)

**Status:** Stub — EMCAP-P16-T04 (catalog grows as P16-T05–T08 land)  
**ADR:** `spec/sdd/adrs/006-design-tokens-material3.md`  
**Code index:** `clients/web/src/app/shared/README.md` · Flutter shell under `clients/mobile/lib/`

Product-facing UI follows **Material Design 3** tokens (spacing, color roles, typography, elevation). This document is the **product catalog**; implementation paths live in the shared README and source.

---

## Principles

| Principle | Application |
|-----------|-------------|
| Metadata-driven | Grids and forms render from API metadata — no entity-specific field components |
| Token-first | Use `--emcap-*` variables / Flutter `ThemeExtension` — no ad hoc hex in pages |
| Shell consistency | Entity, admin, and service pages share layout and action patterns |
| Accessibility | WCAG 2.2 AA targets: focus visible, label in name, 4.5:1 body contrast |
| i18n | EN / FR / BN for all chrome strings |

---

## Foundations (P16-T02–T03)

| Token group | Web | Mobile | Notes |
|-------------|-----|--------|-------|
| Color roles | `styles/_tokens.scss` | `lib/theme/app_tokens.dart` (`EmcapThemeTokens`) | Light + dark via `html[data-theme]` / `ThemeMode` |
| Spacing scale | 4px grid | Same scale names | Comfortable default |
| Density | `html[data-density]` compact override | `EmcapThemeTokens.compact*` density row padding | Grid row padding tokens |
| Typography | M3 type scale | M3 type scale | Hero = `title-lg` |
| Shape / radius | Card, chip, button | Matching `BorderRadius` | |
| Elevation | Cards, sidenav | `Material` elevation | |

### Dark mode contrast audit (P16-T08)

WCAG 2.2 AA target: **≥4.5:1** body text on surface; **≥3:1** large text / UI chrome.

| Pair | Light | Dark (after audit) | Notes |
|------|-------|-------------------|-------|
| Body `--emcap-text` on `--emcap-surface` | Pass | Pass (`#f5f5f5` / `#121212`) | |
| Muted `--emcap-text-muted` on surface | Pass | Pass (`#b0b6bc` / `#121212`) | Bumped from `#9aa0a6` |
| Primary badge on surface | Pass | Pass | Dark uses `#8ab4f8` primary |
| Success/warn/error badges | Pass | Pass | Tokenized `--emcap-badge-*` with dark overrides |
| Panel cards on dark shell | — | Pass | `--emcap-panel-surface` replaces hardcoded `#1e1e1e` |

Fix pattern: semantic tokens in `_tokens.scss`; components reference tokens only (no per-page hex in dark surfaces).

### Density (P16-T07)

| Mode | Attribute | Grid row padding |
|------|-----------|------------------|
| Comfortable (default) | — | `0.55rem` × `0.75rem` |
| Compact | `html[data-density=compact]` | `0.35rem` × `0.5rem` |

Toggle: Account → Preferences (`ThemeService.toggleDensity`). Persisted in `localStorage` key `emcap-density`.

---

## Layout

| Component | Web selector | Mobile | Use |
|-----------|--------------|--------|-----|
| App shell | `app-app-layout` | `ShellScreen` | Sidenav + toolbar |
| Master–detail | `app-master-detail-layout` | Split / drawer | Entity list + detail |
| Page header | `app-page-header` | AppBar variant | Title, back, actions |
| Detail placeholder | `app-detail-placeholder` | Empty state widget | No row selected |

---

## Navigation

| Component | Web | Use |
|-----------|-----|-----|
| Sidenav nav | `app-sidenav-nav` | Module-grouped menus (`INVENTORY`, `CRM`) |
| Tenant select | `app-tenant-select` | SaaS tenant picker |
| Breadcrumbs | Planned P16-T09 | Entity context |

---

## Data display

| Component | Web | Use |
|-----------|-----|-----|
| Dynamic data grid | `app-dynamic-data-grid` | Metadata columns, search, export, **keyboard nav** (ArrowUp/Down, Enter) |
| Record detail header | `app-record-detail-header` | SKU — Name hero, status chip, actions |
| Record tabs | `app-record-tabs` | Notes, documents, audit |
| Status chip | `.emcap-badge` (`--on` / `--off` / `--warn` / `--muted`) | `EmcapBadge` / `EmcapStatusChip` | record header, admin users, settings platform cards, **template variable buttons** (P16-T05) |

**Grid behaviors:** zebra rows, sticky header, datetime formatting, **WCAG keyboard row focus** (P15-T30).

---

## Forms

| Component | Web | Use |
|-----------|-----|-----|
| Dynamic form view | `app-dynamic-form-view` | Section cards, read-only system fields, **`aria-label` on inputs** (P15-T31) |
| Field renderers | `dynamic-form.renderer.ts` | STRING, NUMBER, BOOLEAN, DATE, ENUM*, LOOKUP* |

\* ENUM / LOOKUP renderers — Phase 14B (pending).

---

## Actions

| Pattern | Spec |
|---------|------|
| Primary | One primary per pane (Save, Run report) |
| Destructive | Delete with confirm; soft-delete shows restore when API supports |
| Workflow | Header action bar; not form footer |
| Icon buttons | `aria-label` required |

---

## Admin & settings (Phase 12 / 19)

| Component | Web | Use |
|-----------|-----|-----|
| Admin form panel | `app-admin-form-panel` | User/role detail |
| Admin list toolbar | `app-admin-list-toolbar` | New record CTA |
| Permission picker | `app-permission-picker` | Role permissions |
| Settings toggles | `app-settings-toggle-group` | Platform flags |

---

## Service surfaces (Phase 17 — catalog entries TBD)

| Surface | Target bar | Screenshot slug (planned) |
|---------|------------|---------------------------|
| Workflow inbox | Table/cards, SLA badges | `phase17-workflow-inbox-web` |
| Reports | Run history, CSV download | `phase17-report-run-history-web` |
| Notifications | Read/unread, channel icons | `phase17-notification-center-web` |
| Documents | Preview panel | `phase17-document-preview-web` |

---

## Screenshots & sign-off

Capture conventions: `docs/product/screenshots/README.md`  
Product-ready checklist: `plan/16-product-ready-dod.md`

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-15 | P16-T06 mobile density toggle (shell app bar); settings/entity-list `EmcapThemeTokens`; `DataTableTheme` row padding |
| 2026-06-15 | P16-T03 Flutter `EmcapThemeTokens` ThemeExtension; P16-T06 `EmcapBadge`/`EmcapStatusChip` mobile parity |
| 2026-06-15 | P16-T07 density toggle (Account + `data-density` tokens); P16-T08 dark contrast audit table + token fixes |
| 2026-06-13 | Initial catalog stub (P16-T04) — maps existing shared components; tokens TBD |
