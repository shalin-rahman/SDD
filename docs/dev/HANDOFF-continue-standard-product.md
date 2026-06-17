# Continue here — standard product (new chat handoff)

**Copy into a new Cursor chat** to continue without re-exploring the repo.

**Last updated:** 2026-06-17  
**Backlog:** **296 Done / 27 Pending / 7 Partial** (333 total) — `plan/03-task-backlog.md`  
**Do not commit** unless user explicitly asks.

---

## Session snapshot (2026-06-17)

### Done
| ID | What |
|----|------|
| **P18-T15** | 8 admin/settings PNGs — `node scripts/capture-screenshot-sprint.mjs --only=admin-settings` |
| **P18-T21** | Admin users/roles/security Product-ready DoD (load retry, saveError, deactivate confirm, ABAC empty/retry) |
| **P16-T09** | Shell breadcrumbs + i18n page titles + sidenav load retry/empty |
| **M6 partial** | Report schedule cron validation + load retry; mobile login/OAuth/401; integrations on settings hub (Account cleaned) |

### Gates (verified)
- Karma **433/433**, branches **≥80%** (`karma.conf.js`)
- API pytest **299 passed**, **~91%** coverage

### Learnings → `docs/dev/known-pitfalls.md`
- Settings cron spec: valid 5-field cron to test API errors (client validation first)
- `resolvePageTitle`: pass `translate` mock for default title
- Admin Product-ready: `EmptyState` + retry, not plain error paragraphs
- Web i18n ~596 lines vs mobile ~367 — sync keys in same change
- Playwright: install Chromium before screenshot sprint; stack on `:8000`/`:4200`

---

## Read first

1. `docs/dev/codebase-index.md`
2. `docs/product/user-feedback-registry.md`
3. `docs/dev/known-pitfalls.md`
4. `spec/sdd/07-product-readiness-matrix.md` — M6 still **Partial**
5. `plan/03-task-backlog.md` — Crash course section
6. `docs/dev/session-memos/2026-06-17-m6-admin-screenshots-dod.md`

---

## Pending (priority order)

### Web — unblocked
| Priority | Task | Gap |
|----------|------|-----|
| 1 | **Shell/nav Product-ready** | Dedicated shell/nav PNG; matrix §12 still Partial |
| 2 | **Report schedules** | Cron editor PNG + any remaining DoD |
| 3 | **P18-T12** | i18n depth — sync mobile bundle (~229 keys behind) |
| 4 | **P18-T11** | Mobile MFA step indicator (web account parity) |
| 5 | **P18-T13** | Bulk actions mobile grid |
| 6 | **P18-T14** | Expand Playwright smoke / optional PR gate |
| 7 | **Entity record header** | §12 Demo → badge UX (P16-T05) |

### Mobile — Flutter SDK required
| Task | Gap |
|------|-----|
| **P15-T13 / P20-T03** | M2 PRODUCT mobile PNG |
| **P18-T06 / P18-T09 / P18-T10** | CRM + PRODUCT mobile sign-off |
| **CC-1 / CC-2** | Crash course mobile tracks |

### Matrix M6 §12 still open
- Enterprise shell/nav — **Partial (web)**
- Report schedules — **Partial (web)**
- Entity record header — **Demo**
- ABAC editor — **Demo** (UX improved, not Product-ready)

---

## Verify

```bat
cd platform\api && python -m pytest -q --cov=src --cov-fail-under=80
cd clients\web && npm run test:ci && npm run test:coverage
scripts\start-emcap-local.bat
node scripts/capture-screenshot-sprint.mjs --only=admin-settings
node scripts/e2e-smoke.mjs
```

---

## Suggested prompt (new chat)

> Continue EMCAP from `docs/dev/HANDOFF-continue-standard-product.md`. M6 remainder: shell/nav PNG + report schedule PNG, then P18-T12 mobile i18n sync and P18-T11 mobile MFA. Maintain ≥80% Karma branches. No commit before review.
