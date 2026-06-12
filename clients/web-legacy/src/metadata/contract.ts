export interface FormFieldMetadata {
  name: string;
  label: string;
  field_type: string;
  required: boolean;
  row: number;
  col: number;
  span: number;
  validation?: Array<{ rule: string; message: string; value?: unknown }>;
  i18n?: Record<string, string>;
}

export interface ConditionalRule {
  field: string;
  operator: string;
  value?: unknown;
  action?: string;
  targets: string[];
}

export interface FormMetadata {
  schema_version: string;
  entity_code: string;
  sections: Array<{ code: string; label: string; fields: FormFieldMetadata[] }>;
  conditions: ConditionalRule[];
  i18n?: Record<string, Record<string, string>>;
}

export interface GridMetadata {
  schema_version: string;
  entity_code: string;
  columns: Array<{ field: string; label: string; sortable: boolean; filterable: boolean }>;
  export: { excel: boolean; pdf: boolean; csv: boolean };
  grouping: boolean;
  realtime: boolean;
  offline: boolean;
  i18n?: Record<string, Record<string, string>>;
}

export function validateFormMetadata(data: FormMetadata): boolean {
  return Boolean(data.schema_version && data.entity_code && data.sections.length > 0);
}

export function validateGridMetadata(data: GridMetadata): boolean {
  return Boolean(data.schema_version && data.entity_code && data.columns.length > 0);
}

export function resolveFieldLabel(field: FormFieldMetadata, locale = "en"): string {
  return field.i18n?.[locale] ?? field.label ?? field.name;
}

export function resolveColumnLabel(
  column: GridMetadata["columns"][number],
  grid: GridMetadata,
  locale = "en",
): string {
  return grid.i18n?.[locale]?.[column.field] ?? column.label ?? column.field;
}
