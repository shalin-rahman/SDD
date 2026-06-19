import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/stock_movement_util.dart';

void main() {
  group('canPostMovement', () {
    test('allows draft STOCK_MOVEMENT with saved id', () {
      expect(
        canPostMovement('STOCK_MOVEMENT', {'id': 'sm-1', 'status': 'draft'}),
        isTrue,
      );
    });

    test('rejects wrong entity, new record, non-draft status, empty id', () {
      expect(canPostMovement('PRODUCT', {'id': 'sm-1', 'status': 'draft'}), isFalse);
      expect(
        canPostMovement('STOCK_MOVEMENT', {'status': 'draft'}, creatingNew: true),
        isFalse,
      );
      expect(
        canPostMovement('STOCK_MOVEMENT', {'id': 'sm-1', 'status': 'posted'}),
        isFalse,
      );
      expect(canPostMovement('STOCK_MOVEMENT', {'status': 'draft'}), isFalse);
    });

    test('uses recordId parameter when record id absent', () {
      expect(
        canPostMovement(
          'STOCK_MOVEMENT',
          {'status': 'draft'},
          recordId: 'sm-9',
        ),
        isTrue,
      );
    });
  });

  group('filterMovementLines', () {
    test('filters lines by movement_id', () {
      final lines = [
        {'id': 'l1', 'movement_id': 'sm-1', 'quantity': 5},
        {'id': 'l2', 'movement_id': 'sm-2', 'quantity': 3},
        {'id': 'l3', 'movement_id': 'sm-1', 'quantity': 1},
      ];
      final filtered = filterMovementLines(lines, 'sm-1');
      expect(filtered, hasLength(2));
      expect(filtered.map((row) => row['id']), containsAll(['l1', 'l3']));
    });

    test('returns empty list when movement_id missing on rows', () {
      expect(
        filterMovementLines([{'id': 'l1', 'quantity': 1}], 'sm-1'),
        isEmpty,
      );
    });

    test('rejects empty recordId even when status is draft', () {
      expect(
        canPostMovement('STOCK_MOVEMENT', {'status': 'draft'}, recordId: ''),
        isFalse,
      );
    });
  });
}
