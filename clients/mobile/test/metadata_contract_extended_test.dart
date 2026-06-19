import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/metadata_contract.dart';

void main() {
  final formJson = {
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
            'read_only': true,
            'row': 0,
            'col': 0,
            'span': 6,
            'i18n': {'en': 'Stock Keeping Unit'},
          },
          {
            'name': 'email',
            'label': 'Email',
            'field_type': 'email',
            'required': false,
            'row': 0,
            'col': 6,
            'span': 6,
          },
        ],
      },
      {
        'code': 'extra',
        'label': 'Extra',
        'fields': [
          {
            'name': 'notes',
            'label': 'Notes',
            'field_type': 'textarea',
            'required': false,
            'row': 1,
            'col': 0,
            'span': 12,
          },
        ],
      },
    ],
    'conditions': [
      {
        'field': 'active',
        'operator': 'equals',
        'value': false,
        'action': 'hide',
        'targets': ['email'],
      },
    ],
    'i18n': {
      'en': {'section.main': 'Primary'},
    },
  };

  test('FormMetadata isValid and DisplayMetadata null display', () {
    final form = FormMetadata.fromJson(formJson);
    expect(form.isValid, isTrue);
    expect(DisplayMetadata.fromJson(null).statusField, isNull);
  });

  test('DynamicFormRenderer accessors and localized labels', () {
    final form = FormMetadata.fromJson(formJson);
    final renderer = DynamicFormRenderer(form);
    expect(renderer.fieldNames(), containsAll(['sku', 'email', 'notes']));
    expect(renderer.sectionFieldNames('main'), ['sku', 'email']);
    expect(renderer.sectionLabel('main'), 'Primary');
    expect(renderer.label('sku'), 'Stock Keeping Unit');
    expect(renderer.isRequired('sku'), isTrue);
    expect(renderer.isReadOnly('sku'), isTrue);
    expect(renderer.getField('missing'), isNull);
    expect(FormFieldMetadata.fromMap(renderer.getField('sku')!.toMap()).name, 'sku');
  });

  test('DynamicFormRenderer hide condition and layout rows', () {
    final form = FormMetadata.fromJson(formJson);
    final renderer = DynamicFormRenderer(form);
    expect(renderer.isVisible('email', {'active': false}), isFalse);
    expect(renderer.isVisible('email', {'active': true}), isTrue);
    final rows = renderer.layoutRows(['sku', 'email', 'notes']);
    expect(rows.length, 2);
    expect(renderer.layoutRow('notes'), 1);
  });

  test('GridMetadata flags and DynamicGridRenderer helpers', () {
    final grid = GridMetadata.fromJson({
      'schema_version': '1.0',
      'entity_code': 'PRODUCT',
      'columns': [
        {
          'field': 'warehouse_id',
          'label': 'Warehouse',
          'sortable': true,
          'filterable': true,
          'field_type': 'lookup',
          'lookup_entity': 'WAREHOUSE',
        },
        {'field': 'sku', 'label': 'SKU', 'sortable': true, 'filterable': true},
      ],
      'export': {'csv': true, 'excel': true, 'pdf': false},
      'offline': false,
      'realtime': false,
      'bulk_actions': true,
      'i18n': {'en': {'sku': 'Product SKU'}},
    });
    expect(grid.isValid, isTrue);
    expect(grid.offline, isFalse);
    expect(grid.bulkActions, isTrue);

    final renderer = DynamicGridRenderer(grid);
    expect(renderer.columnFields(), ['warehouse_id', 'sku']);
    expect(renderer.columnLabel('sku'), 'Product SKU');
    expect(renderer.columnLookupEntity('warehouse_id'), 'WAREHOUSE');
    expect(renderer.columnFieldType('missing'), isNull);

    final records = [
      {'sku': 'B', 'group': 'x'},
      {'sku': 'A', 'group': 'x'},
      {'sku': 'C', 'group': 'y'},
    ];
    expect(renderer.sortRecords(records, null, true), records);
    expect(renderer.sortRecords(records, 'sku', false).first['sku'], 'C');
    expect(renderer.filterRecords(records, {}), records);
    expect(renderer.filterRecords(records, {'sku': 'a'}), hasLength(1));
    expect(renderer.groupRecords(records, 'group'), hasLength(2));
    expect(renderer.groupRecords(records, null).single.value, records);
  });
}
