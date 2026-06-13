# Phase 12F Slice 4 — Payment secrets (masked)

## Goal
P12F-T20–T27: masked payment secret GET/PUT, audit without plaintext, web + mobile settings UI.

## Constraints
- No commit before user review.
- Platform admin API change (settings domain) — not business module code.

## What changed
- **Backend:** `PaymentsSettings` + `StripePaymentSettings`; `config/platform.yaml` `payments.provider` / `stripe.publishable_key`; `settings_service.py` write-only `payments.stripe.secret_key`, masked GET, redacted audit, `write_only_paths` in response.
- **Tests:** `test_admin_payment_secret_masked` in `test_admin_api.py` (7/7 admin tests pass).
- **Web:** Payments panel — provider select, publishable key, password rotate; `MaskedSecretView` / `AdminSettingsResponse` types; i18n EN/FR/BN.
- **Mobile:** Same UX in `settings_screen.dart`; `MaskedSecretView` in `emcap_client.dart`; i18n bundles synced.
- **Docs:** `plan/03-task-backlog.md`, `plan/12f-ui-polish-admin-depth.md` Slice 4 marked Done.

## Verification
```powershell
cd platform/api
python -m pytest tests/test_admin_api.py -q   # 7 passed
```

## Open follow-ups
- Slice 5: Integrations registry (P12F-T30–T37).
- Slice 6–8: security viewer, mobile rail headers, matrix rev. 6.
- Run `flutter analyze && flutter test` locally (Flutter not on agent PATH).
