#!/usr/bin/env bash
# PostgreSQL archive_command hook: copy WAL segment to local dir and optional S3.
# Usage in postgresql.conf:
#   archive_command = '/path/to/wal-archive.sh %p %f'
set -euo pipefail

wal_path="${1:?missing WAL path}"
wal_file="${2:?missing WAL filename}"

WAL_ARCHIVE_DIR="${WAL_ARCHIVE_DIR:-/var/lib/postgresql/wal_archive}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-emcap/postgres/wal}"

mkdir -p "${WAL_ARCHIVE_DIR}"

dest="${WAL_ARCHIVE_DIR}/${wal_file}"
cp "${wal_path}" "${dest}"
chmod 640 "${dest}"

if [[ -n "${S3_BUCKET}" ]]; then
  aws s3 cp "${dest}" "s3://${S3_BUCKET}/${S3_PREFIX}/${wal_file}"
fi

exit 0
