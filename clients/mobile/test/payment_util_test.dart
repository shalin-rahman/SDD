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

    test('INVOICE computes balance when balance_due absent', () {
      final summary = buildPaymentSummary('INVOICE', {
        'amount': 200,
        'amount_paid': 50,
      });
      expect(summary!.balance, 150);
    });

    test('returns null for unsupported entity', () {
      expect(buildPaymentSummary('PRODUCT', {}), isNull);
    });

    test('parses non-numeric amounts as zero', () {
      final summary = buildPaymentSummary('PURCHASE_ORDER', {
        'total_amount': 'bad',
        'amount_paid': null,
        'balance_due': 'n/a',
      });
      expect(summary!.total, 0);
      expect(summary.paid, 0);
      expect(summary.balance, 0);
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

    test('uses recordId parameter when id absent on record', () {
      expect(
        canRecordVendorPayment(
          'PURCHASE_ORDER',
          {'status': 'received', 'balance_due': 10},
          recordId: 'po-2',
        ),
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

    test('rejects creatingNew invoice even with balance', () {
      expect(
        canCollectCustomerPayment(
          'INVOICE',
          {'status': 'sent', 'balance_due': 10},
          creatingNew: true,
        ),
        isFalse,
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

    test('prefill skips empty supplier and customer ids', () {
      expect(vendorPaymentPrefill({'supplier_id': ''}, 'po-9'), {'po_id': 'po-9'});
      expect(customerPaymentPrefill({'customer_id': ''}, 'inv-9'), {'invoice_id': 'inv-9'});
    });
  });

  group('payment history helpers', () {
    test('filterVendorPayments and filterCustomerPayments match parent id', () {
      final vendorPayments = [
        {'id': 'vp-1', 'po_id': 'po-1', 'amount': 10},
        {'id': 'vp-2', 'po_id': 'po-1', 'amount': 20},
        {'id': 'vp-3', 'po_id': 'po-2', 'amount': 5},
      ];
      expect(filterVendorPayments(vendorPayments, 'po-1').length, 2);
      expect(filterVendorPayments(vendorPayments, 'missing'), isEmpty);

      final customerPayments = [
        {'id': 'cp-1', 'invoice_id': 'inv-1', 'amount': 50},
        {'id': 'cp-2', 'invoice_id': 'inv-2', 'amount': 25},
      ];
      expect(filterCustomerPayments(customerPayments, 'inv-1').length, 1);
      expect(filterCustomerPayments(customerPayments, 'missing'), isEmpty);
    });

    test('paymentNumberLabel prefers payment_number then id', () {
      expect(paymentNumberLabel({'payment_number': 'P-1'}), 'P-1');
      expect(paymentNumberLabel({'payment_number': '  ', 'id': 'pay-99'}), 'pay-99');
      expect(paymentNumberLabel({}), '—');
    });

    test('formatPaymentAmount and formatPaymentDate handle empty values', () {
      expect(formatPaymentAmount(0), '—');
      expect(formatPaymentAmount(42.5), contains('42.50'));
      expect(formatPaymentDate({}), '—');
      expect(formatPaymentDate({'payment_date': '2026-03-01'}), isNot('—'));
    });

    test('paymentStatusLabel falls back to dash', () {
      expect(paymentStatusLabel({'status': 'posted'}), 'posted');
      expect(paymentStatusLabel({}), '—');
    });

    test('showVendorPaymentsSection and showCustomerPaymentsSection', () {
      expect(showVendorPaymentsSection('PURCHASE_ORDER'), isTrue);
      expect(showVendorPaymentsSection('INVOICE'), isFalse);
      expect(showCustomerPaymentsSection('INVOICE'), isTrue);
      expect(showCustomerPaymentsSection('PURCHASE_ORDER'), isFalse);
    });
  });
}
