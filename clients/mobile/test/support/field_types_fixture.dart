import 'dart:convert';
import 'dart:io';

import 'package:emcap_mobile/metadata_contract.dart';

/// Canonical PRODUCT field-type contract fixture (shared with API pytest + web Karma).
File productFieldTypesFixtureFile() {
  final cwd = Directory.current.path;
  final repoRoot = cwd.contains('clients${Platform.pathSeparator}mobile')
      ? Directory('..${Platform.pathSeparator}..')
      : Directory('.');
  return File(
    '${repoRoot.path}${Platform.pathSeparator}platform${Platform.pathSeparator}api'
    '${Platform.pathSeparator}tests${Platform.pathSeparator}fixtures${Platform.pathSeparator}metadata'
    '${Platform.pathSeparator}product.field-types.json',
  );
}

Map<String, dynamic> loadProductFieldTypesFixture() {
  return jsonDecode(productFieldTypesFixtureFile().readAsStringSync())
      as Map<String, dynamic>;
}

File productGridKeysFixtureFile() {
  final cwd = Directory.current.path;
  final repoRoot = cwd.contains('clients${Platform.pathSeparator}mobile')
      ? Directory('..${Platform.pathSeparator}..')
      : Directory('.');
  return File(
    '${repoRoot.path}${Platform.pathSeparator}platform${Platform.pathSeparator}api'
    '${Platform.pathSeparator}tests${Platform.pathSeparator}fixtures${Platform.pathSeparator}metadata'
    '${Platform.pathSeparator}product.grid.keys.json',
  );
}

Map<String, dynamic> loadProductGridKeysFixture() {
  return jsonDecode(productGridKeysFixtureFile().readAsStringSync())
      as Map<String, dynamic>;
}

GridMetadata productGridFromFieldTypesFixture() {
  final fixture = loadProductFieldTypesFixture();
  final specs = fixture['field_types'] as List;
  final gridKeys = loadProductGridKeysFixture();
  final typedNames = specs.map((raw) => (raw as Map)['name'] as String).toSet();
  final systemColumns = (gridKeys['column_fields'] as List)
      .where((name) => !typedNames.contains(name))
      .map(
        (name) => {
          'field': name,
          'label': name,
          'sortable': true,
          'filterable': true,
        },
      )
      .toList();
  final typedColumns = specs.map((raw) {
    final spec = Map<String, dynamic>.from(raw as Map);
    return {
      'field': spec['name'],
      'label': spec['name'],
      'sortable': true,
      'filterable': true,
      'field_type': spec['field_type'],
      if (spec['lookup_entity'] != null) 'lookup_entity': spec['lookup_entity'],
      if (spec['currency_code'] != null) 'currency_code': spec['currency_code'],
    };
  }).toList();
  return GridMetadata.fromJson({
    'schema_version': '1.0',
    'entity_code': fixture['entity_code'],
    'columns': [...typedColumns, ...systemColumns],
    'export': {'csv': true, 'excel': true, 'pdf': false},
  });
}

Map<String, dynamic> fieldMapFromSpec(Map<String, dynamic> spec) {
  return {
    'name': spec['name'],
    'label': spec['name'],
    'field_type': spec['field_type'],
    'required': false,
    'row': 0,
    'col': 0,
    'span': spec['span'] ?? 6,
    if (spec['lookup_entity'] != null) 'lookup_entity': spec['lookup_entity'],
    if (spec['currency_code'] != null) 'currency_code': spec['currency_code'],
    if (spec['options'] != null) 'options': spec['options'],
  };
}
