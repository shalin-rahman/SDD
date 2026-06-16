# Continue here — standard product (new chat handoff)



**Copy into a new Cursor chat** to continue without re-exploring the repo.



**Last updated:** 2026-06-16  

**Backlog:** see progress table in `plan/03-task-backlog.md` (296 Done / 27 Pending / 6 Partial)  

**Recent (2026-06-16):** P18-T11/T13/T12/T14 — auth UX, bulk grid, settings i18n, Playwright smoke script + weekly CI workflow. Karma **417** specs, **80%+** branches. Next: mobile mirror, P18-T15 screenshots.

**Sprint plan 11:** `C:\Users\u1074139\.cursor\task-summaries\2026-06-16-emcap-sprint-plan-11-rapid-dev.md` (Sprints 11–14 rapid dev)

**Do not commit** unless user explicitly asks.



---



## Read first (tiered)



### Tier 1 — Always (canonical)



1. `docs/dev/codebase-index.md`

2. `docs/product/user-feedback-registry.md` — §A standing orders, §M security/memory tiers



### Tier 2 — Sprint context



3. `docs/dev/HANDOFF-continue-standard-product.md` (this file)

4. `plan/20-standard-entity-rollout.md` — W1–W5 entity rollout

5. `plan/03-task-backlog.md` — Crash course section

6. `plan/17-standard-product-execution-playbook.md` §4 sprint order

7. **Sprint plan 4:** `C:\Users\u1074139\.cursor\task-summaries\2026-06-15-emcap-sprint-plan-4.md`
8. **Sprint plan 5:** `C:\Users\u1074139\.cursor\task-summaries\2026-06-15-emcap-sprint-plan-5.md`
9. **Sprint plan 6:** `C:\Users\u1074139\.cursor\task-summaries\2026-06-16-emcap-sprint-plan-6.md`
10. **Sprint plan 7:** `C:\Users\u1074139\.cursor\task-summaries\2026-06-16-emcap-sprint-plan-7.md`
11. **Sprint plan 8:** `C:\Users\u1074139\.cursor\task-summaries\2026-06-16-emcap-sprint-plan-8.md`
12. **Sprint plan 9:** `C:\Users\u1074139\.cursor\task-summaries\2026-06-16-emcap-sprint-plan-9.md`
13. **Sprint plan 10:** `C:\Users\u1074139\.cursor\task-summaries\2026-06-16-emcap-sprint-plan-10.md`
14. **Sprint plan 11:** `C:\Users\u1074139\.cursor\task-summaries\2026-06-16-emcap-sprint-plan-11-rapid-dev.md`



### Tier 3 — Historical (verify before trusting paths)



7. `docs/dev/session-memos/2026-06-14-conversation-architecture-memory.md`

8. `docs/dev/known-pitfalls.md` when debugging



---



## Architecture (memorize)



| Layer | Path |

|-------|------|

| Business | `modules/` only |

| Platform API | `platform/api/src/emcap/` |

| Web shared UI | `clients/web/src/app/shared/` |

| Web pages | `clients/web/src/app/pages/` (thin) |

| Mobile | `clients/mobile/lib/app/` |

| Mobile tokens | `clients/mobile/lib/theme/app_tokens.dart` |

| Mobile badges | `clients/mobile/lib/widgets/emcap_badge.dart` |



### Entity UX — separate list / record (C15, Slice 15C Done)



| | Web | Mobile |

|---|-----|--------|

| **List** | `/app/entity/:code` → `entity-list` | `entity_list_screen.dart` |

| **Record** | `/new`, `/:recordId` → `entity-record` | push `entity_record_screen.dart` |



---



## Milestones (matrix 07)



| Milestone | Status |

|-----------|--------|

| **M1** PRODUCT web | Signed |

| **M2** PRODUCT mobile | Open — Flutter PNG blocked locally |

| **M4** Inventory web | Signed |

| **M5** Platform + CRM | Partial |

| **M6** Admin/settings | Partial |



---



## Recently Done (uncommitted)



- **P18-T07** — `MenuDefinition.icon` on all modules; GET `/menus` + `SidenavNavComponent` mat-icon; `test_module_report_menus.py` + `sidenav-nav.component.spec.ts`

- **P19-T07** — `docs/dev/recipes/tenant-isolation-write-test.md` (unit + integration + manual)

- **P16-T09 remainder** — breadcrumb Karma specs on admin roles/security/permissions (`admin-permissions.component.spec.ts` new)

- **P15-T14** — `mobile_sse_grid_test.dart` extended (6 tests: realtime/offline/grouping)

- **P21-T03** — CI integration job `migrate.py up`; `test_system_columns_present_after_migrations`

- **P15-T32** — `axe-core` + `*.a11y.spec.ts` (entity-list, settings); `npm run test:a11y`; Karma **202/202**

- **P16-T06** — mobile settings `EmcapThemeTokens` + `EmcapBadge`; grid `DataTableTheme` density; shell density toggle

- **P21-T01 migration recipe** — `docs/dev/recipes/apply-pg-migrations.md`; `test_migrations.py`

- **P20-T04** — mobile `getReportRun` parity with web `REQUIRED_METHODS`

