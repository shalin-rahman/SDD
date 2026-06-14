import 'package:flutter_test/flutter_test.dart';

import 'support/entity_fixtures.dart';

const _systemFormFieldNames = {
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'record_version',
  'deleted_at',
};

const _systemGridColumns = {
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'record_version',
};

void main() {
  for (final entity in fixtureEntityCodes) {
    group('$entity metadata fixture contract', () {
      test('form.keys lists business fields only', () {
        if (!entityFixtureExists(entity, 'form.keys')) {
          skip('form.keys fixture pending for $entity');
        }
        final names = loadEntityFormFieldNames(entity);
        expect(names, isNotEmpty, reason: entity);
        for (final name in names) {
          expect(
            _systemFormFieldNames,
            isNot(contains(name)),
            reason: '$entity form must not list system field $name',
          );
        }
      });

      test('grid.keys includes system columns after business fields', () {
        if (!entityFixtureExists(entity, 'grid.keys')) {
          skip('grid.keys fixture pending for $entity');
        }
        final columns = loadEntityGridColumnFields(entity);
        expect(columns, containsAll(_systemGridColumns), reason: entity);

        final business = columns.where((c) => !_systemGridColumns.contains(c)).toList();
        final system = columns.where((c) => _systemGridColumns.contains(c)).toList();
        expect(business, isNotEmpty, reason: '$entity needs business columns');
        expect(system, isNotEmpty, reason: '$entity needs system columns');

        if (business.isNotEmpty && system.isNotEmpty) {
          final lastBusinessIdx = columns.lastIndexWhere((c) => business.contains(c));
          final firstSystemIdx = columns.indexWhere((c) => system.contains(c));
          expect(
            firstSystemIdx,
            greaterThan(lastBusinessIdx),
            reason: '$entity system columns must trail business columns',
          );
        }
      });
    });
  }

  test('W1, W2, W3, W4, and W5 entities with fixtures are discoverable', () {
    final withFixtures = w1EntitiesWithFixtures();
    expect(withFixtures, containsAll(['PRODUCT', 'WAREHOUSE', 'CUSTOMER', 'LEAD', 'CONTACT']));
    for (final code in [...w2EntityCodes, ...w3EntityCodes, ...w4EntityCodes, ...w5EntityCodes]) {
      expect(entityFixtureExists(code, 'form.keys'), isTrue, reason: code);
      expect(entityFixtureExists(code, 'grid.keys'), isTrue, reason: code);
    }
  });

  test('PRODUCT grid.keys matches canonical API snapshot', () {
    final columns = loadEntityGridColumnFields('PRODUCT');
    expect(columns.first, 'sku');
    expect(columns, containsAll(['active', 'created_at', 'record_version']));
  });
}
