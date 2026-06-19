import {
  filterOrderLines,
  PO_LINE_PARENT_FIELD,
} from './order-line.util';

export const PO_LINE_ENTITY_CODE = 'PURCHASE_ORDER_LINE';
export const PO_CREATE_PREFILL_PARAM = 'po_id';

/** Whether PO status allows receive or line edits — mobile `canReceivePurchaseOrder` parity. */
export function canReceivePurchaseOrderStatus(record: Record<string, unknown>): boolean {
  const status = String(record['status'] ?? '');
  return status === 'draft' || status === 'submitted';
}

export function canReceivePurchaseOrder(
  entityCode: string,
  record: Record<string, unknown>,
  options: {
    recordId?: string | null;
    creatingNew?: boolean;
    orderLineCount?: number;
  } = {},
): boolean {
  const { recordId, creatingNew = false, orderLineCount = 0 } = options;
  const id = recordId ?? String(record['id'] ?? '');
  if (entityCode !== 'PURCHASE_ORDER' || !id || creatingNew) {
    return false;
  }
  if (orderLineCount <= 0) {
    return false;
  }
  return canReceivePurchaseOrderStatus(record);
}

export function canAddPurchaseOrderLine(
  entityCode: string,
  record: Record<string, unknown>,
  options: { recordId?: string | null; creatingNew?: boolean } = {},
): boolean {
  const { recordId, creatingNew = false } = options;
  const id = recordId ?? String(record['id'] ?? '');
  if (entityCode !== 'PURCHASE_ORDER' || !id || creatingNew) {
    return false;
  }
  return canReceivePurchaseOrderStatus(record);
}

export function filterPurchaseOrderLines(
  lines: Record<string, unknown>[],
  poId: string,
): Record<string, unknown>[] {
  return filterOrderLines(lines, PO_LINE_PARENT_FIELD, poId);
}
