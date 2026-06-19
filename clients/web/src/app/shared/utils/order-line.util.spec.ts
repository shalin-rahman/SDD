import {
  filterOrderLines,
  formatOrderLineExtension,
  formatOrderLineQuantity,
  formatOrderLineUnitPrice,
  formatOrderLinesTotal,
  orderLineExtension,
  orderLineProductLabel,
  PO_LINE_PARENT_FIELD,
  SO_LINE_PARENT_FIELD,
  sumOrderLineExtensions,
  sumOrderLineQuantities,
} from './order-line.util';

describe('order-line.util', () => {
  const lines = [
    { id: 'l1', po_id: 'po-1', product_id: 'p1', quantity: 4, unit_price: 25 },
    { id: 'l2', po_id: 'po-1', product_id: 'p2', quantity: 2, unit_price: 10 },
    { id: 'l3', sales_order_id: 'so-1', product_id: 'p1', quantity: 1, unit_price: 99 },
  ];

  it('filters lines by parent id field', () => {
    expect(filterOrderLines(lines, PO_LINE_PARENT_FIELD, 'po-1').length).toBe(2);
    expect(filterOrderLines(lines, SO_LINE_PARENT_FIELD, 'so-1').length).toBe(1);
    expect(filterOrderLines(lines, PO_LINE_PARENT_FIELD, 'missing')).toEqual([]);
  });

  it('computes quantity, extension, and totals', () => {
    const filtered = filterOrderLines(lines, PO_LINE_PARENT_FIELD, 'po-1');
    expect(orderLineExtension(filtered[0])).toBe(100);
    expect(sumOrderLineQuantities(filtered)).toBe(6);
    expect(sumOrderLineExtensions(filtered)).toBe(120);
  });

  it('formats cells and resolves product labels', () => {
    expect(formatOrderLineQuantity({ quantity: 0 })).toBe('—');
    expect(formatOrderLineQuantity({ quantity: 3 })).toBe('3');
    expect(formatOrderLineUnitPrice({ unit_price: 12.5 })).toContain('12.50');
    expect(formatOrderLineExtension({ quantity: 2, unit_price: 5 })).toContain('10.00');
    expect(formatOrderLinesTotal(0)).toBe('—');

    const labels = { p1: 'Widget A' };
    expect(orderLineProductLabel({ product_id: 'p1' }, labels)).toBe('Widget A');
    expect(orderLineProductLabel({ product_id: '' }, labels)).toBe('—');
  });

  it('uses qty alias and handles invalid numeric fields', () => {
    expect(orderLineExtension({ qty: 3, unit_price: 4 })).toBe(12);
    expect(orderLineExtension({ quantity: 'x', unit_price: 5 })).toBe(0);
    expect(formatOrderLinesTotal(42)).toContain('42.00');
  });
});
