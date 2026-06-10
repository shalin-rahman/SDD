export interface FormFieldMetadata {
  name: string;
  label: string;
  field_type: string;
  required: boolean;
  row: number;
  col: number;
  span: number;
}

export interface FormMetadata {
  schema_version: string;
  entity_code: string;
  sections: Array<{ code: string; label: string; fields: FormFieldMetadata[] }>;
  conditions: Array<Record<string, unknown>>;
  i18n?: Record<string, unknown>;
}

export interface GridMetadata {
  schema_version: string;
  entity_code: string;
  columns: Array<{ field: string; label: string; sortable: boolean; filterable: boolean }>;
  export: { excel: boolean; pdf: boolean; csv: boolean };
  grouping: boolean;
  realtime: boolean;
  offline: boolean;
  i18n?: Record<string, unknown>;
}

export function validateFormMetadata(data: FormMetadata): boolean {
  return Boolean(data.schema_version && data.entity_code && data.sections.length > 0);
}

export function validateGridMetadata(data: GridMetadata): boolean {
  return Boolean(data.schema_version && data.entity_code && data.columns.length > 0);
}
