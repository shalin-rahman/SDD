#!/usr/bin/env bash
# Lint and format checks (no auto-fix). Mirrors scripts/lint-format.bat.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$REPO_ROOT/platform/api"

cd "$API_DIR"
if ! python -m ruff --version >/dev/null 2>&1; then
  echo "[python-dev] Installing platform/api dev dependencies..."
  python -m pip install -e ".[dev]"
fi

echo "[lint-format] Python - ruff, black, mypy..."
python -m ruff check src tests
python -m black --check src tests
python -m mypy src

echo "[lint-format] Web - prettier, eslint..."
cd "$REPO_ROOT/clients/web"
npm run format:check
npm run lint

if command -v flutter >/dev/null 2>&1; then
  echo "[lint-format] Mobile - dart format, flutter analyze..."
  cd "$REPO_ROOT/clients/mobile"
  dart format --output=none --set-exit-if-changed .
  flutter analyze
else
  echo "[lint-format] Flutter SDK not on PATH - skipping mobile lint/format."
fi

echo "[lint-format] OK"
