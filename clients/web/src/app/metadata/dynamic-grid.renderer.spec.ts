import { DynamicGridRenderer } from './dynamic-grid.renderer';
import type { GridMetadata } from './contract';

const GRID: GridMetadata = {
  schema_version: '1',
  entity_code: 'PRODUCT',
  columns: [
    { field: 'sku', label: 'SKU', sortable: true, filterable: true },
    { field: 'name', label: 'Name', sortable: true, filterable: true },
    { field: 'unit_price', label: 'Price', sortable: false, filterable: false, field_type: 'currency', currency_code: 'USD' },
  ],
  export: { csv: true, excel: false, pdf: false },
  grouping: true,
  realtime: false,
  offline: false,
};

describe('DynamicGridRenderer', () => {
  const renderer = new DynamicGridRenderer(GRID);

  it('exposes column metadata helpers', () => {
    expect(renderer.columnFields()).toEqual(['sku', 'name', 'unit_price']);
    expect(renderer.columnLabel('sku')).toBe('SKU');
    expect(renderer.isSortable('sku')).toBeTrue();
    expect(renderer.isFilterable('name')).toBeTrue();
    expect(renderer.columnFieldType('unit_price')).toBe('currency');
    expect(renderer.exportEnabled()).toBeTrue();
  });

  it('sorts and filters records', () => {
    const records = [
      { sku: 'B-2', name: 'Beta' },
      { sku: 'A-1', name: 'Alpha' },
    ];
    expect(renderer.sortRecords(records, 'sku', 'asc')[0]['sku']).toBe('A-1');
    expect(renderer.sortRecords(records, 'sku', 'desc')[0]['sku']).toBe('B-2');
    const filtered = renderer.filterRecords(records, { name: 'alp' });
    expect(filtered.length).toBe(1);
  });

  it('groups and paginates records', () => {
    const records = [
      { category: 'A', sku: '1' },
      { category: 'B', sku: '2' },
      { category: 'A', sku: '3' },
    ];
    const groups = renderer.groupRecords(records, 'category');
    expect(groups.length).toBe(2);
    expect(renderer.paginate(records, 1, 2).length).toBe(2);
  });

  it('handles null sort, empty filters, and export flags', () => {
    const records = [{ sku: 'A' }];
    expect(renderer.sortRecords(records, null, null)).toEqual(records);
    expect(renderer.filterRecords(records, { sku: '  ' })).toEqual(records);
    expect(renderer.columnLabel('missing')).toBe('missing');
    expect(renderer.columnCurrencyCode('unit_price')).toBe('USD');
    expect(renderer.columnCurrencyCode('sku')).toBeUndefined();

    const excelGrid = new DynamicGridRenderer({
      ...GRID,
      export: { csv: false, excel: true, pdf: false },
    });
    expect(excelGrid.exportEnabled()).toBeTrue();
    expect(renderer.groupRecords(records, null)[0].key).toBe('');
  });

  it('covers non-sortable columns, empty group keys, and pdf export flag', () => {
    expect(renderer.isSortable('unit_price')).toBeFalse();
    expect(renderer.isFilterable('unit_price')).toBeFalse();
    const grouped = renderer.groupRecords([{ category: null, sku: '1' }], 'category');
    expect(grouped[0].key).toBe('(empty)');

    const pdfGrid = new DynamicGridRenderer({
      ...GRID,
      export: { csv: false, excel: false, pdf: true },
    });
    expect(pdfGrid.exportEnabled()).toBeTrue();
    expect(renderer.sortRecords([{ sku: 'B' }, { sku: 'A' }], 'sku', null).length).toBe(2);
  });
});
