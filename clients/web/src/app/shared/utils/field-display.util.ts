const DATETIME_FIELDS = new Set(['created_at', 'updated_at', 'deleted_at']);

export function formatRecordFieldValue(
  fieldName: string,
  fieldType: string,
  value: unknown,
  currencyCode?: string,
): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  if (fieldType === 'datetime' || DATETIME_FIELDS.has(fieldName)) {
    const parsed = Date.parse(String(value));
    if (!Number.isNaN(parsed)) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(parsed);
    }
  }
  if (fieldType === 'currency') {
    const code = currencyCode ?? 'USD';
    const amount = Number(value);
    if (!Number.isNaN(amount)) {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(amount);
    }
  }
  if (fieldType === 'textarea') {
    return String(value);
  }
  if (fieldType === 'lookup') {
    return String(value);
  }
  if (fieldType === 'checkbox' || typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

export function formatGridCellValue(
  fieldName: string,
  value: unknown,
  options?: { fieldType?: string; currencyCode?: string },
): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  if (options?.fieldType === 'currency') {
    return formatRecordFieldValue(fieldName, 'currency', value, options.currencyCode);
  }
  if (options?.fieldType === 'textarea') {
    const text = String(value);
    return text.length > 80 ? `${text.slice(0, 77)}…` : text;
  }
  if (DATETIME_FIELDS.has(fieldName)) {
    return formatRecordFieldValue(fieldName, 'datetime', value);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}