- **CI fix (task 18264)** — `GridMetadata` spec fixtures: `schema_version: '1'` (string), column `sortable`/`filterable`, grid `grouping`/`realtime`/`offline`; `dynamic-data-grid.component.spec.ts`, `entity-list.component.spec.ts`; Karma **200/200** green (`npm run test:ci`)

- **P20-T07 / P20-T06** — lazy entity list/record, notifications, account; initial bundle **818 kB**; `app.routes.spec.ts`

- **P16-T05** — settings template vars → clickable `.emcap-badge`; settings SCSS `--emcap-*` tokens; removed `MatChipsModule`

- **P15-T30 / P15-T31** — grid keyboard nav + form `aria-label`; `dynamic-data-grid.component.spec.ts`

- **P18-T08** — `test_inventory_product_smoke.py` WAREHOUSE + STOCK_MOVEMENT chain

- **P16-T03** — `EmcapThemeTokens` ThemeExtension + `theme_tokens_test.dart`; wired in `EmcapTheme.buildThemeData`

- **P16-T06** — Done — settings/entity-list tokens; shell density toggle; `theme_tokens_test.dart`

- **P20-T06** (partial) — lazy `loadComponent` routes (admin, settings, workflow, reports, dashboards, assistant)

- **P18-T06** — LEAD/CONTACT grid fixture contracts in `entity_system_contract_test.dart`

- **P16-T07/T08** — density toggle; dark contrast audit

- **P15-T14** — mobile SSE grid contract tests (6 assertions)

- **P20-T04** — `REQUIRED_METHODS` sync + `getReportRun` mobile parity

- **P21-T01** — `002_system_columns.sql`

- **Sprint 5 (2026-06-16)** — P19-T08/P13-T30 ADR-007 layout designer; P20-T08 matrix 07 M2–M6 rev; P18-T07 mobile menu icons (`material_icon_util.dart`)

- **Sprint 6 (2026-06-16)** — P13-T31 layout override API + merge; P13-T20 ops isolation write; CC-5 grid i18n deny; shell i18n; mobile doc preview tests

- **Sprint 7 (2026-06-16)** — P13-T21 settings isolation ops UI; P13-T31/T32 `LayoutEditorPanelComponent` (form + grid); web/mobile client parity (`getAdminLayoutMetadata`, `getTenantIsolationOps`); FR/BN i18n; Karma **209/209**; build **822 kB**; pytest **94**

- **Sprint 9 (2026-06-16)** — P13-T12 mobile field `read_roles` editor; mobile settings i18n + isolation ops panel; web settings/account i18n (isolation mode labels, observability, MFA errors); Karma **210/210**; build **830 kB**

- **Sprint 10 (2026-06-16)** — Mobile `layout_editor_panel.dart`; workflow state i18n (web + mobile); P20-T08 matrix 07 M2/M3/M5/M6 rev; Karma **213/213**; build **831 kB**

- **Sprint 11 (2026-06-16)** — Coverage ratchet: `test_rbac.py`, `test_formula_engine.py`; web specs (account, login, utils); Karma **231/231**; coverage **~57% lines**

- **Sprint 12–13 (2026-06-16)** — Editable document settings + report schedule admin; `test_workflow_engine.py`, `test_oauth_provider.py`; dynamic-form + shell specs; Karma **241/241**; coverage **~59% lines**; pytest **298**; Flutter `--coverage` CI; mobile `layout_editor_panel_test.dart`
- **Sprint 14 (2026-06-16)** — NFR-003 branch coverage push: Karma **406/406**, **80.57% branches** (954/1184), **80%** gate in `karma.conf.js`; API pytest **~91%**; Flutter CI **80%** (`check-flutter-coverage.py`); pitfalls + recipe in `known-pitfalls.md` § NFR-003, `add-coverage-gate.md`



---



## Do next



| Priority | Task | Blocker |

|----------|------|---------|

| 1 | P15-T13 / P20-T03 M2 mobile PNGs | Flutter SDK |

| 2 | P18-T06 CRM mobile Product-ready sign-off | Flutter device PNG |

| 3 | P20-T08 matrix 07 rev when M2 signed | M2 PNG |

**Sprint Plan 10:** `C:\Users\u1074139\.cursor\task-summaries\2026-06-16-emcap-sprint-plan-10.md`



---



## Verification



```bat
cd platform\api && python -m pytest -q --cov=src --cov-fail-under=80
cd clients\web && npm run build && npm run test:ci && npm run test:coverage
```

Last verified 2026-06-16: pytest **~91%** (80% gate); Karma **406 SUCCESS**; web coverage **80.57% branches** (954/1184); `npm run test:coverage` green; build **831 kB**. Flutter gate runs in CI (SDK not on local dev shell).



Mobile (when Flutter available):



```bat

cd clients\mobile

flutter test test\theme_tokens_test.dart test\emcap_badge_test.dart test\entity_record_hero_test.dart

```



---



## Suggested prompt



> Continue EMCAP from `docs/dev/HANDOFF-continue-standard-product.md` and sprint plan-2. Separate list/record entity UX; no commit before review. Proceed on M2 PNG / P20-T07 bundle / P18 CRM sign-off without asking.

