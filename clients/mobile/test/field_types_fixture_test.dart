import 'package:flutter_test/flutter_test.dart';
import 'package:emcap_mobile/metadata_contract.dart';

import 'support/field_types_fixture.dart';

void main() {
  test('product.field-types.json exists and targets PRODUCT', () {
    final fixture = loadProductFieldTypesFixture();
    expect(fixture['entity_code'], 'PRODUCT');
    expect((fixture['field_types'] as List).length, 4);
  });

  test('parses all fixture field types into FormFieldMetadata', () {
    final specs = loadProductFieldTypesFixture()['field_types'] as List;
    for (final raw in specs) {
      final spec = Map<String, dynamic>.from(raw as Map);
      final field = FormFieldMetadata.fromMap(fieldMapFromSpec(spec));
      expect(field.name, spec['name']);
      expect(field.fieldType, spec['field_type']);
      if (spec.containsKey('lookup_entity')) {
        expect(field.lookupEntity, spec['lookup_entity']);
      }
      if (spec.containsKey('currency_code')) {
        expect(field.currencyCode, spec['currency_code']);
      }
      if (spec.containsKey('options')) {
        expect(field.options, spec['options']);
      }
    }
  });

  test('DynamicFormRenderer validates currency field from fixture', () {
    final specs = loadProductFieldTypesFixture()['field_types'] as List;
    final currencySpec = specs.cast<Map>().firstWhere((item) => item['field_type'] == 'currency');
    final renderer = DynamicFormRenderer(
      FormMetadata.fromJson({
        'schema_version': '1.0',
        'entity_code': 'PRODUCT',
        'sections': [
          {
            'code': 'main',
            'label': 'Main',
            'fields': [fieldMapFromSpec(Map<String, dynamic>.from(currencySpec))],
          },
        ],
        'conditions': [],
      }),
    );
    final field = fieldMapFromSpec(Map<String, dynamic>.from(currencySpec));
    expect(renderer.validateField(field, 'abc'), contains('valid amount'));
    expect(renderer.validateField(field, 9.99), isNull);
  });

  test('grid renderer exposes lookup and currency column metadata from fixture', () {
    final grid = productGridFromFieldTypesFixture();
    final renderer = DynamicGridRenderer(grid);
    expect(renderer.columnFieldType('primary_warehouse'), 'lookup');
    expect(renderer.columnLookupEntity('primary_warehouse'), 'WAREHOUSE');
    expect(renderer.columnFieldType('unit_price'), 'currency');
    expect(renderer.columnCurrencyCode('unit_price'), 'USD');
    expect(renderer.columnFieldType('description'), 'textarea');
  });
}
