import 'package:flutter_test/flutter_test.dart';
import 'package:emcap_mobile/metadata_contract.dart';
import 'package:emcap_mobile/utils/record_headline.dart';

String _t(String key) => key;

const _statusField = StatusFieldMetadata(
  field: 'active',
  activeValues: [true],
  labels: {
    'active': {'en': 'Active'},
    'inactive': {'en': 'Inactive'},
  },
);

void main() {
  test('buildRecordHeadlineView new record', () {
    final view = buildRecordHeadlineView('PRODUCT', {}, true, null, _t);
    expect(view.headline, 'entity.newRecord');
    expect(view.subtitle, 'entity.createSubtitle');
    expect(view.statusLabel, isEmpty);
  });

  test('buildRecordHeadlineView PRODUCT sku and name', () {
    final view = buildRecordHeadlineView(
      'PRODUCT',
      {'sku': 'SKU-1', 'name': 'Widget', 'quantity_on_hand': 5, 'unit_price': 9.99, 'active': true},
      false,
      'rec-1',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, 'SKU-1 — Widget');
    expect(view.subtitle, contains('entity.stockLine'));
    expect(view.statusLabel, 'Active');
    expect(view.statusActive, isTrue);
  });

  test('buildRecordHeadlineView WAREHOUSE code and name', () {
    final view = buildRecordHeadlineView(
      'WAREHOUSE',
      {'code': 'WH-01', 'name': 'Main', 'active': false},
      false,
      'wh-1',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, 'WH-01 — Main');
    expect(view.statusActive, isFalse);
  });

  test('buildRecordHeadlineView LEAD company and contact', () {
    final view = buildRecordHeadlineView(
      'LEAD',
      {'company': 'Acme', 'contact_name': 'Jane', 'active': true},
      false,
      'lead-1',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, 'Acme — Jane');
  });

  test('buildRecordHeadlineView CONTACT name and email subtitle', () {
    final view = buildRecordHeadlineView(
      'CONTACT',
      {'name': 'Bob', 'email': 'bob@example.com'},
      false,
      'c-1',
      _t,
    );
    expect(view.headline, 'Bob');
    expect(view.subtitle, 'bob@example.com');
  });

  test('buildRecordHeadlineView SUPPLIER code and name', () {
    final view = buildRecordHeadlineView(
      'SUPPLIER',
      {'code': 'SUP-01', 'name': 'Acme Supply', 'active': true},
      false,
      'sup-1',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, 'SUP-01 — Acme Supply');
  });

  test('buildRecordHeadlineView PURCHASE_ORDER po_number', () {
    final view = buildRecordHeadlineView(
      'PURCHASE_ORDER',
      {'po_number': 'PO-1001', 'status': 'draft'},
      false,
      'po-1',
      _t,
    );
    expect(view.headline, 'PO-1001');
  });

  test('buildRecordHeadlineView SALES_ORDER order_number', () {
    final view = buildRecordHeadlineView(
      'SALES_ORDER',
      {'order_number': 'SO-2001', 'status': 'draft'},
      false,
      'so-1',
      _t,
    );
    expect(view.headline, 'SO-2001');
  });

  test('buildRecordHeadlineView INVOICE invoice_number', () {
    final view = buildRecordHeadlineView(
      'INVOICE',
      {'invoice_number': 'INV-3001', 'status': 'draft'},
      false,
      'inv-1',
      _t,
    );
    expect(view.headline, 'INV-3001');
  });
}
