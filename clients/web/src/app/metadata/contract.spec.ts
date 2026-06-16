import {
  resolveColumnLabel,
  resolveFieldLabel,
  validateFormMetadata,
  validateGridMetadata,
} from './contract';
import type { FormMetadata, GridMetadata } from './contract';

describe('metadata contract helpers', () => {
  it('validates metadata presence', () => {
    const emptyForm = {
      schema_version: '1',
      entity_code: 'P',
      sections: [],
      conditions: [],
    } as FormMetadata;
    expect(validateFormMetadata(emptyForm)).toBeFalse();
    expect(
      validateFormMetadata({
        schema_version: '1',
        entity_code: 'P',
        sections: [{ code: 'main', label: 'Main', fields: [] }],
        conditions: [],
      }),
    ).toBeTrue();
    const emptyGrid = {
      schema_version: '1',
      entity_code: 'P',
      columns: [],
      export: { csv: false, excel: false, pdf: false },
      grouping: false,
      realtime: false,
      offline: false,
    } as GridMetadata;
    expect(validateGridMetadata(emptyGrid)).toBeFalse();
    expect(
      validateGridMetadata({
        schema_version: '1',
        entity_code: 'P',
        columns: [{ field: 'sku', label: 'SKU', sortable: true, filterable: true }],
        export: { csv: true, excel: false, pdf: false },
        grouping: false,
        realtime: false,
        offline: false,
      }),
    ).toBeTrue();
  });

  it('resolves localized field and column labels', () => {
    const field = {
      name: 'sku',
      label: 'SKU',
      field_type: 'text' as const,
      required: false,
      row: 0,
      col: 0,
      span: 6,
      i18n: { fr: 'Référence' },
    };
    expect(resolveFieldLabel(field, 'fr')).toBe('Référence');
    expect(
      resolveFieldLabel(
        { ...field, label: undefined as unknown as string, i18n: undefined },
        'en',
      ),
    ).toBe('sku');

    const grid: GridMetadata = {
      schema_version: '1',
      entity_code: 'PRODUCT',
      columns: [{ field: 'sku', label: 'SKU', sortable: true, filterable: true }],
      export: { csv: true, excel: false, pdf: false },
      grouping: false,
      realtime: false,
      offline: false,
      i18n: { fr: { sku: 'Référence' } },
    };
    expect(resolveColumnLabel(grid.columns[0], grid, 'fr')).toBe('Référence');
    expect(
      resolveColumnLabel(
        {
          field: 'code',
          label: undefined as unknown as string,
          sortable: false,
          filterable: false,
        },
        grid,
        'en',
      ),
    ).toBe('code');

    expect(resolveFieldLabel({ ...field, i18n: { fr: 'Référence' } }, 'en')).toBe('SKU');
    expect(
      resolveColumnLabel(
        { field: 'sku', label: 'SKU', sortable: true, filterable: true },
        { ...grid, i18n: undefined },
        'fr',
      ),
    ).toBe('SKU');
  });
});
