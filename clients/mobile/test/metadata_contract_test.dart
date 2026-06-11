import 'package:flutter_test/flutter_test.dart';
import 'package:emcap_mobile/metadata_contract.dart';

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

  test('layout grid rows', () {
    final renderer = DynamicFormRenderer(form);
    final rows = renderer.layoutRows(['sku', 'email']);
    expect(rows.length, 1);
    expect(rows.first, ['sku', 'email']);
    expect(renderer.layoutSpan('sku'), 6);
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
}
