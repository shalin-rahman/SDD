# EMCAP — Enterprise Multi-Tenant Core Application Platform

Software design and implementation workspace for EMCAP (SDD v1.0).

## Quick start

```bash
cd infra/docker
docker compose up --build
```

- API: http://localhost:8000/api/v1/health
- Config: http://localhost:8000/api/v1/config/platform
- Web shell: http://localhost:4200 (`admin` / `admin123`)

Local Python (without Docker):

```bash
cd platform/api
pip install -e ".[dev]"
set EMCAP_CONFIG_PATH=../../config/platform.yaml   # Windows
set EMCAP_MODULES_PATH=../../modules
pytest -q --cov=src --cov-fail-under=80
uvicorn emcap.main:app --reload --app-dir src
```

## Project layout

```
SDD/
├── spec/                  # SDD source and formal artifacts
│   ├── framework-sdd.txt  # Original SDD
│   └── sdd/               # Requirements, architecture, traceability, ADRs
├── plan/                  # Implementation plan and task backlog
├── config/                # Platform YAML configuration
├── platform/api/          # FastAPI platform core
├── modules/               # Business plug-ins (inventory, crm, demo)
├── clients/               # Vite/TypeScript web + Flutter mobile shells
├── infra/                 # Docker, Terraform, Helm, Ansible
├── docs/dev/              # Codebase index, recipes, pitfalls
└── .cursor/               # Agent skills and rules
```

## SDD documents

| Document | Path |
|----------|------|
| Document control | `spec/sdd/00-document-control.md` |
| Requirements | `spec/sdd/01-requirements.md` |
| Architecture | `spec/sdd/02-architecture.md` |
| Traceability | `spec/sdd/03-traceability-matrix.md` |
| Platform capability matrix | `spec/sdd/04-capability-matrix.md` |
| End-user UX matrix | `spec/sdd/05-end-user-matrix.md` |
| Task backlog | `plan/03-task-backlog.md` |
| Session summary | `plan/00-session-summary.md` |

## Phase status

**131 / 131** backlog tasks Done (Phases 0–8).

| Phase | Focus | Playbook |
|-------|-------|----------|
| 0–5 | Platform core + Inventory module | `plan/02-implementation-plan.md` |
| 6 | Agent memory + Reports UI | `plan/05-phase6-playbook.md` |
| 7 | Platform service wiring in shells | `plan/06-sdd-gap-closure.md` |
| 8 | End-user product depth (§9 UX) | `plan/07-phase8-end-user-product.md` |

## Verify

```powershell
cd platform/api; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run lint; npm test
cd clients/mobile; flutter analyze; flutter test
.\scripts\verify-full-stack.ps1
```

**60 pytest** · **8 vitest** · **3 flutter** · backend coverage **~90%** (CI gate 80%)

## Definition of done

Business modules supply only `ModuleDefinition(...)` and receive platform capabilities without modifying `platform/` core. See SDD §30 and `modules/README.md`.
