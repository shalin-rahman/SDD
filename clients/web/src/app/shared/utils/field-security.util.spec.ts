import { securedVisibleFieldNames } from './field-security.util';

describe('securedVisibleFieldNames', () => {
  it('keeps all names on create', () => {
    expect(securedVisibleFieldNames(['sku', 'unit_price'], {}, true)).toEqual(['sku', 'unit_price']);
  });

  it('drops business fields missing from secured record payload', () => {
    expect(
      securedVisibleFieldNames(
        ['sku', 'name', 'unit_price'],
        { sku: 'A', name: 'Widget' },
        false,
      ),
    ).toEqual(['sku', 'name']);
  });

  it('always keeps system fields when present in visible list', () => {
    expect(
      securedVisibleFieldNames(
        ['sku', 'created_at'],
        { sku: 'A' },
        false,
      ),
    ).toEqual(['sku', 'created_at']);
  });
});
