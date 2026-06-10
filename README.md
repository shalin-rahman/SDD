# EMCAP — Enterprise Multi-Tenant Core Application Platform

Software design and implementation workspace for EMCAP (SDD v1.0).

## Quick start

```bash
cd infra/docker
docker compose up --build
```

- API: http://localhost:8000/api/v1/health
- Config: http://localhost:8000/api/v1/config/platform

Local Python (without Docker):

```bash
cd platform/api
pip install -e ".[dev]"
set EMCAP_CONFIG_PATH=../../config/platform.yaml   # Windows
pytest -q
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
├── modules/               # Business plug-ins (ModuleDefinition)
├── clients/               # Angular + Flutter
├── infra/                 # Docker, Terraform, Helm
├── docs/dev/              # GitFlow and dev guides
└── .cursor/               # Agent skills and rules
```

## SDD documents

| Document | Path |
|----------|------|
| Document control | `spec/sdd/00-document-control.md` |
| Requirements | `spec/sdd/01-requirements.md` |
| Architecture | `spec/sdd/02-architecture.md` |
| Traceability | `spec/sdd/03-traceability-matrix.md` |
| Task backlog | `plan/03-task-backlog.md` |

## Phase status

| Phase | Status |
|-------|--------|
| 0 — Repo & local dev | In progress (scaffold complete) |
| 1 — Platform core | Not started |
| 2 — Dynamic UI | Not started |

## Definition of done

Business modules supply only `ModuleDefinition(...)` and receive platform capabilities without modifying `platform/` core. See SDD §30.
