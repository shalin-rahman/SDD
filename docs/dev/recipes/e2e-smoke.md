# Recipe — Playwright E2E smoke (P18-T14)

Manual / scheduled smoke against a **running** local stack (login → PRODUCT CRUD → settings save → LEAD list).

**Script:** `scripts/e2e-smoke.mjs`  
**CI:** `.github/workflows/e2e-smoke.yml` (`workflow_dispatch` + weekly schedule)

---

## Prereq

1. Start stack (API `:8000`, web `:4200`):

   ```powershell
   scripts\start-emcap-local.bat
   ```

   Or `--local` SQLite via `scripts\run-emcap.bat --stack-only --local --skip-tests --skip-lint`.

2. Install Playwright Chromium once:

   ```powershell
   npx --yes playwright@1.49.1 install chromium
   ```

---

## Run

```powershell
cd C:\Users\u1074139\workstation\Study\SDD
node scripts/e2e-smoke.mjs
```

Optional env:

| Var | Default |
|-----|---------|
| `EMCAP_WEB_URL` | `http://localhost:4200` |
| `EMCAP_API_URL` | `http://localhost:8000` |

---

## Verify

- Exit code `0` and `E2E smoke passed.` on stdout.
- On failure: check API health, seed data (PRODUCT rows), and that login uses `admin` / `admin123`.

---

## Doc sync

When changing the script or workflow: update `plan/03-task-backlog.md` (P18-T14), `docs/dev/codebase-index.md`, `docs/dev/known-pitfalls.md` if new failure pattern.
