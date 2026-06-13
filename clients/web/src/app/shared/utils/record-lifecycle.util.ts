/** Soft-delete lifecycle helpers — shared by entity page and record header. */

export function isRecordDeleted(record: Record<string, unknown>): boolean {
  const deletedAt = record['deleted_at'];
  return deletedAt !== undefined && deletedAt !== null && String(deletedAt).length > 0;
}

export function canDeleteRecord(
  recordId: string | null,
  record: Record<string, unknown>,
  creatingNew: boolean,
): boolean {
  return Boolean(recordId && !creatingNew && !isRecordDeleted(record));
}

export function canRestoreRecord(
  recordId: string | null,
  record: Record<string, unknown>,
): boolean {
  return Boolean(recordId && isRecordDeleted(record));
}
