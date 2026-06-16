import { resolveRecordDisplayLabel } from './lookup-display.util';

describe('lookup-display.util', () => {
  it('prefers name, code, sku, title in order', () => {
    expect(resolveRecordDisplayLabel({ id: '1', sku: 'SKU-1', name: 'Widget' })).toBe('Widget');
    expect(resolveRecordDisplayLabel({ id: '1', sku: 'SKU-1' })).toBe('SKU-1');
    expect(resolveRecordDisplayLabel({ id: '1', code: 'WH-01' })).toBe('WH-01');
    expect(resolveRecordDisplayLabel({ id: 'rec-9' })).toBe('rec-9');
  });

  it('skips blank string values', () => {
    expect(resolveRecordDisplayLabel({ name: '  ', code: 'C-1' })).toBe('C-1');
  });
});
