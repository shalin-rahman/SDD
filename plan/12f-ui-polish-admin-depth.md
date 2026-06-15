# Phase 12F — UI polish, full i18n (incl. Bangla), admin depth

**Status:** Done — Phase 12F complete 2026-06-12  
**Driver:** Phase 12A–D shipped core shell/admin; five honest gaps remain on web and mobile.  
**Depends on:** Phase 12A–D (Done/Partial) · `plan/12-enterprise-product-ui.md`  
**Matrix:** `spec/sdd/06-admin-product-ui-matrix.md`  
**DoD:** `plan/12-phase12-dod-checklist.md`

---

## Scope summary

| Gap | Web today | Mobile today | Target (both clients) |
|-----|-----------|--------------|------------------------|
| Theme/locale persistence | Theme + locale in `localStorage` | `shared_preferences` (P12F-T01) | Same keys, same UX; survives restart |
| Full i18n | JSON bundles EN/FR/BN; shell/admin/settings/entity | Same key IDs | Platform page strings still Partial |
| Payment secrets UI | Provider + publishable key + masked secret rotate | Same | Masked secret fields + rotate placeholder; never raw GET |
| Integrations registry | Settings REST/Kafka/SOAP + masked webhook secret | Same | Settings registry: list/edit endpoints (REST base URL, Kafka topic prefix, …) |
| Row/field security viewer | Admin security page (read-only) | Same | Read-only policy viewer from entity definitions |
| Rail module headers | N/A (sidenav groups) | Rail + drawer module headers (P12F-T50) | Rail shows module section headers (tablet) |

**Out of scope (Phase 13):** ABAC policy *editor*, payment PCI vault, runtime module install, layout designer.

---

## Architecture decisions

| Concern | Decision |
|---------|----------|
| Preference storage (web) | Keep `localStorage` keys `emcap-theme`, `emcap-locale` — already wired |
| Preference storage (mobile) | `shared_preferences` (or `flutter_secure_storage` only if we later store tokens there) |
| i18n source of truth | JSON bundles per locale under `clients/web/src/assets/i18n/` and `clients/mobile/assets/i18n/` |
| Locale codes | `en`, `fr`, `bn` (Bangla); BCP-47 `bn-BD` optional later for date/number formatting |
| Metadata labels | Continue `label_key` / entity `i18n` maps; pass active locale into form/grid renderers |
| Payment secrets | Extend admin settings API with allowlisted paths; GET returns `***` + `configured: true`; PUT accepts new value |
| Integrations registry | New admin read/write API over YAML subset + DB overrides (mirror settings pattern) |
| Row/field viewer | New `GET /api/v1/admin/security/policies` aggregating registered entities (platform API) |
| Parity rule | Every new admin API method → web client + dart client + pytest + matrix row in same PR slice |

---

## Workstream 1 — Theme & locale persistence

### Current state
- **Web:** `ThemeService` and `I18nService` already persist to `localStorage` on change.
- **Mobile:** `EmcapTheme.themeMode` and `EmcapLocale.locale` are in-memory only.

### Tasks

| ID | Task | Web | Mobile |
|----|------|-----|--------|
| P12F-T01 | Add `shared_preferences`; load/save theme + locale on app start | Verify init order in `app.component` | `main.dart` + services |
| P12F-T02 | Unify storage key names (`emcap-theme`, `emcap-locale`) | Document in shared README | Same keys for cross-device QA consistency |
| P12F-T03 | Respect system theme when unset (`ThemeMode.system` on mobile) | Optional: `prefers-color-scheme` default | Match Material guidance |
| P12F-T04 | Unit/widget tests for persistence round-trip | Extend `theme.service.spec.ts` | `preferences_service_test.dart` |

### Acceptance
- Set dark + Bangla → kill app → relaunch → still dark + Bangla (web refresh / mobile cold start).
- Matrix row **Theme picker** → Done (mobile), **App UI i18n** partial unchanged until Workstream 2.

---

