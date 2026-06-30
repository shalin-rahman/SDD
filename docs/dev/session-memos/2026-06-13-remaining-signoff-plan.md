# Remaining mobile sign-off — execution plan

**Date:** 2026-06-29 (mobile sign-off complete; Phase 30–31 scheduled)  
**Goal:** Close all remaining **Demo+** / **partial** mobile sign-off gaps in matrix 07 — elevate where PNG evidence exists on disk; document honest deferrals for R4; no false Product-ready claims.

**Canonical:** `spec/sdd/07-product-readiness-matrix.md` · `docs/dev/HANDOFF-continue-standard-product.md` · `plan/21-standard-product-residual-gaps.md` §Phase R4

**Stack:** Live API + Flutter web build. Branding capture **succeeded** 2026-06-29 after script fix (`expandBrandingSettings`); `phase19-settings-branding-mobile.png` (42KB).

---

## Workstreams

| ID | Scope | Status |
|----|-------|--------|
| **WS1 — Captures** | Run `capture-mobile-signoff-screenshots.mjs` for PNGs not yet on disk | **Done (4/4)** — all mobile sign-off PNGs on disk incl. `phase19-settings-branding-mobile.png` |
| **WS2 — Matrix reconciliation** | Align matrix 07 counts, §16 movement rows with phase20/phase24 PNGs, M4/M5 milestone rows, §18 mobile lane inventory | **Done** — header **74** total / **32** mobile (28+ gate met); §9/§19 logo+invoice/§20 locale-format elevated where PNG exists |
| **WS3 — Explicit deferrals** | Mark R4 / N/A mobile rows with one-line rationale in milestone notes and §10 | **Done** — M5 note + §10 rows (reports, dashboards, notifications, assistant, rule evaluate, LOW_STOCK); no new backlog tasks |
| **WS4 — Optional web gaps** | Web-only Demo+ rows (§8 enum/lookup/currency, §9 loading web, §19 PDF export, §19 favicon web) | **Noted** — out of mobile sprint; §8 **Demo — v1 accepted** |

---

## PNG inventory (2026-06-25)

| Bucket | Count | Notes |
|--------|-------|-------|
| **Total** | **75** | All `docs/product/screenshots/*.png` |
| **Mobile sign-off pack** | **33** | Filename contains `mobile` |
| **28+ gate** | Met | Was 14 device PNGs at session start |

**Signed mobile inventory (33):**

| Pack | Count | Files |
|------|-------|-------|
| M2 PRODUCT + grid | 7 | `phase14-mobile-product-grid-system-columns`, `phase14-mobile-soft-delete-restore`, `phase15-mobile-product-detail`, `phase15-mobile-product-grid-empty`, `phase15-mobile-product-grid-loading`, `phase15-mobile-product-grid-polish`, `phase15-mobile-product-grid-error-retry` |
| P17 platform | 3 | `phase17-workflow-inbox-mobile`, `phase17-account-profile-mobile`, `phase24-document-preview-mobile` |
| P24 admin | 3 | `phase24-mobile-admin-users`, `phase24-mobile-admin-roles`, `phase24-mobile-admin-security` |
| P24 movement lines | 1 | `phase24-stock-movement-lines-mobile` |
| §16–§17 inventory/CRM | 8 | `phase18-warehouse-*-mobile` ×2, `phase20-stock-movement-*-mobile` ×2, `phase18-crm-*-mobile` ×4 |
| P25 finance | 6 | `phase25-purchase-order-detail-mobile`, `phase25-sales-order-detail-mobile`, `phase25-invoice-partial-mobile`, `phase25-invoice-print-mobile`, `phase25-journal-entry-detail-mobile`, `phase25-vendor-payment-detail-mobile` |
| P26 org + branding | 3 | `phase26-organization-profile-mobile`, `phase26-organization-logo-mobile`, `phase19-settings-branding-mobile` |
| P27 locale | 2 | `phase27-locale-switch-bn-bd-mobile`, `phase27-locale-format-bn-bd-mobile` |

**Capture script flags** (`scripts/capture-mobile-signoff-screenshots.mjs`):  
`--only=m2|p17|doc|p24|p25|p26|p27|vp|restore|grid|grid-empty|grid-loading|grid-error|crm|movement|warehouse|branding|invoice|localefmt|m4`

**Capture status:**

| Target PNG | Matrix row | Status |
|------------|------------|--------|
| `phase15-mobile-product-grid-error-retry.png` | §9 loading + error retry | **On disk** — mobile Product-ready |
| `phase25-invoice-print-mobile.png` | §19 INVOICE print | **On disk** — mobile Product-ready |
| `phase27-locale-format-bn-bd-mobile.png` | §20 locale-aware formatting | **On disk** — mobile Product-ready |
| `phase26-organization-logo-mobile.png` | §19 logo upload | **On disk** — mobile Product-ready |
| `phase19-settings-branding-mobile.png` | §19 favicon/accent branding | **On disk** (42KB) — mobile Product-ready |

---

## Matrix 07 row checklist

