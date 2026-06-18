import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/record_lifecycle_util.dart';

void main() {
  group('STOCK_MOVEMENT post flow contract', () {
    bool canPostMovement(String entityCode, Map<String, dynamic> record, {bool creatingNew = false}) {
      return entityCode == 'STOCK_MOVEMENT' &&
          !creatingNew &&
          record['id'] != null &&
          '${record['status'] ?? ''}' == 'draft';
    }

    test('draft movement can be posted', () {
      expect(
        canPostMovement('STOCK_MOVEMENT', {'id': 'mov-1', 'status': 'draft'}),
        isTrue,
      );
    });

    test('posted movement cannot be posted again', () {
      expect(
        canPostMovement('STOCK_MOVEMENT', {'id': 'mov-1', 'status': 'posted'}),
        isFalse,
      );
    });

    test('non-movement entity never posts', () {
      expect(
        canPostMovement('PRODUCT', {'id': 'p-1', 'status': 'draft'}),
        isFalse,
      );
    });
  });

  group('STOCK_MOVEMENT lines filter contract', () {
    test('filters lines by movement_id', () {
      final lines = [
        {'id': 'l1', 'movement_id': 'mov-1', 'product_id': 'prod-1', 'quantity': 5},
        {'id': 'l2', 'movement_id': 'mov-2', 'product_id': 'prod-2', 'quantity': 3},
        {'id': 'l3', 'movement_id': 'mov-1', 'product_id': 'prod-3', 'quantity': 1},
      ];
      final filtered = lines.where((row) => '${row['movement_id'] ?? ''}' == 'mov-1').toList();
      expect(filtered.length, 2);
      expect(filtered.map((e) => e['id']), containsAll(['l1', 'l3']));
    });
  });

  group('soft delete on movement record', () {
    test('deleted movement shows restore not delete', () {
      const recordId = 'mov-del';
      final record = {'id': recordId, 'status': 'posted', 'deleted_at': '2026-06-01T00:00:00Z'};
      expect(canDeleteRecord(recordId, record, false), isFalse);
      expect(canRestoreRecord(recordId, record), isTrue);
    });
  });
}
