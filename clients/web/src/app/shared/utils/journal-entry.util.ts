import { formatGridCellValue } from './field-display.util';
import { resolveRecordDisplayLabel } from './lookup-display.util';

export const JE_LINE_PARENT_FIELD = 'journal_entry_id';
export const JE_LINE_ENTITY_CODE = 'JOURNAL_ENTRY_LINE';
export const JE_CREATE_PREFILL_PARAM = 'journal_entry_id';

/** Filter JOURNAL_ENTRY_LINE rows for a parent journal entry. */
export function filterJournalLines(
  lines: Record<string, unknown>[],
  journalEntryId: string,
): Record<string, unknown>[] {
  return lines.filter((row) => String(row[JE_LINE_PARENT_FIELD] ?? '') === journalEntryId);
}

export function journalLineAmount(line: Record<string, unknown>, field: 'debit' | 'credit'): number {
  const value = Number(line[field]);
  return Number.isFinite(value) ? value : 0;
}

export function sumJournalLineAmounts(
  lines: Record<string, unknown>[],
  field: 'debit' | 'credit',
): number {
  return lines.reduce((sum, line) => sum + journalLineAmount(line, field), 0);
}

export function formatJournalLineAmount(
  line: Record<string, unknown>,
  field: 'debit' | 'credit',
  currencyCode = 'USD',
): string {
  const amount = journalLineAmount(line, field);
  if (amount === 0) {
    return '—';
  }
  return formatGridCellValue(field, amount, {
    fieldType: 'currency',
    currencyCode,
  });
}

export function formatJournalLinesTotal(total: number, currencyCode = 'USD'): string {
  if (total === 0) {
    return '—';
  }
  return formatGridCellValue('amount', total, {
    fieldType: 'currency',
    currencyCode,
  });
}

export function resolveAccountLabel(
  accountId: string,
  labels: Record<string, string>,
): string {
  if (!accountId) {
    return '—';
  }
  return labels[accountId] ?? accountId;
}

export function buildAccountLabelMap(
  accounts: Record<string, unknown>[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const account of accounts) {
    const id = String(account['id'] ?? '');
    if (id) {
      map[id] = resolveRecordDisplayLabel(account);
    }
  }
  return map;
}

export function journalLineAccountLabel(
  line: Record<string, unknown>,
  labels: Record<string, string>,
): string {
  return resolveAccountLabel(String(line['account_id'] ?? ''), labels);
}

export function canPostJournalEntry(
  entityCode: string,
  record: Record<string, unknown>,
  options: { recordId?: string | null; creatingNew?: boolean } = {},
): boolean {
  const { recordId, creatingNew = false } = options;
  const id = recordId ?? String(record['id'] ?? '');
  if (entityCode !== 'JOURNAL_ENTRY' || !id || creatingNew) {
    return false;
  }
  return String(record['status'] ?? '') === 'draft';
}

export function canVoidJournalEntry(
  entityCode: string,
  record: Record<string, unknown>,
  options: { recordId?: string | null; creatingNew?: boolean } = {},
): boolean {
  const { recordId, creatingNew = false } = options;
  const id = recordId ?? String(record['id'] ?? '');
  if (entityCode !== 'JOURNAL_ENTRY' || !id || creatingNew) {
    return false;
  }
  return String(record['status'] ?? '') === 'posted';
}

export function canAddJournalLine(
  entityCode: string,
  record: Record<string, unknown>,
  options: { recordId?: string | null; creatingNew?: boolean } = {},
): boolean {
  return canPostJournalEntry(entityCode, record, options);
}
