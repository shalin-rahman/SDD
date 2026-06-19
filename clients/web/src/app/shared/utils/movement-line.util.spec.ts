import {
  buildProductLabelMap,
  filterMovementLines,
  formatMovementLineExtension,
  formatMovementLineQuantity,
  formatMovementLineUnitCost,
  formatMovementLinesTotal,
  movementLineExtension,
  resolveProductLabel,
  sumMovementLineExtensions,
  sumMovementLineQuantities,
} from './movement-line.util';

describe('movement-line.util', () => {
  const lines = [
    { id: 'l1', movement_id: 'mov-1', product_id: 'p1', quantity: 10, unit_cost: 2.5 },
    { id: 'l2', movement_id: 'mov-1', product_id: 'p2', qty: 3, unit_cost: 4 },
    { id: 'l3', movement_id: 'mov-2', product_id: 'p1', quantity: 1, unit_cost: 9.99 },
  ];

  it('filters lines by movement id', () => {
    expect(filterMovementLines(lines, 'mov-1').length).toBe(2);
    expect(filterMovementLines(lines, 'missing')).toEqual([]);
  });

  it('computes quantity, extension, and totals', () => {
    const filtered = filterMovementLines(lines, 'mov-1');
    expect(movementLineExtension(filtered[0])).toBe(25);
    expect(sumMovementLineQuantities(filtered)).toBe(13);
    expect(sumMovementLineExtensions(filtered)).toBe(37);
  });

  it('formats cells and resolves product labels', () => {
    expect(formatMovementLineQuantity({ quantity: 0 })).toBe('—');
    expect(formatMovementLineQuantity({ quantity: 5 })).toBe('5');
    expect(formatMovementLineUnitCost({ unit_cost: 9.99 })).toContain('9.99');
    expect(formatMovementLineExtension({ quantity: 2, unit_cost: 3 })).toContain('6.00');
    expect(formatMovementLinesTotal(0)).toBe('—');

    const labels = buildProductLabelMap([
      { id: 'p1', sku: 'SKU-A', name: 'Widget A' },
      { id: 'p2', code: 'CODE-B' },
    ]);
    expect(resolveProductLabel('p1', labels)).toBe('Widget A');
    expect(resolveProductLabel('p2', labels)).toBe('CODE-B');
    expect(resolveProductLabel('', labels)).toBe('—');
    expect(resolveProductLabel('unknown', labels)).toBe('unknown');
  });
});
