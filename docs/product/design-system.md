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
| Color roles | `styles/_tokens.scss` (planned) | `theme_tokens.dart` (planned) | Light + dark |
| Spacing scale | 4px grid | Same scale names | Comfortable default |
| Typography | M3 type scale | M3 type scale | Hero = `title-lg` |
| Shape / radius | Card, chip, button | Matching `BorderRadius` | |
| Elevation | Cards, sidenav | `Material` elevation | |

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
| Dynamic data grid | `app-dynamic-data-grid` | Metadata columns, search, export |
| Record detail header | `app-record-detail-header` | SKU — Name hero, status chip, actions |
| Record tabs | `app-record-tabs` | Notes, documents, audit |
| Status chip | Material `mat-chip` | `active`, workflow state (standardize P16-T05) |

**Grid behaviors:** zebra rows, sticky header, datetime formatting (`field-display.util.ts`).

---

## Forms

| Component | Web | Use |
|-----------|-----|-----|
| Dynamic form view | `app-dynamic-form-view` | Section cards, read-only system fields |
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
| 2026-06-13 | Initial catalog stub (P16-T04) — maps existing shared components; tokens TBD |
