import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/order_line_util.dart';
import 'package:emcap_mobile/utils/sales_order_util.dart';

void main() {
  test('canAddSalesOrderLine allows draft-only SO', () {
    expect(
      canAddSalesOrderLine('SALES_ORDER', {'id': 'so-1', 'status': 'draft'}),
      isTrue,
    );
    expect(
      canAddSalesOrderLine('SALES_ORDER', {'id': 'so-1', 'status': 'confirmed'}),
      isFalse,
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

  test('order line totals sum qty and extension', () {
    final lines = [
      {'product_id': 'p1', 'quantity': 2, 'unit_price': 15},
      {'product_id': 'p2', 'quantity': 3, 'unit_price': 10},
    ];
    expect(sumOrderLineQuantities(lines), 5);
    expect(sumOrderLineExtensions(lines), 60);
    expect(
      orderLineProductLabel(lines.first, {'p1': 'Bolt'}),
      'Bolt',
    );
  });
}
