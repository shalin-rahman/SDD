import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/payment_util.dart';
import 'package:emcap_mobile/utils/purchase_order_util.dart';
import 'package:emcap_mobile/utils/sales_order_util.dart';

void main() {
  group('PURCHASE_ORDER receive contract', () {
    test('draft PO can be received', () {
      expect(
        canReceivePurchaseOrder(
          'PURCHASE_ORDER',
          {'id': 'po-1', 'status': 'draft'},
          orderLineCount: 1,
        ),
        isTrue,
      );
    });

    test('submitted PO can be received', () {
      expect(
        canReceivePurchaseOrder(
          'PURCHASE_ORDER',
          {'id': 'po-1', 'status': 'submitted'},
          orderLineCount: 1,
        ),
        isTrue,
      );
    });

    test('received PO cannot be received again', () {
      expect(
        canReceivePurchaseOrder('PURCHASE_ORDER', {'id': 'po-1', 'status': 'received'}),
        isFalse,
      );
    });

    test('new PO cannot receive before save', () {
      expect(
        canReceivePurchaseOrder('PURCHASE_ORDER', {'status': 'draft'}, creatingNew: true),
        isFalse,
      );
    });

    test('PO without lines cannot be received', () {
      expect(
        canReceivePurchaseOrder('PURCHASE_ORDER', {'id': 'po-1', 'status': 'draft'}),
        isFalse,
      );
      expect(
        canReceivePurchaseOrder(
          'PURCHASE_ORDER',
          {'id': 'po-1', 'status': 'draft'},
          orderLineCount: 1,
        ),
        isTrue,
      );
    });
  });

  group('PURCHASE_ORDER lines filter contract', () {
    final lines = [
      {'id': 'l1', 'po_id': 'po-1', 'product_id': 'prod-1', 'quantity': 5, 'unit_price': 10},
      {'id': 'l2', 'po_id': 'po-2', 'product_id': 'prod-2', 'quantity': 3, 'unit_price': 20},
      {'id': 'l3', 'po_id': 'po-1', 'product_id': 'prod-3', 'quantity': 1, 'unit_price': 5},
    ];

    test('filters lines by po_id', () {
      final filtered = filterPurchaseOrderLines(lines, 'po-1');
      expect(filtered.length, 2);
      expect(filtered.map((e) => e['id']), containsAll(['l1', 'l3']));
    });

    test('line extension multiplies qty and unit price', () {
      expect(purchaseOrderLineExtension(lines.first), 50);
    });
  });

  group('PURCHASE_ORDER add line contract', () {
    test('canAddPurchaseOrderLine for draft and submitted PO', () {
      expect(
        canAddPurchaseOrderLine('PURCHASE_ORDER', {'id': 'po-1', 'status': 'draft'}),
        isTrue,
      );
      expect(
        canAddPurchaseOrderLine('PURCHASE_ORDER', {'id': 'po-1', 'status': 'submitted'}),
        isTrue,
      );
      expect(
        canAddPurchaseOrderLine('PURCHASE_ORDER', {'id': 'po-1', 'status': 'received'}),
        isFalse,
      );
      expect(canAddPurchaseOrderLine('PRODUCT', {'id': 'po-1', 'status': 'draft'}), isFalse);
    });

    test('line quantity and unit price parse invalid values as zero', () {
      expect(purchaseOrderLineQuantity({'quantity': 'bad'}), 0);
      expect(purchaseOrderLineUnitPrice({'unit_price': ''}), 0);
    });

    test('canReceivePurchaseOrderStatus allows draft and submitted only', () {
      expect(canReceivePurchaseOrderStatus({'status': 'draft'}), isTrue);
      expect(canReceivePurchaseOrderStatus({'status': 'submitted'}), isTrue);
      expect(canReceivePurchaseOrderStatus({'status': 'received'}), isFalse);
    });

    test('canReceivePurchaseOrder uses recordId when id absent', () {
      expect(
        canReceivePurchaseOrder(
          'PURCHASE_ORDER',
          {'status': 'draft'},
          recordId: 'po-9',
          orderLineCount: 2,
        ),
        isTrue,
      );
    });

    test('canAddPurchaseOrderLine rejects creatingNew records', () {
      expect(
        canAddPurchaseOrderLine(
          'PURCHASE_ORDER',
          {'status': 'draft'},
          creatingNew: true,
        ),
        isFalse,
      );
    });

    test('filterPurchaseOrderLines ignores rows with mismatched po_id', () {
      expect(
        filterPurchaseOrderLines([
          {'id': 'l1', 'po_id': 'other'},
        ], 'po-1'),
        isEmpty,
      );
    });
  });

  group('SALES_ORDER line contract', () {
    test('draft SO allows add line', () {
      expect(
        canAddSalesOrderLine('SALES_ORDER', {'id': 'so-1', 'status': 'draft'}),
        isTrue,
      );
    });

    test('filters lines by sales_order_id', () {
      final lines = [
        {'id': 'l1', 'sales_order_id': 'so-1', 'quantity': 2, 'unit_price': 15},
        {'id': 'l2', 'sales_order_id': 'so-2', 'quantity': 1, 'unit_price': 10},
      ];
      expect(filterSalesOrderLines(lines, 'so-1'), hasLength(1));
    });
  });

  group('payment summary contract', () {
    test('PO summary uses total_amount amount_paid balance_due', () {
      final summary = buildPaymentSummary('PURCHASE_ORDER', {
        'total_amount': 100,
        'amount_paid': 40,
        'balance_due': 60,
      });
      expect(summary!.total, 100);
      expect(summary.paid, 40);
      expect(summary.balance, 60);
    });

    test('vendor payment allowed when balance due and not cancelled', () {
      expect(
        canRecordVendorPayment('PURCHASE_ORDER', {
          'id': 'po-1',
          'status': 'draft',
          'total_amount': 100,
          'amount_paid': 40,
          'balance_due': 60,
        }),
        isTrue,
      );
      expect(
        canRecordVendorPayment('PURCHASE_ORDER', {
          'id': 'po-1',
          'status': 'cancelled',
          'balance_due': 60,
        }),
        isFalse,
      );
    });

    test('collect payment allowed on open invoice', () {
      expect(
        canCollectCustomerPayment('INVOICE', {
          'id': 'inv-1',
          'status': 'sent',
          'amount': 200,
          'amount_paid': 50,
          'balance_due': 150,
        }),
        isTrue,
      );
    });

    test('vendor payment prefill includes supplier_id', () {
      expect(
        vendorPaymentPrefill({'supplier_id': 'sup-1'}, 'po-9'),
        {'po_id': 'po-9', 'supplier_id': 'sup-1'},
      );
    });
  });
}
