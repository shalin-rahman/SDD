#!/usr/bin/env bash
# Point-in-time recovery helper for self-hosted PostgreSQL with base backup + WAL.
#
# Required env:
#   PGDATA          — empty or stopped data directory to restore into
#   BASE_BACKUP_DIR — directory from pg_basebackup -Fp
#   WAL_ARCHIVE_DIR — archived WAL segments
#   RECOVERY_TARGET — ISO-8601 timestamp, e.g. 2026-06-11T14:30:00Z
#
# Stop postgres before running. Review output before starting the server.
set -euo pipefail

PGDATA="${PGDATA:?set PGDATA to target data directory}"
BASE_BACKUP_DIR="${BASE_BACKUP_DIR:?set BASE_BACKUP_DIR}"
WAL_ARCHIVE_DIR="${WAL_ARCHIVE_DIR:?set WAL_ARCHIVE_DIR}"
RECOVERY_TARGET="${RECOVERY_TARGET:?set RECOVERY_TARGET ISO timestamp}"

if [[ -d "${PGDATA}" && "$(ls -A "${PGDATA}" 2>/dev/null)" ]]; then
  echo "error: PGDATA must be empty: ${PGDATA}" >&2
  exit 1
fi

echo "[restore-pitr] extracting base backup from ${BASE_BACKUP_DIR}"
mkdir -p "${PGDATA}"
tar -xf "${BASE_BACKUP_DIR}/base.tar" -C "${PGDATA}" 2>/dev/null || cp -a "${BASE_BACKUP_DIR}/." "${PGDATA}/"

restore_conf="${PGDATA}/postgresql.auto.conf"
cat > "${restore_conf}" <<EOF
restore_command = 'cp ${WAL_ARCHIVE_DIR}/%f %p'
recovery_target_time = '${RECOVERY_TARGET}'
recovery_target_action = 'promote'
EOF

touch "${PGDATA}/recovery.signal"
echo "[restore-pitr] recovery configured; target=${RECOVERY_TARGET}"
echo "[restore-pitr] start postgres and monitor logs until promotion completes"
