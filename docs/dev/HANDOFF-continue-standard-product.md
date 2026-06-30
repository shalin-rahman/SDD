# Continue here — standard product (new chat handoff)

**Copy into a new Cursor chat** to continue without re-exploring the repo.

**Last updated:** 2026-06-29 — mobile sign-off **complete** (**33** mobile PNGs, **75** total); M1–M6 mobile lanes **Signed**; next focus **Phase 30** web Demo+ elevation → **Phase 31** R4 v2 (`plan/22-web-demo-plus-and-r4-execution.md`)

**Honest gate:** Mobile Product-ready where device PNG exists under `docs/product/screenshots/` (**33** files). Web rows still **Demo/Demo+** in §8/§9/§19 — Phase **30** backlog. R4 depth — Phase **31** backlog (23 Pending tasks).

---

## Current focus

| Phase | Scope | Status |
|-------|--------|--------|
| **24–29** | Residual polish + mobile UX hardening | **Done** |
| **Mobile sign-off** | 33 PNG pack incl. branding, invoice-print, locale-format | **Complete** 2026-06-29 |
| **30** | Web Demo+ → Product-ready (10 tasks) | **Pending** — start P30-T01 (branding web PNG exists) |
| **31** | R4 v2 platform/admin depth (13 tasks) | **Pending** — after P30 quick wins |

**Plan:** `plan/22-web-demo-plus-and-r4-execution.md` · **Memo:** `docs/dev/session-memos/2026-06-13-remaining-signoff-plan.md`

**Do not commit** unless user explicitly asks.

---

## Mobile sign-off complete (2026-06-29)

- M2 PRODUCT detail + grid pack (7 PNGs incl. error-retry)
- P17 platform trio + P24 document preview
- P24 admin + movement lines; P25 finance (6 PNGs incl. invoice-print)
- P26 org profile + logo; P27 locale switch + locale-format
- §19 **branding** — `phase19-settings-branding-mobile.png` (42KB); capture script `expandBrandingSettings()`
- §16–§17 WAREHOUSE, STOCK_MOVEMENT, CRM LEAD/CONTACT
- Milestones **M4** and **M5 Signed (mobile)**

---

## Honest gaps (not blocking mobile sign-off)

| Area | Disposition | Backlog |
|------|-------------|---------|
| Web §8 soft delete, status chip, field types | Demo / Demo+ | **P30-T04–T08** |
| Web §9 loading + error retry | Demo+ | **P30-T05** |
| Web §19 logo/branding/invoice/PDF | Demo+ | **P30-T01–T03, T07** |
| Web assistant / rule evaluate | Demo+ | **P30-T09–T10** (optional) |
| §12 TalkBack/VoiceOver | Demo+ accepted v1 | semantics tests (17) |
| Mobile reports/dashboards/notifications | N/A v1 | **P31-T01–T04** |
| Admin v2 (permission matrix, security policy) | R4 | **P31-T05–T07** |
| Backend movement/finance UX depth | Demo | **P31-T11–T13** |

---

## Flutter test session — learnings

**Prefer one `flutter test` file at a time in foreground** (~20–30s/file).

| Issue | Fix |
|-------|-----|
| `pumpAndSettle()` hangs | `screen_test_harness.dart` — `pumpUntilFound` |
| Missing mock on record screen | `getPlatformConfig()` on `EmcapClient` mock |
| `admin_signoff_test.dart` analyze | `import 'dart:ui';` for `Size` |

**PATH:** `$env:Path = "C:\Users\u1074139\flutter\flutter_windows_3.44.2-stable\flutter\bin;" + $env:Path`

---

## Verify snapshot

| Layer | Result |
|-------|--------|
| Flutter | **542/542** pass; **85.71%** line (2026-06-25) |
| Web Karma | **543/543** pass; **80.79%** branches |
| Mobile sign-off tests | **31/31** (locale, bulk, a11y) — 2026-06-29 |
| API | `GET /api/v1/health` → 200 |

```bat
node scripts/check-api-health.mjs
cd clients\web && npm run test:ci
cd clients\mobile && flutter test --coverage
node scripts\capture-mobile-signoff-screenshots.mjs --only=branding
node scripts\capture-screenshot-sprint.mjs --only=settings
```

---

## Suggested prompt (new chat)

> Continue EMCAP from `docs/dev/HANDOFF-continue-standard-product.md`. Mobile sign-off **complete** (33 PNGs). Execute **Phase 30** web Demo+ elevation per `plan/22` — start P30-T01 (§19 branding web, PNG exists). Then Phase **31** R4 v2 as scheduled. **542/542** flutter; **543/543** karma. No commit before review.

---

## Key paths

| Need | Path |
|------|------|
| Execution plan | `plan/22-web-demo-plus-and-r4-execution.md` |
| Backlog | `plan/03-task-backlog.md` Phase 30–31 |
| Product matrix | `spec/sdd/07-product-readiness-matrix.md` |
| Capture script | `scripts/capture-mobile-signoff-screenshots.mjs` (`--only=branding`, …) |
| Pitfalls | `docs/dev/known-pitfalls.md` § branding capture, grid-empty |
