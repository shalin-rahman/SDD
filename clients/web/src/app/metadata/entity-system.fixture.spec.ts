import { DynamicFormRenderer } from './dynamic-form.renderer';
import type { FormFieldMetadata, FormMetadata } from './contract';
import {
  buildRecordHeadlineView,
  resolveHeadlineFields,
} from '../shared/utils/record-headline.util';

import productFormKeys from '../../assets/fixtures/metadata/product.form.keys.json';
import productGridKeys from '../../assets/fixtures/metadata/product.grid.keys.json';
import warehouseFormKeys from '../../assets/fixtures/metadata/warehouse.form.keys.json';
import warehouseGridKeys from '../../assets/fixtures/metadata/warehouse.grid.keys.json';
import leadFormKeys from '../../assets/fixtures/metadata/lead.form.keys.json';
import leadGridKeys from '../../assets/fixtures/metadata/lead.grid.keys.json';
import contactFormKeys from '../../assets/fixtures/metadata/contact.form.keys.json';
import contactGridKeys from '../../assets/fixtures/metadata/contact.grid.keys.json';
import supplierFormKeys from '../../assets/fixtures/metadata/supplier.form.keys.json';
import supplierGridKeys from '../../assets/fixtures/metadata/supplier.grid.keys.json';
import purchaseOrderFormKeys from '../../assets/fixtures/metadata/purchase_order.form.keys.json';
import purchaseOrderGridKeys from '../../assets/fixtures/metadata/purchase_order.grid.keys.json';
import salesOrderFormKeys from '../../assets/fixtures/metadata/sales_order.form.keys.json';
import salesOrderGridKeys from '../../assets/fixtures/metadata/sales_order.grid.keys.json';
import invoiceFormKeys from '../../assets/fixtures/metadata/invoice.form.keys.json';
import invoiceGridKeys from '../../assets/fixtures/metadata/invoice.grid.keys.json';

interface FormKeysFixture {
  field_names: string[];
}

interface GridKeysFixture {
  column_fields: string[];
}

const SYSTEM_FIELD_NAMES = [
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'record_version',
  'deleted_at',
];

const GRID_SYSTEM_COLUMNS = ['created_at', 'updated_at', 'created_by', 'updated_by', 'record_version'];

const W1_ENTITIES: Array<{
  code: string;
  formKeys: FormKeysFixture;
  gridKeys: GridKeysFixture;
  headlineSample: Record<string, unknown>;
  expectedHeadline: string;
}> = [
  {
    code: 'PRODUCT',
    formKeys: productFormKeys as FormKeysFixture,
    gridKeys: productGridKeys as GridKeysFixture,
    headlineSample: { sku: 'SKU-001', name: 'Widget', quantity_on_hand: 12, unit_price: 9.99 },
    expectedHeadline: 'SKU-001 — Widget',
  },
  {
    code: 'WAREHOUSE',
    formKeys: warehouseFormKeys as FormKeysFixture,
    gridKeys: warehouseGridKeys as GridKeysFixture,
    headlineSample: { code: 'WH-EAST', name: 'East DC' },
    expectedHeadline: 'WH-EAST — East DC',
  },
  {
    code: 'LEAD',
    formKeys: leadFormKeys as FormKeysFixture,
    gridKeys: leadGridKeys as GridKeysFixture,
    headlineSample: { company: 'Acme Corp', contact_name: 'Jane Doe' },
    expectedHeadline: 'Acme Corp — Jane Doe',
  },
  {
    code: 'CONTACT',
    formKeys: contactFormKeys as FormKeysFixture,
    gridKeys: contactGridKeys as GridKeysFixture,
    headlineSample: { name: 'Jane Doe', email: 'jane@example.com' },
    expectedHeadline: 'Jane Doe',
  },
];

