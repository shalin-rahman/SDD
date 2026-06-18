import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/record_lifecycle_util.dart';

void main() {
  test('isRecordDeleted detects deleted_at timestamp', () {
    expect(isRecordDeleted({'deleted_at': null}), isFalse);
    expect(isRecordDeleted({'deleted_at': '2026-01-01T00:00:00Z'}), isTrue);
    expect(isRecordDeleted({}), isFalse);
  });

  test('canDeleteRecord requires active record id', () {
    expect(canDeleteRecord('1', {'deleted_at': null}, false), isTrue);
    expect(canDeleteRecord('1', {'deleted_at': '2026-01-01T00:00:00Z'}, false), isFalse);
    expect(canDeleteRecord(null, {'deleted_at': null}, false), isFalse);
    expect(canDeleteRecord('1', {'deleted_at': null}, true), isFalse);
  });

  test('canRestoreRecord requires soft-deleted record', () {
    expect(canRestoreRecord('1', {'deleted_at': '2026-01-01T00:00:00Z'}), isTrue);
    expect(canRestoreRecord('1', {'deleted_at': null}), isFalse);
    expect(canRestoreRecord(null, {'deleted_at': '2026-01-01T00:00:00Z'}), isFalse);
  });
}
