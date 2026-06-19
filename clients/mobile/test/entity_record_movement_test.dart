import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/record_lifecycle_util.dart';
import 'package:emcap_mobile/utils/stock_movement_util.dart';

void main() {
  group('STOCK_MOVEMENT post flow contract', () {
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

    test('new movement cannot post before save', () {
      expect(
        canPostMovement('STOCK_MOVEMENT', {'status': 'draft'}, creatingNew: true),
        isFalse,
      );
    });

    test('movement without id cannot post', () {
      expect(
        canPostMovement('STOCK_MOVEMENT', {'status': 'draft'}),
        isFalse,
      );
    });

    test('recordId parameter overrides record map id', () {
      expect(
        canPostMovement(
          'STOCK_MOVEMENT',
          {'status': 'draft'},
          recordId: 'mov-9',
        ),
        isTrue,
      );
    });
  });

  group('STOCK_MOVEMENT lines filter contract', () {
    final lines = [
      {'id': 'l1', 'movement_id': 'mov-1', 'product_id': 'prod-1', 'quantity': 5},
      {'id': 'l2', 'movement_id': 'mov-2', 'product_id': 'prod-2', 'quantity': 3},
      {'id': 'l3', 'movement_id': 'mov-1', 'product_id': 'prod-3', 'quantity': 1},
    ];

    test('filters lines by movement_id', () {
      final filtered = filterMovementLines(lines, 'mov-1');
      expect(filtered.length, 2);
      expect(filtered.map((e) => e['id']), containsAll(['l1', 'l3']));
    });

    test('empty movement_id matches only blank rows', () {
      final withBlank = [
        ...lines,
        {'id': 'l4', 'movement_id': '', 'product_id': 'prod-4', 'quantity': 2},
      ];
      expect(filterMovementLines(withBlank, ''), hasLength(1));
      expect(filterMovementLines(withBlank, 'mov-2'), hasLength(1));
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