## Workstream 2 — Full i18n + Bangla (bn)

### Strategy

1. **Extract** all user-visible chrome strings from components into keyed bundles (not inline English).
2. **Organize** keys by area: `nav.*`, `toolbar.*`, `admin.*`, `settings.*`, `entity.*`, `common.*`.
3. **Ship locales:** `en.json`, `fr.json`, `bn.json` (Bangla translations — professional review recommended for production).
4. **Wire renderers:** `DynamicFormRenderer` / `DynamicGridRenderer` receive active locale from a shared `LocaleService` / `I18nService` (web already has hook; mobile passes locale into metadata resolvers).
5. **Fallback chain:** `bn` → `en` → key name (never blank UI).

### Bangla-specific notes
- Bangla is **LTR**; no RTL layout flip required (unlike Arabic).
- Font: ensure Material / system fonts render Bengali script; add `Noto Sans Bengali` to web `index.html` and mobile `pubspec` fonts if system fallback is poor on test devices.
- Date/number: use `Intl` / `flutter_localizations` with locale `bn`; audit date pickers when added.
- Metadata: add sample `i18n.bn` entries in one entity fixture (e.g. PRODUCT form/grid) to prove end-to-end.

### Page inventory (must use `t()` / bundle)

| Area | Web files | Mobile files |
|------|-----------|--------------|
| Shell chrome | `app-layout.component.*`, `shell-nav.util` labels | `shell.dart` |
| Entity | `entity-list.component.*`, `entity-record.component.*` | `entity_list_screen.dart`, `entity_record_screen.dart` |
| Admin | users, roles, permissions pages | `admin_*_screen.dart` |
| Settings | `settings.component.*` | `settings_screen.dart` |
| Account / workflow / reports | remaining page titles + actions | matching `*_screen.dart` |

### Tasks

| ID | Task | Web | Mobile |
|----|------|-----|--------|
| P12F-T10 | Create `assets/i18n/{en,fr,bn}.json` + loader service | Replace inline `BUNDLES` in `i18n.service.ts` | Replace `EmcapLocale.t` maps with JSON load |
| P12F-T11 | Locale switcher: EN / FR / **বাংলা** | Update `app-layout` select | Update shell `PopupMenuButton` |
| P12F-T12 | Migrate shell + admin + settings strings | ~80–120 keys | Same key IDs for parity |
| P12F-T13 | Migrate entity + platform page strings | entity, workflow, account, … | all `app/*_screen.dart` | **Done** (12G) |
| P12F-T14 | Pass locale into metadata renderers | form/grid renderer constructors | `metadata_contract.dart` |
| P12F-T15 | Contract test: required i18n keys exist in all locales | Karma spec | Dart test compares key sets |
| P12F-T16 | Sample entity metadata `bn` labels in API fixture | `product.form.keys.json` | same fixture consumed by mobile tests |

### Acceptance
- Switch to Bangla: shell sign-out, settings title, admin “Save”, entity “New record” show Bengali.
- Missing `bn` key falls back to English with dev-only console warning (optional).
- Matrix **App UI i18n** → Partial → **Done** when inventory complete.

---

## Workstream 3 — Payment secrets UI (masked)

### Backend (platform API — admin domain)

| ID | Task |
|----|------|
| P12F-T20 | Extend `config/platform.yaml` schema: `payments.providers.stripe.{enabled, publishable_key, secret_key_ref}` (or flat `payments.stripe_secret` for v1) |
| P12F-T21 | Add allowlisted paths to `settings_service.ALLOWED_SETTING_PATHS`: `payments.provider`, `payments.stripe.publishable_key`; secret path write-only |
| P12F-T22 | GET settings: secret fields return `{ "masked": "••••••••", "configured": true }` never plaintext |
| P12F-T23 | PUT settings: accept secret rotation; audit log `settings.update` without logging secret value |
| P12F-T24 | pytest: GET never contains secret substring; PUT + audit |

### Frontend (web + mobile)

