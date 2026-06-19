import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/payment_util.dart';

void main() {
  group('showPaymentSummaryCard', () {
    test('returns true for PO and INVOICE', () {
      expect(showPaymentSummaryCard('PURCHASE_ORDER'), isTrue);
      expect(showPaymentSummaryCard('INVOICE'), isTrue);
      expect(showPaymentSummaryCard('PRODUCT'), isFalse);
    });
  });

  group('buildPaymentSummary', () {
    test('PO computes balance when balance_due absent', () {
      final summary = buildPaymentSummary('PURCHASE_ORDER', {
        'total_amount': 100,
        'amount_paid': 40,
      });
      expect(summary!.total, 100);
      expect(summary.paid, 40);
      expect(summary.balance, 60);
    });

    test('INVOICE uses amount field', () {
      final summary = buildPaymentSummary('INVOICE', {
        'amount': 200,
        'amount_paid': 50,
        'balance_due': 150,
      });
      expect(summary!.total, 200);
      expect(summary.balance, 150);
    });

    test('returns null for unsupported entity', () {
      expect(buildPaymentSummary('PRODUCT', {}), isNull);
    });
  });

  group('canRecordVendorPayment', () {
    test('rejects wrong entity, new record, cancelled, zero balance', () {
      expect(
        canRecordVendorPayment('INVOICE', {'id': 'x', 'balance_due': 10}),
        isFalse,
      );
      expect(
        canRecordVendorPayment('PURCHASE_ORDER', {'status': 'draft', 'balance_due': 10},
            creatingNew: true),
        isFalse,
      );
      expect(
        canRecordVendorPayment('PURCHASE_ORDER', {
          'id': 'po-1',
          'status': 'cancelled',
          'balance_due': 10,
        }),
        isFalse,
      );
      expect(
        canRecordVendorPayment('PURCHASE_ORDER', {
          'id': 'po-1',
          'status': 'received',
          'balance_due': 0,
        }),
        isFalse,
      );
    });

    test('allows PO with outstanding balance', () {
      expect(
        canRecordVendorPayment('PURCHASE_ORDER', {
          'id': 'po-1',
          'status': 'received',
          'balance_due': 25,
        }),
        isTrue,
      );
    });
  });

  group('canCollectCustomerPayment', () {
    test('rejects paid, void, and zero balance invoices', () {
      expect(
        canCollectCustomerPayment('INVOICE', {
          'id': 'inv-1',
          'status': 'paid',
          'balance_due': 10,
        }),
        isFalse,
      );
      expect(
        canCollectCustomerPayment('INVOICE', {
          'id': 'inv-1',
          'status': 'void',
          'balance_due': 10,
        }),
        isFalse,
      );
      expect(
        canCollectCustomerPayment('INVOICE', {
          'id': 'inv-1',
          'status': 'sent',
          'balance_due': 0,
        }),
        isFalse,
      );
    });

    test('allows open invoice with balance', () {
      expect(
        canCollectCustomerPayment('INVOICE', {
          'id': 'inv-1',
          'status': 'sent',
          'balance_due': 150,
        }),
        isTrue,
      );
    });
  });

  group('payment prefill helpers', () {
    test('vendorPaymentPrefill includes supplier when present', () {
      expect(vendorPaymentPrefill({'supplier_id': 'sup-1'}, 'po-9'), {
        'po_id': 'po-9',
        'supplier_id': 'sup-1',
      });
      expect(vendorPaymentPrefill({}, 'po-9'), {'po_id': 'po-9'});
    });

    test('customerPaymentPrefill includes customer when present', () {
      expect(customerPaymentPrefill({'customer_id': 'cust-1'}, 'inv-9'), {
        'invoice_id': 'inv-9',
        'customer_id': 'cust-1',
      });
      expect(customerPaymentPrefill({}, 'inv-9'), {'invoice_id': 'inv-9'});
    });
  });
}
