#!/usr/bin/env bash
# EMCAP daily PostgreSQL logical backup (pg_dump custom format, gzip).
set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-emcap}"
PGDATABASE="${PGDATABASE:-emcap}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/emcap}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-emcap/postgres}"

mkdir -p "${BACKUP_DIR}"

timestamp="$(date -u +%Y%m%d-%H%M%S)"
filename="emcap-${timestamp}.dump"
filepath="${BACKUP_DIR}/${filename}"
gzip_path="${filepath}.gz"

echo "[daily-backup] starting pg_dump for ${PGDATABASE}@${PGHOST}:${PGPORT}"

export PGPASSWORD="${PGPASSWORD:-}"

pg_dump \
  -h "${PGHOST}" \
  -p "${PGPORT}" \
  -U "${PGUSER}" \
  -d "${PGDATABASE}" \
  -Fc \
  -f "${filepath}"

gzip -f "${filepath}"
echo "[daily-backup] wrote ${gzip_path}"

if [[ -n "${S3_BUCKET}" ]]; then
  s3_uri="s3://${S3_BUCKET}/${S3_PREFIX}/daily/${filename}.gz"
  aws s3 cp "${gzip_path}" "${s3_uri}"
  echo "[daily-backup] uploaded to ${s3_uri}"
fi

find "${BACKUP_DIR}" -name 'emcap-*.dump.gz' -mtime "+${RETENTION_DAYS}" -delete
echo "[daily-backup] pruned backups older than ${RETENTION_DAYS} days"
