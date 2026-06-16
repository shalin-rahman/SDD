# Recipe — Sync documentation after any change

**Mandatory for every implementation.** Rule: `.cursor/rules/emcap-doc-sync.mdc`

---

## Step 1 — Identify change type

| Type | Primary docs |
|------|----------------|
| Platform API | `04-capability-matrix`, `03-traceability`, `codebase-index` |
| Business module | `modules/*/README`, traceability, module tests |
| Web entity / renderer | `05-end-user-matrix`, `codebase-index`, recipes |
| Web shell / admin / settings (Phase 12) | **`06-admin-product-ui-matrix`**, backlog, `shared/README.md` |
| Scripts / local dev | `known-pitfalls`, `windows-local-dev.md`, Phase 11 playbook |
| New reusable UI component | **`clients/web/src/app/shared/README.md`**, `codebase-index`, `emcap-enterprise-ui` skill |

---

## Step 2 — Backlog & matrices

1. `plan/03-task-backlog.md` — set task **Done** / **Partial** / **Pending**
2. Update progress summary counts if tasks closed
3. Matrix row(s) — honest status (Partial is OK with note)

---

## Step 3 — Index & discoverability

`docs/dev/codebase-index.md`:

- New directories under `platform/`, `clients/web/src/app/shared/`, `scripts/`
- New test files (`*.spec.ts`, `test_*.py`)
- "Read first" table if new playbook or matrix

---

## Step 4 — Recipes & skills

| If you changed… | Update… |
|-----------------|---------|
| Shell / layout | `docs/dev/recipes/enterprise-ui-shell.md` |
| Admin API + UI | `docs/dev/recipes/add-admin-api-and-ui.md` |
| Client API method | `docs/dev/recipes/add-client-api-method.md` |
| Agent entry points | `.cursor/skills/emcap-codebase-map/SKILL.md` |
| Phase 12 patterns | `.cursor/skills/emcap-enterprise-ui/SKILL.md` |
| Tests / CI | `.cursor/skills/emcap-testing/SKILL.md`, `docs/dev/recipes/add-coverage-gate.md` |

Remove stale paths (e.g. `src/app/layout/` — use `src/app/shared/layout/`).

---

## Step 5 — Pitfalls, traceability, session memos

- Recurring bug fixed → `docs/dev/known-pitfalls.md` + test reference
- New FR coverage → `spec/sdd/03-traceability-matrix.md`
- Milestone → `spec/sdd/00-document-control.md` revision row
- Substantive multi-step task or handoff → add `docs/dev/session-memos/YYYY-MM-DD-<slug>.md` + row in `docs/dev/recall-index.md`

---

## Step 6 — Root README (when user-facing)

Update `README.md` if:

- New quick-start flag or script
- New key document link
- Project layout tree changed

---

## Verify docs are consistent

```powershell
# Paths mentioned in shared README exist
dir clients\web\src\app\shared\layout
dir clients\web\src\app\shared\README.md

# No references to deleted shell templates
rg "shell.component.html" docs plan .cursor
```

Manual: open `codebase-index.md` → confirm new paths match repo.

---

## Phase 12 DoD cross-reference

Also satisfy `plan/12-phase12-dod-checklist.md` section **6. Documentation** before marking P12* Done.
