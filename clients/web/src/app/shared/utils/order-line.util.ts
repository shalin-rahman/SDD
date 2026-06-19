import { formatGridCellValue } from './field-display.util';
import {
  buildProductLabelMap,
  resolveProductLabel,
} from './movement-line.util';

export const PO_LINE_PARENT_FIELD = 'po_id';
export const SO_LINE_PARENT_FIELD = 'sales_order_id';

/** Filter order line rows for a parent PO or SO — mobile parity target. */
export function filterOrderLines(
  lines: Record<string, unknown>[],
  parentIdField: string,
  parentId: string,
): Record<string, unknown>[] {
  return lines.filter((row) => String(row[parentIdField] ?? '') === parentId);
}

export function orderLineQuantity(line: Record<string, unknown>): number {
  const raw = line['quantity'] ?? line['qty'];
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function orderLineUnitPrice(line: Record<string, unknown>): number {
  const value = Number(line['unit_price']);
  return Number.isFinite(value) ? value : 0;
}

export function orderLineExtension(line: Record<string, unknown>): number {
  return orderLineQuantity(line) * orderLineUnitPrice(line);
}

export function sumOrderLineQuantities(lines: Record<string, unknown>[]): number {
  return lines.reduce((sum, line) => sum + orderLineQuantity(line), 0);
}

export function sumOrderLineExtensions(lines: Record<string, unknown>[]): number {
  return lines.reduce((sum, line) => sum + orderLineExtension(line), 0);
}

export function formatOrderLineQuantity(line: Record<string, unknown>): string {
  const qty = orderLineQuantity(line);
  return qty === 0 ? '—' : String(qty);
}

export function formatOrderLineUnitPrice(
  line: Record<string, unknown>,
  currencyCode = 'USD',
): string {
  return formatGridCellValue('unit_price', line['unit_price'], {
    fieldType: 'currency',
    currencyCode,
  });
}

export function formatOrderLineExtension(
  line: Record<string, unknown>,
  currencyCode = 'USD',
): string {
  const extension = orderLineExtension(line);
  if (extension === 0) {
    return '—';
  }
  return formatGridCellValue('unit_price', extension, {
    fieldType: 'currency',
    currencyCode,
  });
}

export function formatOrderLinesTotal(total: number, currencyCode = 'USD'): string {
  if (total === 0) {
    return '—';
  }
  return formatGridCellValue('unit_price', total, {
    fieldType: 'currency',
    currencyCode,
  });
}

export function orderLineProductLabel(
  line: Record<string, unknown>,
  labels: Record<string, string>,
): string {
  return resolveProductLabel(String(line['product_id'] ?? ''), labels);
}

export { buildProductLabelMap, resolveProductLabel };
