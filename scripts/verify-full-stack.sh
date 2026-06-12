#!/usr/bin/env bash
# Full-stack smoke: platform tests, web lint/test, optional API health.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${EMCAP_API_URL:-http://localhost:8000}"

"$REPO_ROOT/scripts/lint-format.sh"

echo "[verify-full-stack] Platform API tests..."
cd "$REPO_ROOT/platform/api"
python -m pytest -q

echo "[verify-full-stack] Web client lint + test..."
cd "$REPO_ROOT/clients/web"
npm run build
npm run test:ci

echo "[verify-full-stack] API health ($API_URL)..."
if curl -sf "$API_URL/api/v1/health" >/dev/null; then
  echo "[verify-full-stack] Health OK"
else
  echo "[verify-full-stack] WARN: API not reachable (start docker compose or uvicorn)"
  echo "[verify-full-stack] Platform + web checks passed; health skipped."
fi

if command -v flutter >/dev/null 2>&1; then
  echo "[verify-full-stack] Flutter analyze..."
  cd "$REPO_ROOT/clients/mobile"
  flutter analyze
else
  echo "[verify-full-stack] Flutter SDK not on PATH — skipping mobile analyze"
fi

echo "[verify-full-stack] OK"
