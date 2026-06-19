import 'package:flutter_test/flutter_test.dart';
import 'package:emcap_mobile/metadata_contract.dart';
import 'package:emcap_mobile/utils/field_display.dart';

import 'support/field_types_fixture.dart';
import 'support/screen_test_harness.dart';

const _systemFieldNames = [
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'record_version',
  'deleted_at',
];

FormMetadata productFormWithSystemSection() {
  return FormMetadata.fromJson({
    'schema_version': '1.0',
    'entity_code': 'PRODUCT',
    'sections': [
      {
        'code': 'main',
        'label': 'Main',
        'fields': [
          {
            'name': 'sku',
            'label': 'SKU',
            'field_type': 'text',
            'required': true,
            'row': 0,
            'col': 0,
            'span': 6,
          },
        ],
      },
      {
        'code': 'system',
        'label': 'System',
        'fields': _systemFieldNames
            .map(
              (name) => {
                'name': name,
                'label': name,
                'field_type': name.endsWith('_at') ? 'datetime' : 'text',
                'read_only': true,
                'row': 0,
                'col': 0,
                'span': 6,
              },
            )
            .toList(),
      },
    ],
    'conditions': [],
    'display': {
      'status_field': {
        'field': 'active',
        'active_values': [true],
        'labels': {
          'active': {'en': 'Active'},
          'inactive': {'en': 'Inactive'},
        },
      },
    },
  });
}

void main() {
  setUpAll(() async {
    await initIntlDateFormatting();
  });

  test('PRODUCT form has system section with read-only audit fields', () {
    final form = productFormWithSystemSection();
    final renderer = DynamicFormRenderer(form);
    expect(form.sections.map((s) => s['code']), ['main', 'system']);
    expect(renderer.sectionFieldNames('system'), _systemFieldNames);
    for (final name in _systemFieldNames) {
      expect(renderer.isReadOnly(name), isTrue, reason: name);
    }
  });

  test('grid keys fixture includes system columns after business fields', () {
    final keys = loadProductGridKeysFixture();
    final columns = List<String>.from(keys['column_fields'] as List);
    expect(columns, containsAll(['created_at', 'updated_at', 'created_by', 'record_version']));
    expect(columns.indexOf('created_at'), greaterThan(columns.indexOf('sku')));
  });

  test('formats system datetime fields for record display', () {
    final formatted = formatRecordFieldValue(
      'created_at',
      'datetime',
      '2026-06-13T12:00:00Z',
      locale: 'en',
    );
    expect(formatted, isNot('—'));
    expect(formatted, isNot('2026-06-13T12:00:00Z'));
  });

  test('system section fields are excluded from editable draft payload', () {
    final form = productFormWithSystemSection();
    final renderer = DynamicFormRenderer(form);
    final systemNames = renderer.sectionFieldNames('system');
    final values = {
      'sku': 'ABC',
      'created_at': '2099-01-01T00:00:00Z',
      'record_version': 99,
    };
    final editable = values.keys
        .where((name) => !systemNames.contains(name) && !renderer.isReadOnly(name))
        .toList();
    expect(editable, ['sku']);
  });
}
