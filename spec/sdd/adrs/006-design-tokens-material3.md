# ADR-006: Design tokens (Material 3)

## Status

Accepted — 2026-06-13 · Implementation pending (EMCAP-P16-T02–T08)

## Context

Phase 12–15 delivered an enterprise shell and PRODUCT entity UX with Material Angular components, but spacing, radius, typography, and elevation are partly ad hoc. Phase 16 (W3 in `plan/16-standard-product-system.md`) must align web and mobile to **Material Design 3** semantics before polishing workflow, reports, and admin surfaces (W4–W6).

Stakeholder feedback (registry C6, C10): product sign-off requires visual consistency and WCAG 2.2 AA contrast — not pytest alone.

## Decision

1. **Token source of truth** — CSS custom properties on web (`clients/web/src/styles/_tokens.scss`, consumed by theme service); Flutter `ThemeExtension` (`clients/mobile/lib/theme_tokens.dart`) mirroring the same names and scales.
2. **Material 3 mapping** — Use M3 color roles (`primary`, `on-primary`, `surface`, `surface-container`, `outline`, `error`, etc.), shape scale (extra-small → full), and typography scale (display → label) as documented on [m3.material.io](https://m3.material.io/).
3. **Semantic tokens over raw values** — Components reference `--emcap-space-md`, `--emcap-radius-card`, `--emcap-elevation-1`, not `#1976d2` or `16px` in feature SCSS.
4. **Density** — Default **comfortable**; optional compact toggle (P16-T07) adjusts row height and control padding via token overrides, not per-page CSS.
5. **Dark mode** — Tokens defined for light and dark palettes; contrast audit gate ≥4.5:1 body text (P16-T08).
6. **Catalog** — Human-readable component inventory in `docs/product/design-system.md` (P16-T04); code paths in `clients/web/src/app/shared/README.md`.

## Token categories (initial set)

| Category | Examples | Used by |
|----------|----------|---------|
| **Color** | `--emcap-color-primary`, `--emcap-color-surface-container` | Shell, cards, chips, grid |
| **Spacing** | `--emcap-space-xs` … `--emcap-space-xl` (4px base grid) | Layout, form gaps, grid padding |
| **Radius** | `--emcap-radius-sm`, `--emcap-radius-card`, `--emcap-radius-full` | Buttons, cards, chips |
| **Typography** | `--emcap-font-title-lg`, `--emcap-font-body-md` | Hero header, grid cells, admin tables |
| **Elevation** | `--emcap-elevation-0` … `--emcap-elevation-3` | Cards, sidenav, dialogs |
| **Motion** | `--emcap-duration-short`, `--emcap-easing-standard` | Theme toggle, sidenav (respect `prefers-reduced-motion`) |

Angular Material theme generation should **derive** component themes from these variables where possible; avoid duplicate palette definitions in component SCSS.

## Consequences

- New shared UI must use tokens; PRs with raw hex/spacing in `shared/` should be rejected in review.
- Flutter and web screenshot pairs (M2) should look structurally aligned — same density and chip semantics.
- Bundle size: token file is small; lazy routes unchanged until P20-T06.
- **Not in scope:** custom non-Material widget library; runtime theme designer (admin branding preview is P19-T05).

## References

- `plan/16-standard-product-system.md` — W3 tasks P16-T01–T08
- `docs/product/design-system.md` — component catalog
- ADR-005 — Angular CLI web client
- [Material Design 3](https://m3.material.io/) · Flutter Material 3 theming
