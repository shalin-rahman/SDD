import type { StatusFieldMetadata } from '../../metadata/contract';
import {
  buildRecordHeadlineView,
  buildStatusChipView,
  resolveHeadlineFields,
} from './record-headline.util';

describe('record-headline.util', () => {
  const t = (key: string) => key;
  const statusField: StatusFieldMetadata = {
    field: 'active',
    active_values: [true],
    labels: { active: { en: 'Active' }, inactive: { en: 'Inactive' } },
  };

  it('resolves code and name fields from main section', () => {
    const resolved = resolveHeadlineFields(['sku', 'name', 'unit_price']);
    expect(resolved.codeField).toBe('sku');
    expect(resolved.nameField).toBe('name');
    expect(resolved.subtitleFields).toContain('unit_price');
  });

  it('uses metadata hints when provided', () => {
    const resolved = resolveHeadlineFields(['sku', 'name'], {
      code_field: 'sku',
      name_field: 'name',
      subtitle_fields: ['name'],
    });
    expect(resolved.codeField).toBe('sku');
    expect(resolved.subtitleFields).toEqual(['name']);
  });

  it('builds headline for existing records', () => {
    const view = buildRecordHeadlineView(
      { sku: 'SKU-1', name: 'Widget', active: true },
      false,
      'rec-1',
      t,
      ['sku', 'name'],
      statusField,
      { code_field: 'sku', name_field: 'name' },
      'en',
    );
    expect(view.headline).toContain('Widget');
    expect(view.statusActive).toBeTrue();
    expect(buildStatusChipView({ active: true }, statusField, 'en', t).statusLabel).toBe('Active');
  });

  it('builds new-record headline', () => {
    const view = buildRecordHeadlineView({}, true, null, t, ['sku'], undefined, undefined, 'en');
    expect(view.headline).toBe('entity.newRecord');
  });

  it('resolves CRM company/contact headline and stock subtitle', () => {
    const resolved = resolveHeadlineFields(['company', 'contact_name', 'quantity_on_hand', 'unit_price']);
    expect(resolved.codeField).toBe('company');
    expect(resolved.nameField).toBe('contact_name');

    const view = buildRecordHeadlineView(
      { company: 'Acme', contact_name: 'Jane', quantity_on_hand: 5, unit_price: 9.5, active: false },
      false,
      'rec-9',
      t,
      ['company', 'contact_name', 'quantity_on_hand', 'unit_price'],
      statusField,
      undefined,
      'en',
    );
    expect(view.headline).toContain('Acme');
    expect(view.subtitle).toContain('entity.stockLine');
    expect(view.statusActive).toBeFalse();
    expect(buildStatusChipView({}, undefined, 'en', t)).toEqual({ statusLabel: '', statusActive: false });
  });

  it('falls back to record id when headline fields are empty', () => {
    const view = buildRecordHeadlineView({}, false, 'rec-x', t, ['sku'], undefined, undefined, 'en');
    expect(view.headline).toContain('rec-x');
  });

  it('uses generic subtitle join and localized status without en fallback', () => {
    const view = buildRecordHeadlineView(
      { sku: 'A', name: 'Alpha', unit_price: 12, active: true },
      false,
      'rec-2',
      t,
      ['sku', 'name', 'unit_price', 'active'],
      {
        field: 'active',
        active_values: [true],
        labels: { active: { fr: 'Actif' }, inactive: { fr: 'Inactif' } },
      },
      { code_field: 'sku', name_field: 'name', subtitle_fields: ['unit_price'] },
      'fr',
    );
    expect(view.subtitle).toContain('12');
    expect(view.statusLabel).toBe('Actif');

    expect(buildStatusChipView({ active: null }, statusField, 'en', t)).toEqual({
      statusLabel: '',
      statusActive: false,
    });

    const codeOnly = buildRecordHeadlineView({ sku: 'X' }, false, 'r', t, ['sku'], undefined, undefined, 'en');
    expect(codeOnly.headline).toBe('X');
    const both = buildRecordHeadlineView(
      { sku: 'X', name: 'Y' },
      false,
      'r',
      t,
      ['sku', 'name'],
      undefined,
      { code_field: 'sku', name_field: 'name' },
      'en',
    );
    expect(both.headline).toContain('—');
  });
});
