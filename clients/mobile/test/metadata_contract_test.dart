import 'package:flutter_test/flutter_test.dart';
import 'package:emcap_mobile/metadata_contract.dart';

import 'support/field_types_fixture.dart';

void main() {
  final form = FormMetadata.fromJson({
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
            'validation': [
              {'rule': 'required', 'message': 'SKU is required'},
            ],
          },
          {
            'name': 'email',
            'label': 'Email',
            'field_type': 'email',
            'required': false,
            'row': 0,
            'col': 6,
            'span': 6,
            'validation': [
              {'rule': 'email', 'message': 'Invalid email'},
            ],
          },
        ],
      },
    ],
    'conditions': [
      {
        'field': 'active',
        'operator': 'equals',
        'value': true,
        'action': 'show',
        'targets': ['email'],
      },
    ],
  });

  test('validates required field', () {
    final renderer = DynamicFormRenderer(form);
    final skuField = (form.sections[0]['fields'] as List).first as Map<String, dynamic>;
    expect(renderer.validateField(skuField, ''), 'SKU is required');
    expect(renderer.validateField(skuField, 'ABC'), isNull);
  });

  test('conditional visibility', () {
    final renderer = DynamicFormRenderer(form);
    expect(renderer.isVisible('email', {'active': false}), isFalse);
    expect(renderer.isVisible('email', {'active': true}), isTrue);
  });

  test('parses display.status_field contract', () {
    final withDisplay = FormMetadata.fromJson({
      'schema_version': '1.0',
      'entity_code': 'PRODUCT',
      'sections': form.sections,
      'conditions': [],
      'display': {
        'status_field': {
          'field': 'active',
          'active_values': [true],
          'labels': {'active': {'en': 'Active'}, 'inactive': {'en': 'Inactive'}},
        },
      },
    });
    expect(withDisplay.display?.statusField?.field, 'active');
  });

  test('layout grid rows', () {
    final renderer = DynamicFormRenderer(form);
    final rows = renderer.layoutRows(['sku', 'email']);
    expect(rows.length, 1);
    expect(rows.first, ['sku', 'email']);
    expect(renderer.layoutSpan('sku'), 6);
  });

  test('parses lookup and currency field metadata', () {
    final lookup = FormFieldMetadata.fromMap({
      'name': 'primary_warehouse',
      'label': 'Warehouse',
      'field_type': 'lookup',
      'lookup_entity': 'WAREHOUSE',
      'required': false,
      'row': 0,
      'col': 0,
      'span': 6,
    });
    expect(lookup.lookupEntity, 'WAREHOUSE');

    final price = FormFieldMetadata.fromMap({
      'name': 'unit_price',
      'label': 'Unit Price',
      'field_type': 'currency',
      'currency_code': 'USD',
      'required': false,
      'row': 0,
      'col': 0,
      'span': 6,
    });
    expect(price.currencyCode, 'USD');
  });

  test('validates currency field', () {
    final currencyField = {
      'name': 'unit_price',
      'label': 'Unit Price',
      'field_type': 'currency',
    };
    final renderer = DynamicFormRenderer(form);
    expect(renderer.validateField(currencyField, 'abc'), 'Unit Price must be a valid amount');
    expect(renderer.validateField(currencyField, 9.99), isNull);
  });

  test('grid column field type accessors', () {
    final grid = GridMetadata.fromJson({
      'schema_version': '1.0',
      'entity_code': 'PRODUCT',
      'columns': [
        {
          'field': 'unit_price',
          'label': 'Unit Price',
          'sortable': true,
          'filterable': true,
          'field_type': 'currency',
          'currency_code': 'USD',
        },
      ],
      'export': {'csv': true, 'excel': true, 'pdf': false},
    });
    final renderer = DynamicGridRenderer(grid);
    expect(renderer.columnFieldType('unit_price'), 'currency');
    expect(renderer.columnCurrencyCode('unit_price'), 'USD');
  });

  test('grid sort and filter', () {
    final grid = GridMetadata.fromJson({
      'schema_version': '1.0',
      'entity_code': 'PRODUCT',
      'columns': [
        {'field': 'sku', 'label': 'SKU', 'sortable': true, 'filterable': true},
      ],
      'export': {'csv': true, 'excel': true, 'pdf': false},
      'grouping': true,
    });
    final renderer = DynamicGridRenderer(grid);
    final rows = [
      {'sku': 'B'},
      {'sku': 'A'},
    ];
    final sorted = renderer.sortRecords(rows, 'sku', true);
    expect(sorted.first['sku'], 'A');
    final filtered = renderer.filterRecords(rows, {'sku': 'B'});
    expect(filtered.length, 1);
  });

  group('product.field-types.json contract (P14-T26)', () {
    test('loads canonical fixture for PRODUCT', () {
      final fixture = loadProductFieldTypesFixture();
      expect(fixture['entity_code'], 'PRODUCT');
      expect((fixture['field_types'] as List).length, 4);
    });

    test('parses lookup, currency, textarea, and select from fixture', () {
      final specs = loadProductFieldTypesFixture()['field_types'] as List;
      final types = specs.map((item) => (item as Map)['field_type']).toList();
      expect(types, containsAll(['lookup', 'currency', 'textarea', 'select']));

      for (final raw in specs) {
        final spec = Map<String, dynamic>.from(raw as Map);
        final field = FormFieldMetadata.fromMap(fieldMapFromSpec(spec));
        expect(field.fieldType, spec['field_type']);
      }
    });

    test('DynamicFormRenderer resolves all fixture field types', () {
      final fixture = loadProductFieldTypesFixture();
      final specs = fixture['field_types'] as List;
      final renderer = DynamicFormRenderer(
        FormMetadata.fromJson({
          'schema_version': '1.0',
          'entity_code': fixture['entity_code'],
          'sections': [
            {
              'code': 'main',
              'label': 'Main',
              'fields': specs
                  .map((raw) => fieldMapFromSpec(Map<String, dynamic>.from(raw as Map)))
                  .toList(),
            },
          ],
          'conditions': [],
        }),
      );
      for (final raw in specs) {
        final spec = Map<String, dynamic>.from(raw as Map);
        expect(renderer.getField(spec['name'] as String)?.fieldType, spec['field_type']);
      }
    });
  });
}
