# M2 PRODUCT mobile screenshot pack (P15-T13 / P20-T03)

Evidence for **M2** in `plan/16-product-ready-dod.md` and `spec/sdd/07-product-readiness-matrix.md`.

**Prereq:** Flutter SDK on PATH · local API stack · demo seed on.

---

## 1. Install Flutter (Windows)

If `where flutter` returns nothing:

1. Download stable SDK: https://docs.flutter.dev/get-started/install/windows
2. Extract (e.g. `C:\src\flutter`) and add `C:\src\flutter\bin` to user **PATH**
3. Restart terminal; verify:

```powershell
flutter --version
flutter doctor
```

Optional: Android Studio + emulator, or use Chrome:

```powershell
flutter devices
```

---

## 2. Start EMCAP stack

From repo root (PowerShell 5.x — use `;` not `&&`):

```bat
scripts\run-emcap.bat --stack-only --local
```

Login defaults: `admin` / `admin123` · tenant `default`.

Health check:

```powershell
curl.exe http://localhost:8000/api/v1/health
```

---

## 3. Unit tests (no device)

```powershell
cd clients\mobile
flutter pub get
flutter analyze
flutter test test\theme_tokens_test.dart test\emcap_badge_test.dart test\entity_record_hero_test.dart
flutter test test\metadata_contract_test.dart test\crm_entity_contract_test.dart test\entity_list_bulk_test.dart
flutter test test\account_screen_test.dart test\entity_platform_mobile_test.dart test\entity_record_movement_test.dart
flutter test test\record_lifecycle_util_test.dart test\document_preview_util_test.dart test\mobile_sse_grid_test.dart
```

Full suite:

```powershell
flutter test
```

---

## 4. Run mobile app

**Chrome (fastest on Windows):**

```powershell
cd clients\mobile
flutter run -d chrome --dart-define=EMCAP_API_URL=http://localhost:8000
```

**Android emulator** (API on host):

```powershell
flutter run --dart-define=EMCAP_API_URL=http://10.0.2.2:8000
```

**Physical device** (replace with your LAN IP):

```powershell
flutter run --dart-define=EMCAP_API_URL=http://192.168.x.x:8000
```

---

## 5. Manual capture — `phase15-mobile-product-detail.png`

Target path (stable filename):

```
docs/product/screenshots/phase15-mobile-product-detail.png
```

| Setting | Value |
|---------|--------|
| Viewport | ~390×844 (phone) or device frame |
| Theme | Light, EN locale (default) |
| Entity | Inventory → **Products** (`PRODUCT`) |
| Row | First demo row (e.g. `SKU-DEMO-001`) |

**UX checklist (M2 gate):**

- [ ] Detail hero shows `SKU — Name` (em dash) when both fields present
- [ ] Active / Inactive **Chip** visible on existing record
- [ ] Header actions present (Edit, Delete, or Restore as applicable)
- [ ] Grid shows formatted datetimes (not raw ISO) when scrolling list
- [ ] Optional: tap **Edit** → system section label + read-only system fields visible

Capture: OS screenshot tool, emulator screenshot, or Chrome DevTools device toolbar → save as PNG above.

**Do not** commit secrets or real customer data.

---

## 6. Automated capture (optional)

Skeleton integration test (complete when SDK available):

```powershell
cd clients\mobile
flutter test integration_test\m2_product_detail_test.dart -d chrome
```

Or driver + screenshot binding:

```powershell
flutter drive --driver=test_driver\integration_test.dart --target=integration_test\m2_product_detail_test.dart -d chrome
```

Copy output from test binding to `docs/product/screenshots/phase15-mobile-product-detail.png`.

---

## 7. Close M2 tasks

After PNG is in repo:

1. Mark **EMCAP-P15-T13** and **EMCAP-P20-T03** Done in `plan/03-task-backlog.md`
2. Sign M2 mobile row in `spec/sdd/07-product-readiness-matrix.md`
3. Update `plan/15-entity-page-redesign.md` P15-T13 status

**Related:** `docs/product/screenshots/README.md` · `clients/mobile/lib/app/entity_list_screen.dart` · `plan/17-standard-product-execution-playbook.md` § S2

---

## M6 note (2026-06-17)

Mobile **login** (provider chips, session-expiry banner) and **account** (integrations removed — settings hint only) are covered by `clients/mobile/test/login_screen_test.dart` without device PNG. Capture optional: `phase18-mobile-login-providers.png` after Flutter SDK install.
