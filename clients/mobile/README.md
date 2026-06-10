# Flutter mobile client

Metadata-driven UI thin client shell aligned with **SDD §9 Dynamic UI Platform**. The Flutter renderer consumes the same backend form/grid metadata contract as the Angular web client (`lib/metadata_contract.dart` mirrors `clients/web/src/metadata/contract.ts`).

## SDD §9 scope

| SDD capability | Mobile shell status |
|----------------|---------------------|
| Dynamic forms from metadata | `EntityScreen` renders fields from `/api/v1/metadata/forms/{entity}` |
| Dynamic grid from metadata | `DataTable` columns from `/api/v1/metadata/grids/{entity}` |
| Offline sync snapshot | Displays `sync_version` from `/api/v1/sync/{entity}/snapshot` |
| Auth + tenant context | Login → Bearer token + `X-Tenant-ID` on all requests |
| Menu-driven navigation | `NavigationRail` from `/api/v1/menus` |
| Notes API | `EmcapClient.listNotes` / `addNote` (parity with web client) |
| Workflow instances | `EmcapClient.listWorkflowInstances` (parity with web client) |
| Record CRUD | `listRecords`, `getRecord`, `createRecord`, `updateRecord`, `deleteRecord` |

Future React/desktop renderers share the same metadata endpoints; this project is the Flutter presentation slice only.

## Structure

| Path | Role |
|------|------|
| `lib/main.dart` | App entry; `EMCAP_API_URL` compile-time define |
| `lib/api/emcap_client.dart` | Auth, menus, CRUD (list/get/create/update/delete), sync, notes, workflows |
| `lib/app/shell.dart` | Login screen + navigation rail |
| `lib/app/entity_screen.dart` | Metadata grid + create form (controllers per field) |
| `lib/metadata_contract.dart` | Form/grid validators and render helpers |
| `analysis_options.yaml` | `flutter_lints` + analyzer excludes |

## Prerequisites

- Flutter SDK 3.5+ (`flutter doctor`)
- EMCAP API running (default `http://localhost:8000`; e.g. `docker compose up` from repo root)

## Setup and quality

```bash
cd clients/mobile
flutter pub get
flutter analyze
```

`flutter analyze` uses `analysis_options.yaml` (`package:flutter_lints/flutter.yaml`, `prefer_const_constructors`, `avoid_print`). Fix any reported issues before opening a PR (NFR-012 / NFR-013).

## Run

```bash
flutter run --dart-define=EMCAP_API_URL=http://localhost:8000
```

| Target | `EMCAP_API_URL` hint |
|--------|----------------------|
| Chrome (web) | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` (host loopback) |
| Physical device | Your machine LAN IP, e.g. `http://192.168.1.10:8000` |

Example:

```bash
flutter run -d chrome --dart-define=EMCAP_API_URL=http://localhost:8000
flutter run -d windows --dart-define=EMCAP_API_URL=http://localhost:8000
```

Default credentials in the login scaffold: `admin` / `admin123` (override in `shell.dart` for local testing).

API must allow CORS when using `flutter run -d chrome`.
