#!/usr/bin/env bash
# Run ALL web (Karma) + mobile (Flutter) automated tests with NFR-003 coverage gates.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ONLY=false
MOBILE_ONLY=false
SKIP_COVERAGE=false

for arg in "$@"; do
  case "$arg" in
    --web-only) WEB_ONLY=true ;;
    --mobile-only) MOBILE_ONLY=true ;;
    --skip-coverage) SKIP_COVERAGE=true ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

run_web() {
  echo "[verify-clients] Web Karma (ChromeHeadless)..."
  cd "$REPO_ROOT/clients/web"
  npm run test:ci
  if [[ "$SKIP_COVERAGE" == false ]]; then
    echo "[verify-clients] Web branch coverage gate..."
    npm run test:coverage
  fi
}

run_mobile() {
  if ! command -v flutter >/dev/null 2>&1; then
    echo "[verify-clients] SKIP mobile: Flutter SDK not on PATH."
    return 1
  fi
  echo "[verify-clients] Mobile Flutter tests..."
  cd "$REPO_ROOT/clients/mobile"
  flutter pub get
  if [[ "$SKIP_COVERAGE" == true ]]; then
    flutter test
  else
    flutter test --coverage
    python "$REPO_ROOT/scripts/check-flutter-coverage.py" --lcov coverage/lcov.info --min 80
  fi
}

if [[ "$MOBILE_ONLY" == false ]]; then
  run_web
fi

if [[ "$WEB_ONLY" == false ]]; then
  if ! run_mobile; then
    if [[ "$MOBILE_ONLY" == true ]]; then
      exit 1
    fi
  fi
fi

echo "[verify-clients] OK"
