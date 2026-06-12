---
name: emcap-codebase-map
description: >-
  EMCAP in-repo codebase index, known pitfalls, and implementation recipes.
  Use before broad file search — read index, recipes, and pitfalls before searching files.
---

# EMCAP codebase map

## Read first (in order)

1. `docs/dev/codebase-index.md` — zones, scripts, tests, **shared UI map**
2. **`docs/dev/recipes/sync-docs-after-change.md`** — **mandatory after any code change**
3. `.cursor/rules/emcap-doc-sync.mdc` — doc sync rule (always apply)
4. `docs/dev/windows-local-dev.md` — Windows batch/PowerShell pitfalls
5. `docs/dev/known-pitfalls.md` — regressions by phase
6. `docs/dev/recipes/` — task-specific how-tos

## Current focus — Phase 12

| Doc | When |
|-----|------|
| **`clients/web/src/app/shared/README.md`** | Reusable components — use before new UI |
| **`plan/12-enterprise-product-ui.md`** | Shell, admin, settings, i18n, theme |
| **`plan/12-phase12-dod-checklist.md`** | Before marking P12 task Done |
| **`spec/sdd/06-admin-product-ui-matrix.md`** | UX gap (not 04/05 alone) |
| **Skill `emcap-enterprise-ui`** | FR-008d patterns |
| `docs/dev/recipes/enterprise-ui-shell.md` | P12A — compose shared components |
| `docs/dev/recipes/add-admin-api-and-ui.md` | P12B–C — reuse master–detail |

## Local dev (Phase 11)

```bat
cd repo-root
scripts\run-emcap.bat --stack-only --local   rem no Docker
scripts\run-emcap.bat --stack-only           rem Docker
```

## Phase highlights

| Phase | Playbook |
|-------|----------|
| **12** | `plan/12-enterprise-product-ui.md` |
| 11 | `plan/11-local-dev-tooling.md` |
| Backlog | `plan/03-task-backlog.md` (204 tasks) |

## Canonical paths

| Area | Path |
|------|------|
| **Shared web UI** | `clients/web/src/app/shared/` |
| Web pages (thin) | `clients/web/src/app/pages/` |
| Shell wrapper | `pages/shell/` → `AppLayoutComponent` |
| Entity page | `pages/entity/` → master–detail shared components |
| Nav utils | `services/shell-nav.util.ts` |
| Shell state | `shared/services/shell-context.service.ts` |
| Menus API | `platform/api/.../routes/menus.py` |
| Pytest config | `config/platform-test.yaml` (demo seed **off**) |

## After every change

Run **`docs/dev/recipes/sync-docs-after-change.md`** — backlog, matrix, index, recipes, skills.
