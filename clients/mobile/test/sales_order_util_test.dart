import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/sales_order_util.dart';

void main() {
  test('canAddSalesOrderLine allows draft and confirmed SO', () {
    expect(
      canAddSalesOrderLine('SALES_ORDER', {'id': 'so-1', 'status': 'draft'}),
      isTrue,
    );
    expect(
      canAddSalesOrderLine('SALES_ORDER', {'id': 'so-1', 'status': 'confirmed'}),
      isTrue,
    );
    expect(
      canAddSalesOrderLine('SALES_ORDER', {'id': 'so-1', 'status': 'shipped'}),
      isFalse,
    );
    expect(canAddSalesOrderLine('PRODUCT', {'id': 'so-1', 'status': 'draft'}), isFalse);
    expect(
      canAddSalesOrderLine('SALES_ORDER', {'status': 'draft'}, creatingNew: true),
      isFalse,
    );
  });

  test('sales order line helpers parse and extend', () {
    final line = {'quantity': '2', 'unit_price': '15.5'};
    expect(salesOrderLineQuantity(line), 2);
    expect(salesOrderLineUnitPrice(line), 15.5);
    expect(salesOrderLineExtension(line), 31);
    expect(salesOrderLineQuantity({'quantity': 'x'}), 0);
  });

  test('filterSalesOrderLines keeps matching sales_order_id', () {
    final lines = [
      {'id': 'l1', 'sales_order_id': 'so-1'},
      {'id': 'l2', 'sales_order_id': 'so-2'},
    ];
    expect(filterSalesOrderLines(lines, 'so-1'), hasLength(1));
    expect(filterSalesOrderLines(lines, 'missing'), isEmpty);
  });
}
