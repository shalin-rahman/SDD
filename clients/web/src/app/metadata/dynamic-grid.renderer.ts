import type { GridMetadata } from './contract';
import { resolveColumnLabel } from './contract';

export type SortDirection = 'asc' | 'desc' | null;

export class DynamicGridRenderer {
  constructor(
    private readonly metadata: GridMetadata,
    private readonly locale = 'en',
  ) {}

  columnFields(): string[] {
    return this.metadata.columns.map((column) => column.field);
  }

  columnLabel(field: string): string {
    const column = this.metadata.columns.find((col) => col.field === field);
    return column ? resolveColumnLabel(column, this.metadata, this.locale) : field;
  }

  isSortable(field: string): boolean {
    return this.metadata.columns.find((col) => col.field === field)?.sortable ?? false;
  }

  isFilterable(field: string): boolean {
    return this.metadata.columns.find((col) => col.field === field)?.filterable ?? false;
  }

  columnFieldType(field: string): string | undefined {
    return this.metadata.columns.find((col) => col.field === field)?.field_type;
  }

  columnCurrencyCode(field: string): string | undefined {
    return this.metadata.columns.find((col) => col.field === field)?.currency_code;
  }

  exportEnabled(): boolean {
    return this.metadata.export.excel || this.metadata.export.pdf || this.metadata.export.csv;
  }

  sortRecords(
    records: Record<string, unknown>[],
    field: string | null,
    direction: SortDirection,
  ): Record<string, unknown>[] {
    if (!field || !direction) {
      return [...records];
    }
    const sorted = [...records];
    sorted.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
      return direction === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }

  filterRecords(
    records: Record<string, unknown>[],
    filters: Record<string, string>,
  ): Record<string, unknown>[] {
    const active = Object.entries(filters).filter(([, value]) => value.trim() !== '');
    if (active.length === 0) {
      return records;
    }
    return records.filter((record) =>
      active.every(([field, needle]) =>
        String(record[field] ?? '')
          .toLowerCase()
          .includes(needle.toLowerCase()),
      ),
    );
  }

  groupRecords(
    records: Record<string, unknown>[],
    groupField: string | null,
  ): Array<{ key: string; records: Record<string, unknown>[] }> {
    if (!groupField) {
      return [{ key: '', records }];
    }
    const groups = new Map<string, Record<string, unknown>[]>();
    for (const record of records) {
      const key = String(record[groupField] ?? '(empty)');
      const bucket = groups.get(key) ?? [];
      bucket.push(record);
      groups.set(key, bucket);
    }
    return [...groups.entries()].map(([key, rows]) => ({ key, records: rows }));
  }

  paginate<T>(items: T[], page: number, pageSize: number): T[] {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }
}