| § | Capability | Mobile status | Action | Notes |
|---|------------|---------------|--------|-------|
| **8** | Enum / lookup / currency / textarea | Demo | **Accept Demo v1** | Renderers shipped; optional screenshot pack |
| **8** | Soft delete + restore | Product-ready | **Done** | `phase14-mobile-soft-delete-restore.png` |
| **9** | Grid datetime / polish / empty / error-retry | Product-ready | **Done** | `phase14-mobile-*`, `phase15-mobile-product-grid-*` incl. error-retry |
| **9** | Loading (web) | Demo+ | **Accept Demo+ web** | Mobile Product-ready with loading + error-retry PNGs |
| **10** | Workflow inbox / doc preview / account | Product-ready | **Done** | P17 trio PNGs |
| **10** | Reports / dashboards / notifications | N/A | **Deferred (R4) · N/A mobile** | No v1 mobile routes; web PNG signed |
| **10** | Assistant / rule evaluate | N/A | **Deferred (R4)** | Flag-gated v2 (`plan/21` §R4) |
| **10** | LOW_STOCK report + nav | N/A | **N/A mobile** | Web PNGs only |
| **12** | TalkBack / VoiceOver | Demo+ | **Accept Demo+** | `a11y_semantics_test.dart` (17); device audit optional |
| **16** | `STOCK_MOVEMENT` + enum + lines | Product-ready | **Done** | phase20 grid/detail + phase24 lines mobile PNGs |
| **16** | Transfer / posted qty logic | Demo | **Accept Demo** | Backend/domain; not mobile UX gate |
| **17** | WAREHOUSE / LEAD / CONTACT | Product-ready | **Done** | `phase18-warehouse-*`, `phase18-crm-*` mobile PNGs |
| **18** | P25 finance detail | Product-ready | **Done** | 6× `phase25-*-mobile.png` incl. invoice-print |
| **19** | Org profile / logo / invoice print | Product-ready | **Done** | `phase26-organization-*`, `phase25-invoice-print-mobile.png` |
| **19** | Favicon + accent branding | Product-ready | **Done** | `phase19-settings-branding-mobile.png` |
| **20** | Locale switcher + locale-format | Product-ready | **Done** | `phase27-locale-switch-*`, `phase27-locale-format-bn-bd-mobile.png` |

---

## Milestone targets

| Milestone | Before | After reconciliation |
|-----------|--------|----------------------|
| **M4** | mobile partial | **Signed (mobile)** — M2 grid pack (7 PNGs incl. error-retry) + WAREHOUSE + STOCK_MOVEMENT (phase20 + phase24 lines) |
| **M5** | mobile partial | **Signed (mobile)** — P17 trio + CRM LEAD/CONTACT; R4 surfaces explicitly N/A/deferred |

M1–M3 and M6 mobile lanes unchanged (already Signed).

---

## Explicit deferrals (do not implement this sprint)

| Item | Disposition | Rationale |
|------|-------------|-----------|
| §8 enum / lookup / currency / textarea | **Accept Demo for v1** | Renderers shipped; optional screenshot pack is polish |
| §12 TalkBack / VoiceOver | **Demo+ (test-based)** | Semantics tests + manual checklist; full Product-ready needs device audit |
| §10 reports, dashboards, notifications (mobile) | **Deferred (R4) · N/A mobile** | No v1 mobile routes; web Product-ready signed |
| §10 assistant, rule evaluate (mobile) | **Deferred (R4)** | `plan/21` §Phase R4 — post-M6 v2 |
| §10 LOW_STOCK (mobile) | **N/A mobile** | Web report PNGs only |
| Phase R4 catalog (`plan/21`) | **Out of scope** | Permission matrix, dashboard charts, template editor, security policy editor, rule evaluate mobile |

---

## WS1 — Capture commands

Prereq: API up (`node scripts/check-api-health.mjs`), Flutter web build with `EMCAP_API_URL=http://localhost:8000`.

```bat
cd clients\web
node ..\..\scripts\capture-mobile-signoff-screenshots.mjs --only=branding
```

Full M4 inventory refresh:

```bat
node ..\..\scripts\capture-mobile-signoff-screenshots.mjs --only=m4
```

---

## Verification commands

```bat
REM Flutter PATH (Windows)
set PATH=C:\Users\u1074139\flutter\flutter_windows_3.44.2-stable\flutter\bin;%PATH%

cd clients\mobile
flutter pub get
flutter test --coverage
flutter analyze

cd ..\..\platform\api
python -m pytest tests/test_entity_pagination.py -q

cd ..\clients\web
npm run test:ci

REM PNG inventory (74 total; 32 mobile expected)
dir /b docs\product\screenshots\*.png
dir /b docs\product\screenshots\*mobile*.png
```

**Last green snapshot (2026-06-25):** Flutter **542/542** (~3m51s); line **85.71%**; Karma **543/543**; mobile a11y **17** cases.

---

## Doc sync (this session)

| File | Change |
|------|--------|
| `spec/sdd/07-product-readiness-matrix.md` | 75 total / 33 mobile; §19 branding Product-ready (mobile); M4/M5 Signed |
| `docs/dev/HANDOFF-continue-standard-product.md` | Mobile sign-off complete; Phase 30–31 focus |
| `plan/22-web-demo-plus-and-r4-execution.md` | Web Demo+ + R4 v2 execution plan |
| `plan/03-task-backlog.md` | Phase 30 (10 Pending) + Phase 31 (13 Pending) |
| `docs/dev/recall-index.md` | Rows for signoff memo + plan/22 |
| `docs/dev/known-pitfalls.md` | § branding capture (`expandBrandingSettings`) |

---

## Open follow-ups (honest gaps)

**Mobile sign-off PNG pack: complete (33 files).**

1. **§8 field types** — Demo accepted for v1; optional elevation with screenshot pack.
2. **§9 loading (web)** — Demo+; mobile Product-ready.
3. **§12 a11y** — Demo+ until manual TalkBack/VoiceOver pass.
4. **§16 transfer/posted qty** — Demo backend depth.
5. **§19 PDF export / email signature** — web Demo+ / server-only; no mobile gate.
6. **Phase R4** — admin/platform depth when product schedules v2.

**No git commit** unless user explicitly requests.
