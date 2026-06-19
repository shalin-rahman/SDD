import 'dart:convert';
import 'dart:io';

/// Repo root when tests run from `clients/mobile` or monorepo root.
Directory entityFixturesRepoRoot() {
  final cwd = Directory.current.path;
  if (cwd.contains('clients${Platform.pathSeparator}mobile')) {
    return Directory('..${Platform.pathSeparator}..');
  }
  return Directory('.');
}

Directory entityMetadataFixturesDir() {
  final root = entityFixturesRepoRoot();
  return Directory(
    '${root.path}${Platform.pathSeparator}platform${Platform.pathSeparator}api'
    '${Platform.pathSeparator}tests${Platform.pathSeparator}fixtures${Platform.pathSeparator}metadata',
  );
}

/// Canonical API fixture path: `{entity}.{suffix}.json` (entity lowercased).
File entityFixtureFile(String entityCode, String suffix) {
  final entity = entityCode.toLowerCase();
  return File('${entityMetadataFixturesDir().path}${Platform.pathSeparator}$entity.$suffix.json');
}

bool entityFixtureExists(String entityCode, String suffix) {
  return entityFixtureFile(entityCode, suffix).existsSync();
}

Map<String, dynamic> loadEntityFixture(String entityCode, String suffix) {
  final file = entityFixtureFile(entityCode, suffix);
  if (!file.existsSync()) {
    throw StateError('Missing fixture: ${file.path}');
  }
  return jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
}

List<String> loadEntityFormFieldNames(String entityCode) {
  final fixture = loadEntityFixture(entityCode, 'form.keys');
  return List<String>.from(fixture['field_names'] as List);
}

List<String> loadEntityGridColumnFields(String entityCode) {
  final fixture = loadEntityFixture(entityCode, 'grid.keys');
  return List<String>.from(fixture['column_fields'] as List);
}

/// Wave W1 entities from `plan/20-standard-entity-rollout.md`.
const w1EntityCodes = ['PRODUCT', 'WAREHOUSE', 'CUSTOMER', 'LEAD', 'CONTACT'];

/// Wave W2 accounting/POS/HRM entities.
const w2EntityCodes = ['JOURNAL_ENTRY', 'SALE', 'LEAVE_REQUEST'];

/// Wave W3 lookup-target entities (accounting/POS/HRM).
const w3EntityCodes = ['ACCOUNT', 'TERMINAL', 'EMPLOYEE'];

/// Wave W4 order-chain entities (procurement + sales).
const w4EntityCodes = ['SUPPLIER', 'PURCHASE_ORDER', 'SALES_ORDER', 'INVOICE'];

/// Wave W5 inventory movement entities.
const w5EntityCodes = ['STOCK_MOVEMENT', 'STOCK_MOVEMENT_LINE'];

/// Wave W6 procurement/sales line + payment entities (P25).
const w6EntityCodes = [
  'PURCHASE_ORDER_LINE',
  'SALES_ORDER_LINE',
  'VENDOR_PAYMENT',
  'CUSTOMER_PAYMENT',
  'JOURNAL_ENTRY_LINE',
];

/// All entities with fixture coverage (W1 + W2 + W3 + W4 + W5 + W6).
const fixtureEntityCodes = [
  ...w1EntityCodes,
  ...w2EntityCodes,
  ...w3EntityCodes,
  ...w4EntityCodes,
  ...w5EntityCodes,
  ...w6EntityCodes,
];

/// Entities in [w1EntityCodes] that have both form and grid key fixtures on disk.
List<String> w1EntitiesWithFixtures() {
  return w1EntityCodes
      .where(
        (code) => entityFixtureExists(code, 'form.keys') && entityFixtureExists(code, 'grid.keys'),
      )
      .toList();
}
