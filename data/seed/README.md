# EMCAP seed data

JSON packs loaded on API startup (and via `scripts/apply-seed.py`) per `config/platform.yaml`.

## Layout

| Pack | Path | Purpose |
|------|------|---------|
| Core | `data/seed/core/` | Production baseline roles and users |
| Demo | `data/seed/demo/` | Sample business records (optional) |

## Configuration

```yaml
seed:
  core:
    enabled: true
    path: data/seed/core
  demo:
    enabled: true
    path: data/seed/demo
    remove_when_disabled: true
```

- `seed.demo.enabled: false` — skip demo inserts on startup.
- `seed.demo.remove_when_disabled: true` — delete entity records whose `id` appears in demo JSON when demo is disabled.

## Core JSON (`roles.json`, `users.json`)

**roles.json**

```json
{
  "version": 1,
  "roles": [
    { "code": "admin", "name": "Administrator", "permissions": ["*.*"] }
  ]
}
```

**users.json** — use `password` for dev only; production should use `password_hash` (PBKDF2 from `emcap.auth.service`).

```json
{
  "version": 1,
  "users": [
    {
      "username": "admin",
      "password": "admin123",
      "tenant_id": "default",
      "roles": ["admin"],
      "attributes": { "department": "platform" }
    }
  ]
}
```

## Demo JSON (per entity file)

Stable `id` values allow copy/paste and safe re-apply. IDs listed here are removed when demo is disabled.

```json
{
  "version": 1,
  "seed_tag": "demo",
  "entity_records": [
    {
      "id": "11111111-1111-4111-8111-111111111101",
      "entity_code": "PRODUCT",
      "tenant_id": "default",
      "data": {
        "sku": "SKU-DEMO-001",
        "name": "Demo Widget",
        "unit_price": 12.5,
        "quantity_on_hand": 50,
        "reorder_level": 5,
        "active": true
      }
    }
  ]
}
```

Copy any file to add records; restart API or run `python scripts/apply-seed.py`.
