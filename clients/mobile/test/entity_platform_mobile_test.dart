import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/metadata_contract.dart';
import 'package:emcap_mobile/utils/field_display.dart';
import 'package:emcap_mobile/utils/record_headline.dart';
import 'package:emcap_mobile/utils/record_lifecycle_util.dart';
import 'package:emcap_mobile/utils/status_chip_util.dart';

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
  group('lookup field contract', () {
    test('FormMetadata parses lookup field with lookup_entity', () {
      final form = FormMetadata.fromJson({
        'schema_version': '1.0',
        'entity_code': 'CONTACT',
        'sections': [
          {
            'code': 'main',
            'label': 'Main',
            'fields': [
              {
                'name': 'lead_id',
                'label': 'Lead',
                'field_type': 'lookup',
                'lookup_entity': 'LEAD',
                'row': 0,
                'col': 0,
                'span': 12,
              },
            ],
          },
        ],
        'conditions': [],
      });
      final field = DynamicFormRenderer(form).getField('lead_id');
      expect(field?.fieldType, 'lookup');
      expect(field?.lookupEntity, 'LEAD');
    });

    test('grid formats lookup id as display value', () {
      expect(formatGridCellValue('lead_id', 'lead-2', fieldType: 'lookup'), 'lead-2');
    });
  });

  group('status chip contract', () {
    test('buildStatusChipView resolves active label from metadata', () {
      final chip = buildStatusChipView({'active': true}, _statusField, 'en', _t);
      expect(chip.label, 'Active');
      expect(chip.active, isTrue);
    });

    test('buildStatusChipView resolves inactive label from metadata', () {
      final chip = buildStatusChipView({'active': false}, _statusField, 'en', _t);
      expect(chip.label, 'Inactive');
      expect(chip.active, isFalse);
    });

    test('buildStatusChipView returns empty when statusField null', () {
      final chip = buildStatusChipView({'active': true}, null, 'en', _t);
      expect(chip.label, isEmpty);
      expect(chip.active, isFalse);
    });

    test('PRODUCT hero attaches status chip from display metadata', () {
      final view = buildRecordHeadlineView(
        'PRODUCT',
        {'sku': 'SKU-1', 'name': 'Widget', 'active': true},
        false,
        'prod-1',
        _t,
        statusField: _statusField,
      );
      expect(view.statusLabel, 'Active');
      expect(view.statusActive, isTrue);
    });
  });

  group('soft delete UX contract', () {
    test('active record allows delete blocks restore', () {
      const id = 'rec-1';
      final record = {'id': id, 'deleted_at': null};
      expect(canDeleteRecord(id, record, false), isTrue);
      expect(canRestoreRecord(id, record), isFalse);
      expect(canDeleteRecord(id, record, true), isFalse);
    });

    test('empty deleted_at is not deleted', () {
      expect(isRecordDeleted({'deleted_at': '   '}), isFalse);
    });

    test('soft-deleted record allows restore blocks delete', () {
      const id = 'rec-2';
      final record = {'id': id, 'deleted_at': '2026-06-14T10:00:00Z'};
      expect(isRecordDeleted(record), isTrue);
      expect(canDeleteRecord(id, record, false), isFalse);
      expect(canRestoreRecord(id, record), isTrue);
    });
  });
}
