import {
  canAddPurchaseOrderLine,
  canReceivePurchaseOrder,
  canReceivePurchaseOrderStatus,
  filterPurchaseOrderLines,
} from './purchase_order_util';

describe('purchase_order_util', () => {
  const draftPo = { id: 'po-1', status: 'draft' };

  it('detects receivable PO statuses', () => {
    expect(canReceivePurchaseOrderStatus({ status: 'draft' })).toBeTrue();
    expect(canReceivePurchaseOrderStatus({ status: 'submitted' })).toBeTrue();
    expect(canReceivePurchaseOrderStatus({ status: 'received' })).toBeFalse();
    expect(canReceivePurchaseOrderStatus({})).toBeFalse();
  });

  it('guards receive action by entity, id, lines, and status', () => {
    expect(
      canReceivePurchaseOrder('PURCHASE_ORDER', draftPo, {
        recordId: 'po-1',
        orderLineCount: 2,
      }),
    ).toBeTrue();
    expect(
      canReceivePurchaseOrder('PURCHASE_ORDER', draftPo, {
        recordId: 'po-1',
        orderLineCount: 0,
      }),
    ).toBeFalse();
    expect(
      canReceivePurchaseOrder('SALES_ORDER', draftPo, {
        recordId: 'po-1',
        orderLineCount: 1,
      }),
    ).toBeFalse();
    expect(
      canReceivePurchaseOrder('PURCHASE_ORDER', draftPo, {
        creatingNew: true,
        orderLineCount: 1,
      }),
    ).toBeFalse();
  });

  it('allows adding PO lines in draft or submitted status', () => {
    expect(
      canAddPurchaseOrderLine('PURCHASE_ORDER', { status: 'draft' }, { recordId: 'po-1' }),
    ).toBeTrue();
    expect(
      canAddPurchaseOrderLine('PURCHASE_ORDER', { status: 'received' }, { recordId: 'po-1' }),
    ).toBeFalse();
    expect(
      canAddPurchaseOrderLine('SALES_ORDER', { status: 'draft' }, { recordId: 'so-1' }),
    ).toBeFalse();
  });

  it('filters purchase order lines by po_id', () => {
    const lines = [
      { id: 'l1', po_id: 'po-1' },
      { id: 'l2', po_id: 'po-2' },
    ];
    expect(filterPurchaseOrderLines(lines, 'po-1').length).toBe(1);
    expect(filterPurchaseOrderLines(lines, 'missing')).toEqual([]);
  });

  it('resolves record id from the PO record when recordId is omitted', () => {
    expect(canReceivePurchaseOrder('PURCHASE_ORDER', { id: 'po-9', status: 'draft' }, { orderLineCount: 1 })).toBeTrue();
    expect(canAddPurchaseOrderLine('PURCHASE_ORDER', { id: 'po-9', status: 'draft' })).toBeTrue();
    expect(canReceivePurchaseOrder('PURCHASE_ORDER', { status: 'draft' }, { orderLineCount: 1 })).toBeFalse();
  });
});
