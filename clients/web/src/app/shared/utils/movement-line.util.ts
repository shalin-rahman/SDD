import { formatGridCellValue } from './field-display.util';
import { resolveRecordDisplayLabel } from './lookup-display.util';

/** Filter STOCK_MOVEMENT_LINE rows for a parent movement — mobile `filterMovementLines` parity. */
export function filterMovementLines(
  lines: Record<string, unknown>[],
  movementId: string,
): Record<string, unknown>[] {
  return lines.filter((row) => String(row['movement_id'] ?? '') === movementId);
}

export function movementLineQuantity(line: Record<string, unknown>): number {
  const raw = line['quantity'] ?? line['qty'];
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function movementLineUnitCost(line: Record<string, unknown>): number {
  const value = Number(line['unit_cost']);
  return Number.isFinite(value) ? value : 0;
}

export function movementLineExtension(line: Record<string, unknown>): number {
  return movementLineQuantity(line) * movementLineUnitCost(line);
}

export function sumMovementLineQuantities(lines: Record<string, unknown>[]): number {
  return lines.reduce((sum, line) => sum + movementLineQuantity(line), 0);
}

export function sumMovementLineExtensions(lines: Record<string, unknown>[]): number {
  return lines.reduce((sum, line) => sum + movementLineExtension(line), 0);
}

export function resolveProductLabel(
  productId: string,
  labels: Record<string, string>,
): string {
  if (!productId) {
    return '—';
  }
  return labels[productId] ?? productId;
}

export function buildProductLabelMap(
  products: Record<string, unknown>[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const product of products) {
    const id = String(product['id'] ?? '');
    if (!id) {
      continue;
    }
    map[id] = resolveRecordDisplayLabel(product);
  }
  return map;
}

export function formatMovementLineQuantity(line: Record<string, unknown>): string {
  const qty = movementLineQuantity(line);
  return qty === 0 ? '—' : String(qty);
}

export function formatMovementLineUnitCost(
  line: Record<string, unknown>,
  currencyCode = 'USD',
): string {
  return formatGridCellValue('unit_cost', line['unit_cost'], {
    fieldType: 'currency',
    currencyCode,
  });
}

export function formatMovementLineExtension(
  line: Record<string, unknown>,
  currencyCode = 'USD',
): string {
  const extension = movementLineExtension(line);
  if (extension === 0) {
    return '—';
  }
  return formatGridCellValue('unit_cost', extension, {
    fieldType: 'currency',
    currencyCode,
  });
}

export function formatMovementLinesTotal(
  total: number,
  currencyCode = 'USD',
): string {
  if (total === 0) {
    return '—';
  }
  return formatGridCellValue('unit_cost', total, {
    fieldType: 'currency',
    currencyCode,
  });
}
