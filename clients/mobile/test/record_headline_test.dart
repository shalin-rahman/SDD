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
      {'company': 'Acme', 'contact_name': 'Jane', 'active': true, 'status': 'qualified'},
      false,
      'lead-1',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, 'Acme — Jane');
    expect(view.statusLabel, 'Active');
    expect(view.statusActive, isTrue);
  });

  test('buildRecordHeadlineView CONTACT name and email subtitle', () {
    final view = buildRecordHeadlineView(
      'CONTACT',
      {'name': 'Bob', 'email': 'bob@example.com', 'active': true},
      false,
      'c-1',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, 'Bob');
    expect(view.subtitle, 'bob@example.com');
    expect(view.statusLabel, 'Active');
    expect(view.statusActive, isTrue);
  });

  test('buildRecordHeadlineView LEAD inactive status chip', () {
    final view = buildRecordHeadlineView(
      'LEAD',
      {'company': 'Acme', 'contact_name': 'Jane', 'active': false, 'status': 'lost'},
      false,
      'lead-2',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, 'Acme — Jane');
    expect(view.statusLabel, 'Inactive');
    expect(view.statusActive, isFalse);
  });

  test('buildRecordHeadlineView JOURNAL_ENTRY reference', () {
    final view = buildRecordHeadlineView(
      'JOURNAL_ENTRY',
      {'reference': 'JE-001', 'amount': 100, 'active': true},
      false,
      'je-1',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, 'JE-001');
  });

  test('buildRecordHeadlineView SALE receipt_no', () {
    final view = buildRecordHeadlineView(
      'SALE',
      {'receipt_no': 'R-1001', 'total': 49.99, 'active': true},
      false,
      'sale-1',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, 'R-1001');
  });

  test('buildRecordHeadlineView LEAVE_REQUEST leave_type and days', () {
    final view = buildRecordHeadlineView(
      'LEAVE_REQUEST',
      {'employee_id': 'emp-1', 'leave_type': 'annual', 'days': 5, 'active': true},
      false,
      'lr-1',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, 'annual — 5');
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

  test('buildRecordHeadlineView STOCK_MOVEMENT movement_number', () {
    final view = buildRecordHeadlineView(
      'STOCK_MOVEMENT',
      {'movement_number': 'SM-1001', 'movement_type': 'receive', 'status': 'draft'},
      false,
      'sm-1',
      _t,
    );
    expect(view.headline, 'SM-1001');
  });

  test('buildRecordHeadlineView STOCK_MOVEMENT_LINE quantity and unit_cost', () {
    final view = buildRecordHeadlineView(
      'STOCK_MOVEMENT_LINE',
      {'movement_id': 'sm-1', 'product_id': 'prod-1', 'quantity': 10, 'unit_cost': 4.5},
      false,
      'sml-1',
      _t,
    );
    expect(view.headline, '10 — 4.5');
  });

  test('buildRecordHeadlineView ACCOUNT code and name', () {
    final view = buildRecordHeadlineView(
      'ACCOUNT',
      {'code': '1000', 'name': 'Cash', 'balance': 50000.0, 'active': true},
      false,
      'acc-1',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, '1000 — Cash');
    expect(view.statusActive, isTrue);
  });

  test('buildRecordHeadlineView TERMINAL terminal_id and location', () {
    final view = buildRecordHeadlineView(
      'TERMINAL',
      {'terminal_id': 'T-01', 'location': 'Front Desk', 'active': true},
      false,
      'term-1',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, 'T-01 — Front Desk');
  });

  test('buildRecordHeadlineView EMPLOYEE employee_no and full_name', () {
    final view = buildRecordHeadlineView(
      'EMPLOYEE',
      {'employee_no': 'EMP-001', 'full_name': 'Jane Doe', 'department': 'sales', 'active': true},
      false,
      'emp-1',
      _t,
      statusField: _statusField,
    );
    expect(view.headline, 'EMP-001 — Jane Doe');
  });

  test('buildRecordHeadlineView falls back to record id when fields empty', () {
    expect(
      buildRecordHeadlineView('PRODUCT', {}, false, 'prod-x', _t).headline,
      'entity.record prod-x',
    );
    expect(
      buildRecordHeadlineView('CUSTOMER', {}, false, 'cust-x', _t).headline,
      'entity.record cust-x',
    );
    expect(
      buildRecordHeadlineView('JOURNAL_ENTRY', {}, false, 'je-x', _t).headline,
      'entity.record je-x',
    );
    expect(
      buildRecordHeadlineView('CONTACT', {}, false, 'c-x', _t).headline,
      'entity.record c-x',
    );
  });

  test('buildRecordHeadlineView CUSTOMER name-only headline', () {
    final view = buildRecordHeadlineView(
      'CUSTOMER',
      {'name': 'Acme Corp'},
      false,
      'cust-1',
      _t,
    );
    expect(view.headline, 'Acme Corp');
  });

  test('buildRecordHeadlineView CUSTOMER code and name dual headline', () {
    final view = buildRecordHeadlineView(
      'CUSTOMER',
      {'code': 'C-01', 'name': 'Acme Corp'},
      false,
      'cust-1',
      _t,
    );
    expect(view.headline, 'C-01 — Acme Corp');
  });

  test('buildRecordHeadlineView uses single side of dual headline when other empty', () {
    expect(
      buildRecordHeadlineView('PRODUCT', {'sku': 'SKU-1'}, false, 'p-1', _t).headline,
      'SKU-1',
    );
    expect(
      buildRecordHeadlineView('WAREHOUSE', {'name': 'Main'}, false, 'w-1', _t).headline,
      'Main',
    );
    expect(
      buildRecordHeadlineView('LEAD', {'company': 'Acme'}, false, 'l-1', _t).headline,
      'Acme',
    );
  });

  test('buildRecordHeadlineView generic entity uses record id subtitle', () {
    final view = buildRecordHeadlineView('PRODUCT', {'sku': 'X'}, false, 'rec-9', _t);
    expect(view.subtitle, 'rec-9');
  });
}
