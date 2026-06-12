# EMCAP — Enterprise Multi-Tenant Core Application Platform

Software design and implementation workspace for EMCAP (SDD v1.0).

## Quick start

**Windows (tests + stack + seed + web):**

```bat
scripts\run-emcap.bat
```

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
├── spec/sdd/              # Requirements, ADRs, traceability
├── plan/                  # Implementation playbooks
├── platform/api/          # FastAPI platform core
├── modules/               # Business plug-ins
├── clients/web/           # Angular CLI 19 web client (SDD §9)
├── clients/web-legacy/    # Archived Vite shell (reference)
├── clients/mobile/        # Flutter mobile client
├── infra/                 # Docker, Terraform, Helm, Ansible
└── .cursor/               # Agent skills and rules
```

## Key documents

| Document | Path |
|----------|------|
| Angular web ADR | `spec/sdd/adrs/005-angular-cli-web-client.md` |
| Phase 10 playbook | `plan/10-angular-cli-web.md` |
| End-user UX matrix | `spec/sdd/05-end-user-matrix.md` |
| Codebase index | `docs/dev/codebase-index.md` |
| Pitfalls | `docs/dev/known-pitfalls.md` |

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

Business modules supply only `ModuleDefinition(...)` — no edits to `platform/` core. See SDD §30.
