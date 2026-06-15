const SYSTEM_FIELD_NAMES = new Set([
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'record_version',
  'deleted_at',
]);

/** Hide business fields absent from a secured record GET (P23-T02). */
export function securedVisibleFieldNames(
  visibleNames: string[],
  recordValues: Record<string, unknown>,
  creatingNew: boolean,
): string[] {
  if (creatingNew) {
    return visibleNames;
  }
  const recordKeys = new Set(Object.keys(recordValues));
  return visibleNames.filter((name) => SYSTEM_FIELD_NAMES.has(name) || recordKeys.has(name));
}
