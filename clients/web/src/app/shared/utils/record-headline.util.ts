import type { HeadlineFieldMetadata, StatusFieldMetadata } from '../../metadata/contract';

export interface RecordHeadlineView {
  headline: string;
  subtitle: string;
  statusLabel: string;
  statusActive: boolean;
}

type TranslateFn = (key: string) => string;

const CODE_FIELD_CANDIDATES = ['sku', 'code', 'po_number', 'order_number', 'invoice_number'] as const;
const NAME_FIELD_CANDIDATES = ['name', 'company', 'contact_name', 'title'] as const;
const DEFAULT_SUBTITLE_FIELDS = ['quantity_on_hand', 'unit_price'] as const;

export interface ResolvedHeadlineFields {
  codeField?: string;
  nameField?: string;
  subtitleFields: string[];
}

/** Resolve hero field names from metadata hints or main-section field presence. */
export function resolveHeadlineFields(
  mainFieldNames: string[],
  hints?: HeadlineFieldMetadata,
): ResolvedHeadlineFields {
  const fields = new Set(mainFieldNames);
  const pick = (candidates: readonly string[], explicit?: string): string | undefined => {
    if (explicit && fields.has(explicit)) {
      return explicit;
    }
    return candidates.find((name) => fields.has(name));
  };

  if (hints?.code_field || hints?.name_field) {
    const codeField = pick(CODE_FIELD_CANDIDATES, hints.code_field);
    const nameField = pick(NAME_FIELD_CANDIDATES, hints.name_field);
    const subtitleFields = hints.subtitle_fields?.filter((name) => fields.has(name)) ?? [];
    return { codeField, nameField, subtitleFields };
  }

  if (fields.has('company') && fields.has('contact_name')) {
    const subtitleFields = DEFAULT_SUBTITLE_FIELDS.filter((name) => fields.has(name));
    return { codeField: 'company', nameField: 'contact_name', subtitleFields };
  }

  const codeField = pick(CODE_FIELD_CANDIDATES);
  const nameField = pick(NAME_FIELD_CANDIDATES);
  let subtitleFields = DEFAULT_SUBTITLE_FIELDS.filter((name) => fields.has(name));

  return { codeField, nameField, subtitleFields };
}

function fieldText(record: Record<string, unknown>, field?: string): string {
  if (!field) {
    return '';
  }
  return String(record[field] ?? '').trim();
}

function buildHeadlineText(code: string, name: string): string {
  if (code && name) {
    return `${code} — ${name}`;
  }
  return code || name;
}

function buildSubtitleText(
  record: Record<string, unknown>,
  subtitleFields: string[],
  fallback: string,
  t: TranslateFn,
): string {
  if (subtitleFields.length === 2 && subtitleFields[0] === 'quantity_on_hand' && subtitleFields[1] === 'unit_price') {
    const qty = record['quantity_on_hand'];
    const price = record['unit_price'];
    if (qty !== undefined && price !== undefined) {
      return `${t('entity.stockLine')} ${qty} · ${t('entity.priceLine')} ${price}`;
    }
  }

  const parts = subtitleFields
    .map((field) => fieldText(record, field))
    .filter((value) => value !== '');
  if (parts.length > 0) {
    return parts.join(' · ');
  }
  return fallback;
}

function resolveStatusLabel(
  active: boolean,
  statusField: StatusFieldMetadata,
  locale: string,
  t: TranslateFn,
): string {
  const key = active ? 'active' : 'inactive';
  const localized = statusField.labels[key]?.[locale] ?? statusField.labels[key]?.['en'];
  if (localized) {
    return localized;
  }
  return active ? t('entity.statusActive') : t('entity.statusInactive');
}

function isActiveValue(value: unknown, activeValues: StatusFieldMetadata['active_values']): boolean {
  return activeValues.some((expected) => Object.is(value, expected));
}

/** Status chip label/active from metadata `display.status_field`. */
export function buildStatusChipView(
  record: Record<string, unknown>,
  statusField: StatusFieldMetadata | undefined,
  locale: string,
  t: TranslateFn,
): Pick<RecordHeadlineView, 'statusLabel' | 'statusActive'> {
  if (!statusField) {
    return { statusLabel: '', statusActive: false };
  }
  const raw = record[statusField.field];
  if (raw === undefined || raw === null) {
    return { statusLabel: '', statusActive: false };
  }
  const statusActive = isActiveValue(raw, statusField.active_values);
  return {
    statusLabel: resolveStatusLabel(statusActive, statusField, locale, t),
    statusActive,
  };
}

/** Entity record hero text from metadata field hints and main-section fields. */
export function buildRecordHeadlineView(
  record: Record<string, unknown>,
  creatingNew: boolean,
  selectedRecordId: string | null,
  t: TranslateFn,
  mainFieldNames: string[],
  statusField?: StatusFieldMetadata,
  headlineHints?: HeadlineFieldMetadata,
  locale = 'en',
): RecordHeadlineView {
  if (creatingNew) {
    return {
      headline: t('entity.newRecord'),
      subtitle: t('entity.createSubtitle'),
      statusLabel: '',
      statusActive: false,
    };
  }

  const { codeField, nameField, subtitleFields } = resolveHeadlineFields(mainFieldNames, headlineHints);
  const code = fieldText(record, codeField);
  const name = fieldText(record, nameField);
  const headline = buildHeadlineText(code, name) || `${t('entity.record')} ${selectedRecordId ?? ''}`.trim();
  const subtitle = buildSubtitleText(record, subtitleFields, selectedRecordId ?? '', t);

  const { statusLabel, statusActive } = buildStatusChipView(record, statusField, locale, t);

  return { headline, subtitle, statusLabel, statusActive };
}
