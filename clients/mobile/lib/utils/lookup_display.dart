import '../metadata_contract.dart';

String resolveRecordDisplayLabel(Map<String, dynamic> record) {
  for (final key in ['name', 'code', 'sku', 'title']) {
    final value = record[key];
    if (value != null && value.toString().trim().isNotEmpty) {
      return value.toString();
    }
  }
  return record['id']?.toString() ?? '—';
}

String? lookupEntityFromField(Map<String, dynamic>? field) {
  final value = field?['lookup_entity'];
  if (value == null || '$value'.isEmpty) {
    return null;
  }
  return '$value';
}

String currencyCodeFromField(Map<String, dynamic>? field) {
  final value = field?['currency_code'];
  if (value == null || '$value'.isEmpty) {
    return 'USD';
  }
  return '$value';
}

String? columnFieldType(GridMetadata metadata, String fieldName) {
  for (final column in metadata.columns) {
    if (column['field'] == fieldName) {
      final type = column['field_type'];
      return type == null ? null : '$type';
    }
  }
  return null;
}

String? columnCurrencyCode(GridMetadata metadata, String fieldName) {
  for (final column in metadata.columns) {
    if (column['field'] == fieldName) {
      final code = column['currency_code'];
      return code == null ? null : '$code';
    }
  }
  return null;
}
