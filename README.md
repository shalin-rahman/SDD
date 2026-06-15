# EMCAP — Enterprise Multi-Tenant Core Application Platform

Software design and implementation workspace for EMCAP (SDD v1.0).

## Quick start

**Windows (tests + stack + seed + web + live logs):**

```bat
cd C:\path\to\SDD
scripts\run-emcap.bat              rem run from repo root; tails Docker logs
scripts\run-emcap.bat --stack-only rem skip lint/tests; start stack only
scripts\run-emcap.bat --stack-only --local rem no Docker; SQLite + uvicorn
scripts\logs-emcap.bat             rem re-attach to Docker logs
scripts\stop-emcap.bat             rem stop all services
```

**No Docker?** Use `scripts\run-emcap.bat --stack-only --local` (SQLite + uvicorn).

Logs: `logs/emcap/<session>/`. See **`docs/dev/windows-local-dev.md`** if anything fails.

**Manual:**

```bash
cd infra/docker
docker compose up --build
cd clients/web
npm ci && npm start
```

- API: http://localhost:8000/api/v1/health
- Web: http://localhost:4200 (`admin` / `admin123`)
- Seed data: `data/seed/` (see `data/seed/README.md`; toggle demo in `config/platform.yaml`)

## Project layout

```
SDD/
├── spec/sdd/              # Requirements, ADRs, traceability, UX matrices
├── plan/                  # Implementation playbooks (Phase 12 = enterprise UI)
├── docs/                  # Product, dev guides, session memos, ops
│   └── dev/session-memos/ # Agent handoff summaries (in-repo)
├── scripts/               # run-emcap, lint-format, seed apply
├── data/seed/             # JSON core + demo seed packs
├── platform/api/          # FastAPI platform core
├── modules/               # Business plug-ins
├── clients/web/           # Angular CLI 19 web client
│   └── src/app/shared/    # Reusable layout, grid, forms (Phase 12+)
├── clients/web-legacy/    # Archived Vite shell (reference)
├── clients/mobile/        # Flutter mobile client
├── infra/                 # Docker, Terraform, Helm, Ansible
└── .cursor/               # Agent skills + rules (emcap-doc-sync)
```

## Key documents

| Document | Path |
|----------|------|
| **Documentation index** | `docs/README.md` |
| **Doc sync (mandatory after changes)** | `docs/dev/recipes/sync-docs-after-change.md` |
| Codebase index | `docs/dev/codebase-index.md` |
| Session memos | `docs/dev/session-memos/` |
| User feedback registry | `docs/product/user-feedback-registry.md` |
| Standard product execution | `plan/17-standard-product-execution-playbook.md` |
| Product readiness matrix | `spec/sdd/07-product-readiness-matrix.md` |
| Shared web components | `clients/web/src/app/shared/README.md` |
| Task backlog | `plan/03-task-backlog.md` |
| Phase 12 playbook | `plan/12-enterprise-product-ui.md` |
| Phase 12 DoD checklist | `plan/12-phase12-dod-checklist.md` |
| Product/admin UX matrix | `spec/sdd/06-admin-product-ui-matrix.md` |
| Pitfalls | `docs/dev/known-pitfalls.md` |
| Agent skill (Phase 12) | `.cursor/skills/emcap-enterprise-ui/SKILL.md` |

## Verify

```powershell
scripts\lint-format.bat
scripts\run-emcap.bat
```

Or layer by layer:

```powershell
cd platform/api; ruff check src tests; black --check src tests; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run format:check; npm run lint; npm run build; npm run test:ci
cd clients/mobile; dart format --output=none --set-exit-if-changed .; flutter analyze; flutter test
```

## Definition of done

- Business modules: `ModuleDefinition(...)` only — no edits to `platform/` core (SDD §30).
- **All changes:** update docs in the same PR — see `.cursor/rules/emcap-doc-sync.mdc`.
