# EMCAP — Local environment (Windows)

One-page reference for **this machine** and **agent shells**. Canonical recipes: `docs/dev/recipes/run-emcap-local-stack.md`, `plan/11-local-dev-tooling.md`.

---

## Repository root

```
c:\Users\u1074139\workstation\Study\SDD
```

Run stack scripts from repo root only: `scripts\run-emcap.bat`.

---

## Flutter SDK (Windows)

| Item | Value |
|------|-------|
| Install path | `C:\Users\u1074139\flutter\flutter_windows_3.44.2-stable\flutter` |
| Bin (prepend to PATH) | `C:\Users\u1074139\flutter\flutter_windows_3.44.2-stable\flutter\bin` |
| Version | Flutter 3.44.2 stable / Dart 3.12.x |

**Agent shells do not inherit user PATH.** Prepend before every `flutter` command:

```powershell
$env:Path = "C:\Users\u1074139\flutter\flutter_windows_3.44.2-stable\flutter\bin;" + $env:Path
flutter --version
```

**Mobile verify (no `flutter run` required for CI parity):**

```powershell
cd clients\mobile
flutter pub get
flutter test --coverage
python ..\..\scripts\check-flutter-coverage.py --lcov coverage/lcov.info --min 80
```

**Interactive web dev:**

```powershell
$env:Path = "C:\Users\u1074139\flutter\flutter_windows_3.44.2-stable\flutter\bin;" + $env:Path
cd clients\mobile
flutter run -d chrome
```

Pitfalls: `docs/dev/known-pitfalls.md` § Flutter PATH, § Flutter widget test.

---

## API + web stack

| Check | Command |
|-------|---------|
| API health (8s timeout) | `node scripts/check-api-health.mjs` |
| Full stack (Docker) | `scripts\run-emcap.bat --stack-only` |
| Local SQLite (no Docker) | `scripts\run-emcap.bat --stack-only --local` |
| Stop | `scripts\stop-emcap.bat` |
| Web only (API already up) | `cd clients\web && npm start` → http://localhost:4200 |

Default API: http://localhost:8000 · Web: http://localhost:4200 · Flutter web (when running): dynamic port (see terminal).

---

## Other prerequisites

| Tool | Check |
|------|-------|
| Python 3.11+ | `python --version` |
| Node 20+ | `node --version` |
| Docker Desktop | Optional — `docker --version` |
| Git | Repo at `c:\Users\u1074139\workstation\Study\SDD` |

See also: `docs/dev/windows-local-dev.md` (batch/PowerShell quirks).

---

## Cursor / agent assets (in-repo)

| Path | Purpose |
|------|---------|
| `.cursor/rules/` | EMCAP project rules (always-on + glob-scoped) |
| `.cursor/skills/` | EMCAP domain skills — **use these**, not `~/.cursor/skills-cursor/` |
| `docs/dev/session-memos/` | In-repo session handoffs + `recall-index.md` |
| `docs/dev/HANDOFF-continue-standard-product.md` | New-chat entry point for standard product work |

User-global task summaries (`C:\Users\u1074139\.cursor\task-summaries\`) remain the default for **non-EMCAP** projects; EMCAP memos are mirrored under `docs/dev/session-memos/` when substantive.
