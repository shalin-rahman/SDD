import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/order_line_util.dart';

void main() {
  group('product label cache', () {
    test('buildProductLabelMap prefers name then code', () {
      final labels = buildProductLabelMap([
        {'id': 'p1', 'name': 'Widget A', 'code': 'W-A'},
        {'id': 'p2', 'code': 'CODE-B'},
      ]);
      expect(labels['p1'], 'Widget A');
      expect(labels['p2'], 'CODE-B');
    });

    test('resolveProductLabel falls back to id when missing', () {
      final labels = {'p1': 'Widget A'};
      expect(resolveProductLabel('p1', labels), 'Widget A');
      expect(resolveProductLabel('unknown', labels), 'unknown');
      expect(resolveProductLabel('', labels), '—');
    });

    test('orderLineProductLabel reads product_id from line', () {
      final labels = {'prod-1': 'Hammer'};
      expect(
        orderLineProductLabel({'product_id': 'prod-1'}, labels),
        'Hammer',
      );
      expect(orderLineProductLabel({'product_id': ''}, labels), '—');
    });
  });

  group('order line totals', () {
    final lines = [
      {'quantity': 2, 'unit_price': 10},
      {'quantity': 3, 'unit_price': 5},
    ];

    test('sumOrderLineQuantities and sumOrderLineExtensions', () {
      expect(sumOrderLineQuantities(lines), 5);
      expect(sumOrderLineExtensions(lines), 35);
    });

    test('orderLineExtension parses invalid values as zero', () {
      expect(orderLineExtension({'quantity': 'x', 'unit_price': 5}), 0);
      expect(orderLineUnitPrice({'unit_price': ''}), 0);
    });
  });
}
