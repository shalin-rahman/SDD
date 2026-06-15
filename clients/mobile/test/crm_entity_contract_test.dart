import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/metadata_contract.dart';
import 'package:emcap_mobile/utils/field_display.dart';
import 'package:emcap_mobile/utils/record_headline.dart';

import 'support/entity_fixtures.dart';

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
  group('LEAD CRM contract', () {
    test('form and grid fixtures include CRM profile fields', () {
      expect(loadEntityFormFieldNames('LEAD'), containsAll(['company', 'contact_name', 'status', 'active']));
      expect(loadEntityGridColumnFields('LEAD'), containsAll(['company', 'status', 'active']));
    });

    test('hero uses company and contact_name', () {
      final view = buildRecordHeadlineView(
        'LEAD',
        {'company': 'Globex', 'contact_name': 'Pat', 'status': 'won', 'active': true},
        false,
        'lead-2',
        _t,
        statusField: _statusField,
      );
      expect(view.headline, 'Globex — Pat');
      expect(view.statusLabel, 'Active');
      expect(view.statusActive, isTrue);
    });

    test('hero uses company only when contact_name missing', () {
      final view = buildRecordHeadlineView(
        'LEAD',
        {'company': 'Solo Corp', 'status': 'new', 'active': true},
        false,
        'lead-3',
        _t,
        statusField: _statusField,
      );
      expect(view.headline, 'Solo Corp');
      expect(view.statusLabel, 'Active');
      expect(view.statusActive, isTrue);
    });

    test('hero reflects inactive active flag', () {
      final view = buildRecordHeadlineView(
        'LEAD',
        {'company': 'Globex', 'contact_name': 'Pat', 'status': 'lost', 'active': false},
        false,
        'lead-4',
        _t,
        statusField: _statusField,
      );
      expect(view.headline, 'Globex — Pat');
      expect(view.statusLabel, 'Inactive');
      expect(view.statusActive, isFalse);
    });

    test('grid formats status enum and active boolean', () {
      expect(formatGridCellValue('status', 'lost', fieldType: 'select'), 'lost');
      expect(formatGridCellValue('active', true), 'Yes');
      expect(formatGridCellValue('active', false), 'No');
    });
  });

  group('CONTACT CRM contract', () {
    test('form and grid fixtures include lead lookup', () {
      expect(loadEntityFormFieldNames('CONTACT'), containsAll(['name', 'email', 'lead_id', 'active']));
      expect(loadEntityGridColumnFields('CONTACT'), contains('lead_id'));
    });

    test('hero uses name with email subtitle', () {
      final view = buildRecordHeadlineView(
        'CONTACT',
        {'name': 'Sam', 'email': 'sam@globex.com', 'lead_id': 'lead-2', 'active': false},
        false,
        'contact-2',
        _t,
        statusField: _statusField,
      );
      expect(view.headline, 'Sam');
      expect(view.subtitle, 'sam@globex.com');
      expect(view.statusLabel, 'Inactive');
      expect(view.statusActive, isFalse);
    });

    test('hero keeps record id subtitle when email absent', () {
      final view = buildRecordHeadlineView(
        'CONTACT',
        {'name': 'Sam', 'lead_id': 'lead-2', 'active': true},
        false,
        'contact-3',
        _t,
        statusField: _statusField,
      );
      expect(view.headline, 'Sam');
      expect(view.subtitle, 'contact-3');
      expect(view.statusLabel, 'Active');
    });

    test('grid formats email and lookup id', () {
      expect(formatGridCellValue('email', 'sam@globex.com'), 'sam@globex.com');
      expect(formatGridCellValue('lead_id', 'lead-2', fieldType: 'lookup'), 'lead-2');
    });
    test('LEAD and CONTACT fixtures align with W1 rollout', () {
      for (final entity in ['LEAD', 'CONTACT']) {
        expect(entityFixtureExists(entity, 'form.keys'), isTrue, reason: entity);
        expect(entityFixtureExists(entity, 'grid.keys'), isTrue, reason: entity);
      }
    });
  });
}
