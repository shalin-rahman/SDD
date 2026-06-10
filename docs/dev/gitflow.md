# GitFlow — EMCAP

Per SDD §24 (NFR-011).

## Branches

| Branch | Created from | Merged to | Purpose |
|--------|--------------|-----------|---------|
| `main` | — | — | Production-ready releases |
| `develop` | `main` | — | Daily integration |
| `feature/*` | `develop` | `develop` | New work |
| `release/*` | `develop` | `main` + `develop` | Release prep |
| `hotfix/*` | `main` | `main` + `develop` | Urgent production fixes |

## Workflow

1. Branch `feature/EMCAP-Px-Tyy-short-desc` from `develop`.
2. Open PR to `develop`; CI must pass (lint, tests).
3. For releases: `release/x.y.z` from `develop`, stabilize, merge to `main` (tag) and back to `develop`.
4. Hotfixes: `hotfix/x.y.z` from `main`, merge to both `main` and `develop`.

## Commit messages

```
type(scope): short summary

Optional body explaining why.
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

## Branch protection (P0-T05)

After the repo is on GitHub with `main` and `develop`:

1. Push both branches and open a test PR so CI status checks register once.
2. Run from repo root (requires [GitHub CLI](https://cli.github.com/) `gh auth login`):

```bash
# Linux / macOS / Git Bash
./scripts/setup-branch-protection.sh

# Windows PowerShell
.\scripts\setup-branch-protection.ps1
```

Or set rules manually under **Settings → Branches**:

| Branch | Rules |
|--------|-------|
| `main` | Require PR, 1 approval, CI jobs green, no force push |
| `develop` | Require PR, CI jobs green, no force push |

Required CI contexts: `backend`, `integration`, `security-dependencies`, `security-sast`, `client-lint-web`, `client-lint-mobile`.