| ID | Task | Web | Mobile |
|----|------|-----|--------|
| P12F-T25 | Settings **Payments** section: provider select, publishable key, secret (password field + “Replace secret”) | `settings.component` | `settings_screen.dart` |
| P12F-T26 | Show configured/masked state; disable save if payments module off | toggle gate | same |
| P12F-T27 | Client API types for masked secret shape | `emcap-client.ts` | `emcap_client.dart` |

### Acceptance
- Admin can enable payments + set publishable key + rotate secret via UI.
- Network tab / mobile log never shows full secret on GET.
- Matrix **Payment gateway config UI** → Partial → **Done** (config only, not PCI vault).

---

## Workstream 4 — Integrations registry UI

### Backend

| ID | Task |
|----|------|
| P12F-T30 | Define integration registry model in platform config: `integrations.rest.base_url`, `integrations.kafka.bootstrap`, `integrations.webhook.signing_secret` (masked) |
| P12F-T31 | `GET/PUT /api/v1/admin/integrations` (or extend `/admin/settings` with nested `integrations.*` allowlist) |
| P12F-T32 | Link registry entries to existing dispatch adapters (read-only validation: URL format, topic non-empty) |
| P12F-T33 | pytest + audit on change |

### Frontend (web + mobile)

| ID | Task | Web | Mobile |
|----|------|-----|--------|
| P12F-T34 | Settings **Integrations** expansion: REST, Kafka, SOAP endpoint fields | new settings section | same |
| P12F-T35 | Test connection button (calls existing `/integrations/rest/dispatch` health or dry-run) | optional v1 | optional v1 |
| P12F-T36 | Deprecate “integrations only in Account” — keep demo as **Test** action | account page copy | account screen copy |

### Acceptance
- Ops can point REST base URL from settings without YAML edit.
- Matrix **Integration registry admin** → Done.

---

## Workstream 5 — Row/field security viewer (read-only)

### Backend

| ID | Task |
|----|------|
| P12F-T40 | `GET /api/v1/admin/security/policies` → `{ entities: [{ code, fields: [{ name, read_roles }], row_access: "tenant" \| "permission" }] }` |
| P12F-T41 | Aggregate from `EntityDefinition` registry + `can_access_record` / `apply_field_security` rules (document in response) |
| P12F-T42 | Permission: `admin.security.read` seed in `roles.json` |
| P12F-T43 | pytest snapshot for PRODUCT entity |

### Frontend (web + mobile)

| ID | Task | Web | Mobile |
|----|------|-----|--------|
| P12F-T44 | Admin route `/app/admin/security` (or tab under Permissions) | master–detail or table | `admin_security_screen.dart` |
| P12F-T45 | Entity picker → field matrix (field × read_roles) + row rule summary | read-only | read-only |
| P12F-T46 | i18n keys for security viewer | bn/fr/en bundles | same |

### Acceptance
- Admin sees which fields are restricted for PRODUCT (and other entities).
- No edit controls (Phase 13 ABAC builder).
- Matrix **Row/field security admin** → Partial (viewer only).

---

## Workstream 6 — Mobile rail module group headers

| ID | Task |
|----|------|
| P12F-T50 | Split rail into `NavigationRail` destinations for platform links + `NavigationDrawer` sections OR custom rail with `NavigationRailLabel` group spacers |
| P12F-T51 | Reuse `ModuleNavGroup` from `shell_nav_util.dart`; insert non-selectable header entries between groups |
| P12F-T52 | Widget test: wide layout renders module labels before entity destinations |
| P12F-T53 | Keep drawer behavior unchanged on narrow screens |

### Acceptance
- Tablet rail shows **Inventory**, **CRM**, etc. headers above entity icons (matches web sidenav grouping).
- Matrix **Module-grouped navigation** mobile → **Done**.

---

## Implementation order (PR slices)

Recommended sequence — each slice updates matrix + backlog + clients together:

