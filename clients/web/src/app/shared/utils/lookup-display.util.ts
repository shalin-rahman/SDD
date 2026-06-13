export function resolveRecordDisplayLabel(record: Record<string, unknown>): string {
  for (const key of ['name', 'code', 'sku', 'title']) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return String(record.id ?? '—');
}
