# Product demo runbook — Inventory → Products (EMCAP-P21-T02)

Stakeholder path for the **standard product** reference entity: `PRODUCT` under the Inventory module. Use this before M1 sign-off and for screenshot capture (P20-T02).

**Prerequisites:** `docs/dev/windows-local-dev.md` · demo seed enabled in `config/platform.yaml`

---

## 1. Start the stack

From repo root:

```bat
scripts\run-emcap.bat --stack-only --local
```

Or with Docker (Postgres):

```bat
scripts\run-emcap.bat --stack-only
```

Wait for:

- API: `http://localhost:8000/api/v1/health` → 200
- Web: `http://localhost:4200`

**If admin or entity routes 404:** restart API (stale uvicorn) — see `known-pitfalls.md` Phase 16.

---

## 2. Seed data

Demo packs load on API startup when `seed.demo.enabled: true`.

| Pack | Path | PRODUCT rows |
|------|------|--------------|
| Demo products | `data/seed/demo/products.json` | 20 catalog items |

Re-apply after editing JSON (Postgres / fresh DB):

```bat
python scripts\apply-seed.py
```

SQLite local mode: restart API after seed file changes, or delete `emcap-local.db` and restart.

**Login:** `admin` / `admin123` · tenant `default` · theme light (toggle for dark screenshot).

---

## 3. Demo script (~5 minutes)

| Step | Action | What to show |
|------|--------|--------------|
| 1 | Open web → sign in | Enterprise shell, module-grouped nav |
| 2 | **Inventory → Products** | Grid with 20 SKUs; search e.g. `SKU-ELC` or `Monitor` |
| 3 | Select a row (e.g. `SKU-ELC-2001`) | Hero: `SKU — Name`; active chip; price/qty subtitle |
| 4 | Scroll form | Business section vs muted **System** card (`created_at`, `version`) |
| 5 | Edit unit price → **Save** | Optimistic concurrency via `record_version` / `If-Match` |
| 6 | **Export** CSV from grid toolbar | Metadata-driven export |
| 7 | Open **Notes** / **Documents** / **Audit** tabs | Platform services on record |
| 8 | (Optional) Start **Stock adjustment** workflow | Workflow inbox after submit |
| 9 | Reports → **Low stock** or **Inventory valuation** | Module reports on PRODUCT data |
| 10 | Toggle **dark theme** + locale FR | i18n + theme persistence |

**Mobile parity (M2):** repeat steps 2–4 on Flutter app with same tenant and seed.

---

## 4. API spot-checks (optional)

```powershell
curl.exe -s http://localhost:8000/api/v1/health

# After login, use Bearer token from browser or:
curl.exe -s -H "Authorization: Bearer <token>" -H "X-Tenant-ID: default" ^
  "http://localhost:8000/api/v1/entities/PRODUCT/records?q=Monitor"
```

Metadata:

- `GET /api/v1/metadata/grids/PRODUCT`
- `GET /api/v1/metadata/forms/PRODUCT`

---

## 5. Screenshot capture

Follow `docs/product/screenshots/README.md`. Minimum M1 pack at **1280×800**:

1. `phase15-product-grid-polish.png`
2. `phase15-product-detail-hero.png`
3. `phase14-product-detail-system-card.png`
4. Dark variant or `phase15-product-detail-hero-dark.png`

---

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Empty product grid | `seed.demo.enabled: true`; run `apply-seed.py` or restart API |
| Only 2 products | Old DB; re-seed or use updated `products.json` (20 rows) |
| Save fails “version conflict” | Reload record; another tab changed `record_version` (409) |
| Deleted row missing from list | Soft delete — expected; use restore API or UI when wired |
| `sqlalchemy... no such column` | SQLite drift — delete `emcap-local.db`, restart |

Full pitfall index: `docs/dev/known-pitfalls.md` (Phase 11 local dev, Phase 16 entity platform).

---

## 7. Related docs

| Doc | Purpose |
|-----|---------|
| `plan/16-standard-product-system.md` | Milestones M1–M5 |
| `plan/16-product-ready-dod.md` | Product-ready checklist |
| `docs/modules/inventory-definition-of-done-v2.md` | Module product criteria |
| `data/seed/README.md` | Seed pack layout |
