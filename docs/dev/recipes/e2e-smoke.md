# Recipe — Playwright E2E smoke (P18-T14)

Manual / scheduled smoke against a **running** local stack (login → PRODUCT CRUD + bulk delete → settings save → report schedule → admin users → LEAD list).

**Script:** `scripts/e2e-smoke.mjs`  
**CI:** `.github/workflows/e2e-smoke.yml` (weekly schedule + `workflow_dispatch`)  
**PR optional:** `.github/workflows/ci.yml` job `e2e-smoke-optional` (`continue-on-error: true` — does **not** block merge)

---

## Gate policy (P18-T14)

| Trigger | Job | Blocks merge? |
|---------|-----|----------------|
| PR → `main` / `develop` | `ci.yml` → `e2e-smoke-optional` | **No** — informational; fix failures before release when possible |
| Weekly Mon 03:00 UTC | `e2e-smoke.yml` | N/A (scheduled) |
| Manual | `workflow_dispatch` on `e2e-smoke.yml` | N/A |

**Rationale:** Full stack (uvicorn + `ng serve` + Playwright + seeded SQLite) is heavier than unit gates and can flake on runner timing. Weekly workflow is the **authoritative** smoke; PR job gives early signal without blocking agents when stack deps are unavailable locally.

**Fallback when Docker/stack unavailable locally:** Skip `node scripts/e2e-smoke.mjs`; rely on Karma contract tests + API pytest. Document skip in PR if touching entity/settings flows only.

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

## i18n audit (P18-T12)

```powershell
node scripts/audit-i18n.mjs
```

Reports likely hard-coded strings under `clients/web/src/app` and `clients/mobile/lib`. High-impact areas (login, account, admin, lookup picker, mobile admin bodies) should use `en.json` / `fr.json` / `bn.json` keys.

---

## Doc sync

When changing the script or workflow: update `plan/03-task-backlog.md` (P18-T14), `docs/dev/codebase-index.md`, `docs/dev/known-pitfalls.md` if new failure pattern.
