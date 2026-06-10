#!/usr/bin/env bash
# P5-T05: Informational check that platform core (platform/api/src/emcap/) has no diff.
# Always exits 0 — use in reviews and pre-merge checks; fails are informational only.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CORE_PATH="platform/api/src/emcap/"

cd "${REPO_ROOT}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[verify-platform-core] Not a git repository — skipping diff check."
  echo "[verify-platform-core] OK (informational): no git metadata to compare."
  exit 0
fi

UNSTAGED="$(git diff --name-only -- "${CORE_PATH}" 2>/dev/null || true)"
STAGED="$(git diff --cached --name-only -- "${CORE_PATH}" 2>/dev/null || true)"
CHANGED="$(printf '%s\n%s' "${UNSTAGED}" "${STAGED}" | sed '/^$/d' | sort -u)"

if [[ -z "${CHANGED}" ]]; then
  echo "[verify-platform-core] OK: no changes under ${CORE_PATH}"
  echo "[verify-platform-core] Business modules should add capabilities via modules/*/module.py only (SDD §30)."
  exit 0
fi

echo "[verify-platform-core] NOTE: platform core has local changes (informational — exit 0):"
echo "${CHANGED}" | sed 's/^/  - /'
echo "[verify-platform-core] For plug-in modules, only modules/ should change. Review before merge."
exit 0
