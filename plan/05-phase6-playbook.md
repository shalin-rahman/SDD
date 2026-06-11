# Phase 6 — Knowledge Base + Client Completion

Post–Phase 5: agent memory, LOW_STOCK report UI, full-stack smoke, SDD doc sync.

**Recipe:** `docs/dev/recipes/add-report-ui.md` · **Pitfalls:** `docs/dev/known-pitfalls.md`

---

## P6-T01 — Codebase index + pitfalls + recipes

| File | Purpose |
|------|---------|
| `docs/dev/codebase-index.md` | File → purpose lookup |
| `docs/dev/known-pitfalls.md` | Regression registry |
| `docs/dev/recipes/*.md` | No-thinking implementation checklists |
| `docs/dev/recall-index.md` | External summary → in-repo pointers |

**Verify:** Manual review.

---

## P6-T02 — Cursor rule/skill updates

| File | Purpose |
|------|---------|
| `.cursor/rules/emcap-sdd-workflow.mdc` | SDD workflow (always apply) |
| `.cursor/skills/emcap-codebase-map/SKILL.md` | Read index first |
| `.cursor/README.md` | Index new assets |
| `.cursor/skills/emcap-testing/SKILL.md` | Client/inventory test files |
| `.cursor/skills/emcap-devops/SKILL.md` | Ansible paths |
| `.cursor/rules/emcap-core-standards.mdc` | Point to index/pitfalls |

**Verify:** Agent loads context without broad search.

---

## P6-T03 — LOW_STOCK report UI (web)

1. Add `listReports()`, `runReport(code)` to `clients/web/src/api/emcap-client.ts`
2. Add to `REQUIRED_METHODS` in `emcap-client.test.ts`
3. Add **Reports** nav in `clients/web/src/app/main.ts`:
   - List from `GET /api/v1/reports`
   - Run selected report → render `rows` in table

**Verify:**

```powershell
cd clients/web; npm run lint; npm test
```

---

## P6-T04 — LOW_STOCK report UI (mobile)

1. Add `listReports()`, `runReport(code)` to `clients/mobile/lib/api/emcap_client.dart`
2. Create `clients/mobile/lib/app/report_screen.dart`
3. Add **Reports** NavigationRail entry in `shell.dart`

**Verify:**

```powershell
cd clients/mobile; flutter analyze
```

---

## P6-T05 — Client API `runReport`

Covered by P6-T03/T04. Generic `POST /api/v1/reports/{code}/run` — not inventory-hardcoded in clients.

**Verify:** `test_client_api_gaps.py::test_low_stock_report_filter`

---

## P6-T06 — Full-stack smoke scripts

| Script | Steps |
|--------|-------|
| `scripts/verify-full-stack.ps1` | pytest, web lint+test, API health curl |
| `scripts/verify-full-stack.sh` | Same for bash |

**Verify:** Run script locally (API must be up for health check).

---

## P6-T07 — SDD doc sync

Update: `spec/sdd/03-traceability-matrix.md`, `plan/02-implementation-plan.md`, `plan/00-session-summary.md`, `plan/04-client-api-completion.md`, `docs/modules/inventory-definition-of-done.md`, `plan/03-task-backlog.md`, optional `spec/sdd/adrs/002-agent-memory-and-recipes.md`.

**Verify:** Consistent test counts and Phase 6 status **7/7 Done**.

---

## Exit criteria

- Agent memory in `docs/dev/` + `.cursor/`
- LOW_STOCK runnable from web and mobile Reports views
- `python -m pytest -q` green; web lint + vitest green
- Phase 6 backlog complete with traceability rows
