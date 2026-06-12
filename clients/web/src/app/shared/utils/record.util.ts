import type { FormFieldMetadata } from '../../metadata/contract';

export function recordId(record: Record<string, unknown>): string {
  return String(record.id ?? '');
}

export function inputType(field: FormFieldMetadata): string {
  const type = field.field_type ?? 'text';
  if (type === 'number') return 'number';
  if (type === 'date') return 'date';
  if (type === 'email') return 'email';
  return 'text';
}