```
Slice 1 — P12F-T01–T04     Mobile preference persistence (+ web verify)
Slice 2 — P12F-T10–T12     i18n infrastructure + shell/admin/settings (EN/FR/BN)
Slice 3 — P12F-T13–T16     Entity + platform pages + metadata bn sample
Slice 4 — P12F-T20–T27     Payment secrets API + settings UI (web + mobile) ✅
Slice 5 — P12F-T30–T36     Integrations registry API + settings UI ✅
Slice 6 — P12F-T40–T46     Security policy viewer (web + mobile) ✅
Slice 7 — P12F-T50–T53     Mobile rail group headers ✅
Slice 8 — P12E doc sync     Traceability FR-007 (i18n), matrix rev. 6, recipe update ✅
```

**Parallelism:** Slice 2 can start before Slice 1 if different owners; Slices 4–6 need backend first.

---

## Verification (every slice)

```bat
scripts\lint-format.bat
cd platform\api && python -m pytest -q --cov=src --cov-fail-under=80
cd clients\web && npm run build && npm run test:ci
cd clients\mobile && flutter pub get && flutter analyze && flutter test
```

### Manual smoke (additions)

| Step | Web | Mobile |
|------|-----|--------|
| Persistence | Dark + BN → hard refresh → unchanged | Dark + BN → force-stop → relaunch |
| Bangla | Shell + settings + admin save label in Bengali | Same |
| Payment secret | Set secret → GET shows masked → rotate | Same |
| Integrations | Change REST base → test dispatch | Same |
| Security viewer | Open admin security → PRODUCT field roles visible | Same |
| Rail groups | N/A | Tablet width → module headers on rail |

---

## Traceability & docs (Slice 8)

| Artifact | Update |
|----------|--------|
| `spec/sdd/06-admin-product-ui-matrix.md` | Rev. 6 — close gaps listed in scope table |
| `spec/sdd/03-traceability-matrix.md` | FR-007 (i18n), FR-014 (integrations), FR-015 (payments), FR-002 (security viewer) |
| `plan/03-task-backlog.md` | P12F-T01–T53 rows |
| `plan/12-enterprise-product-ui.md` | Link Phase 12F section |
| `clients/web/src/app/shared/README.md` | i18n JSON + preference keys |
| `clients/mobile/README.md` | shared_preferences + assets/i18n |
| `docs/dev/recipes/enterprise-ui-shell.md` | Bangla + persistence smoke steps |

---

## Effort estimate (rough)

| Workstream | Backend | Web | Mobile | Total |
|------------|---------|-----|--------|-------|
| 1 Persistence | — | 0.5d | 1d | 1.5d |
| 2 i18n + Bangla | 0.5d fixtures | 3d | 3d | 6.5d |
| 3 Payment secrets | 2d | 1d | 1d | 4d |
| 4 Integrations registry | 2d | 1.5d | 1.5d | 5d |
| 5 Security viewer | 1.5d | 1d | 1d | 3.5d |
| 6 Rail headers | — | — | 1d | 1d |
| **Total** | **6d** | **7d** | **8.5d** | **~21.5d** |

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Bangla translation quality | Start with machine draft + native review checklist; mark `bn` Partial until reviewed |
| Secret leakage in logs/audit | Code review gate; pytest asserts no secret in audit payload |
| i18n key drift web/mobile | Shared key manifest `spec/i18n/emcap-ui-keys.json` validated by both test suites |
| Rail UX clutter | Collapse entity labels to icons only; show module header as small caps divider |
| Scope creep into ABAC editor | Viewer read-only only; editor stays Phase 13 |

---

## Related backlog IDs (existing → superseded by 12F)

| Old ID | 12F mapping |
|--------|-------------|
| P12A-T07 (i18n JSON) | P12F-T10–T16 |
| P12B-T08 (row/field viewer) | P12F-T40–T46 |
| P12C-T05 (payment secrets) | P12F-T20–T27 |
| P12C-T11 (integrations registry) | P12F-T30–T36 |
| P12D-T03 (mobile theme/locale) | P12F-T01–T04 + T10–T11 |
