import 'package:flutter_test/flutter_test.dart';
import 'package:emcap_mobile/metadata_contract.dart';
import 'package:emcap_mobile/utils/status_chip_util.dart';

void main() {
  test('buildStatusChipView uses metadata labels', () {
    const field = StatusFieldMetadata(
      field: 'active',
      activeValues: [true],
      labels: {
        'active': {'en': 'Active'},
        'inactive': {'en': 'Inactive'},
      },
    );
    final view = buildStatusChipView(
      {'active': true},
      field,
      'en',
      (key) => key,
    );
    expect(view.label, 'Active');
    expect(view.active, isTrue);
  });

  test('buildStatusChipView returns empty when field missing', () {
    final view = buildStatusChipView({}, null, 'en', (key) => key);
    expect(view.label, isEmpty);
    expect(view.active, isFalse);
  });
}
