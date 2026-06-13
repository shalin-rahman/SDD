# Phase 12F Slice 5 — Integrations registry

## Goal
P12F-T30–T36: admin integrations registry API + settings UI (web + mobile); Account page demoted to ad-hoc tests.

## Constraints
- No commit before user review.
- Follow payment-secrets pattern for masked webhook signing secret.

## What changed
- **Config:** `IntegrationsSettings` (rest, kafka, soap); `config/platform.yaml` integrations block.
- **Backend:** `integrations_service.py` — GET/PUT paths, masked `integrations.webhook.signing_secret`, URL/Kafka validation, audit; routes `GET/PUT /admin/integrations`, `POST /admin/integrations/test-rest`.
- **Tests:** `test_admin_integrations_registry` — 8/8 admin tests pass.
- **Web:** Settings Integrations panel; client methods; Account integrations hint + i18n.
- **Mobile:** Settings integrations ExpansionTile; client methods; Account hint; i18n EN/FR/BN synced.
- **Docs:** backlog P12F-T30/T34, P12C-T11 Done; plan slice 5 marked complete.

## Verification
```powershell
cd platform/api
python -m pytest tests/test_admin_api.py -q   # 8 passed
```

## Open follow-ups (dependency order)
- Slice 6: Security policy viewer (P12F-T40–T46)
- Slice 7: Mobile rail module headers (P12F-T50–T53)
- Slice 8: Matrix rev. 6 + traceability
- T12 i18n tail (settings section titles still English on web)