const W4_ENTITIES: Array<{
  code: string;
  formKeys: FormKeysFixture;
  gridKeys: GridKeysFixture;
  headlineSample: Record<string, unknown>;
  expectedHeadline: string;
}> = [
  {
    code: 'SUPPLIER',
    formKeys: supplierFormKeys as FormKeysFixture,
    gridKeys: supplierGridKeys as GridKeysFixture,
    headlineSample: { code: 'SUP-01', name: 'Acme Supply' },
    expectedHeadline: 'SUP-01 — Acme Supply',
  },
  {
    code: 'PURCHASE_ORDER',
    formKeys: purchaseOrderFormKeys as FormKeysFixture,
    gridKeys: purchaseOrderGridKeys as GridKeysFixture,
    headlineSample: { po_number: 'PO-1001', status: 'draft' },
    expectedHeadline: 'PO-1001',
  },
  {
    code: 'SALES_ORDER',
    formKeys: salesOrderFormKeys as FormKeysFixture,
    gridKeys: salesOrderGridKeys as GridKeysFixture,
    headlineSample: { order_number: 'SO-2001', status: 'draft' },
    expectedHeadline: 'SO-2001',
  },
  {
    code: 'INVOICE',
    formKeys: invoiceFormKeys as FormKeysFixture,
    gridKeys: invoiceGridKeys as GridKeysFixture,
    headlineSample: { invoice_number: 'INV-3001', status: 'draft' },
    expectedHeadline: 'INV-3001',
  },
];

const FIXTURE_ENTITIES = [...W1_ENTITIES, ...W4_ENTITIES];

function fieldFromName(name: string, readOnly = false): FormFieldMetadata {
  const isDatetime = name.endsWith('_at');
  return {
    name,
    label: name,
    field_type: isDatetime ? 'datetime' : name === 'record_version' ? 'number' : 'text',
    required: false,
    read_only: readOnly,
    row: 0,
    col: 0,
    span: 6,
  };
}

function buildFormMetadata(entityCode: string, formKeys: FormKeysFixture): FormMetadata {
  return {
    schema_version: '1.0',
    entity_code: entityCode,
    sections: [
      {
        code: 'main',
        label: entityCode,
        fields: formKeys.field_names.map((name) => fieldFromName(name)),
      },
      {
        code: 'system',
        label: 'System',
        fields: SYSTEM_FIELD_NAMES.map((name) => fieldFromName(name, true)),
      },
    ],
    conditions: [],
  };
}

const t = (key: string): string => key;

for (const entity of FIXTURE_ENTITIES) {
  describe(`${entity.code} metadata fixtures`, () => {
    it('form keys fixture lists main business fields', () => {
      expect(entity.formKeys.field_names.length).toBeGreaterThan(0);
      expect(entity.formKeys.field_names).not.toContain('id');
    });

    it('builds main + system form sections from fixture', () => {
      const form = buildFormMetadata(entity.code, entity.formKeys);
      const renderer = new DynamicFormRenderer(form);
      expect(form.sections.map((section) => section.code)).toEqual(['main', 'system']);
      expect(form.sections[1].fields.map((field) => field.name)).toEqual(SYSTEM_FIELD_NAMES);
      for (const name of SYSTEM_FIELD_NAMES) {
        expect(renderer.isReadOnly(name)).withContext(name).toBeTrue();
      }
    });

    it('grid keys fixture places system columns after business fields', () => {
      const columns = entity.gridKeys.column_fields;
      const lastBusiness = entity.formKeys.field_names.at(-1)!;
      for (const column of GRID_SYSTEM_COLUMNS) {
        expect(columns).toContain(column);
      }
      expect(columns.indexOf('created_at')).toBeGreaterThan(columns.indexOf(lastBusiness));
    });

    it('resolves headline fields from main-section metadata', () => {
      const resolved = resolveHeadlineFields(entity.formKeys.field_names);
      if (entity.code === 'PRODUCT' || entity.code === 'WAREHOUSE') {
        expect(resolved.codeField).toBe(entity.code === 'PRODUCT' ? 'sku' : 'code');
        expect(resolved.nameField).toBe('name');
      }
      if (entity.code === 'LEAD') {
        expect(resolved.codeField).toBe('company');
        expect(resolved.nameField).toBe('contact_name');
      }
      if (entity.code === 'CONTACT') {
        expect(resolved.nameField).toBe('name');
      }
      if (entity.code === 'PURCHASE_ORDER') {
        expect(resolved.codeField).toBe('po_number');
      }
      if (entity.code === 'SALES_ORDER') {
        expect(resolved.codeField).toBe('order_number');
      }
      if (entity.code === 'INVOICE') {
        expect(resolved.codeField).toBe('invoice_number');
      }
    });

    it('builds hero headline from fixture field rules', () => {
      const view = buildRecordHeadlineView(
        entity.headlineSample,
        false,
        'rec-1',
        t,
        entity.formKeys.field_names,
      );
      expect(view.headline).toBe(entity.expectedHeadline);
    });
  });
}
