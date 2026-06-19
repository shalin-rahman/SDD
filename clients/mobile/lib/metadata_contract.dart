class FormFieldMetadata {
  FormFieldMetadata({
    required this.name,
    required this.label,
    required this.fieldType,
    this.required = false,
    this.readOnly = false,
    this.row = 0,
    this.col = 0,
    this.span = 12,
    this.options = const [],
    this.lookupEntity,
    this.currencyCode,
    this.i18n,
    this.validation,
  });

  final String name;
  final String label;
  final String fieldType;
  final bool required;
  final bool readOnly;
  final int row;
  final int col;
  final int span;
  final List<String> options;
  final String? lookupEntity;
  final String? currencyCode;
  final Map<String, dynamic>? i18n;
  final List<Map<String, dynamic>>? validation;

  factory FormFieldMetadata.fromMap(Map<String, dynamic> map) {
    return FormFieldMetadata(
      name: map['name'] as String,
      label: map['label'] as String? ?? map['name'] as String,
      fieldType: map['field_type'] as String? ?? 'text',
      required: map['required'] == true,
      readOnly: map['read_only'] == true,
      row: map['row'] as int? ?? 0,
      col: map['col'] as int? ?? 0,
      span: map['span'] as int? ?? 12,
      options: (map['options'] as List?)?.map((e) => e.toString()).toList() ?? [],
      lookupEntity: map['lookup_entity'] as String?,
      currencyCode: map['currency_code'] as String?,
      i18n: map['i18n'] as Map<String, dynamic>?,
      validation: (map['validation'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList(),
    );
  }

  Map<String, dynamic> toMap() => {
        'name': name,
        'label': label,
        'field_type': fieldType,
        'required': required,
        'read_only': readOnly,
        'row': row,
        'col': col,
        'span': span,
        if (options.isNotEmpty) 'options': options,
        if (lookupEntity != null) 'lookup_entity': lookupEntity,
        if (currencyCode != null) 'currency_code': currencyCode,
        if (i18n != null) 'i18n': i18n,
        if (validation != null) 'validation': validation,
      };
}

class StatusFieldMetadata {
  const StatusFieldMetadata({
    required this.field,
    required this.activeValues,
    required this.labels,
  });

  final String field;
  final List<dynamic> activeValues;
  final Map<String, Map<String, String>> labels;

  factory StatusFieldMetadata.fromMap(Map<String, dynamic> map) {
    final rawLabels = map['labels'] as Map? ?? {};
    final labels = <String, Map<String, String>>{};
    for (final entry in rawLabels.entries) {
      final localeMap = entry.value as Map? ?? {};
      labels['${entry.key}'] = localeMap.map((k, v) => MapEntry('$k', '$v'));
    }
    return StatusFieldMetadata(
      field: map['field'] as String,
      activeValues: List<dynamic>.from(map['active_values'] as List? ?? []),
      labels: labels,
    );
  }
}

class DisplayMetadata {
  const DisplayMetadata({this.statusField});

  final StatusFieldMetadata? statusField;

  factory DisplayMetadata.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const DisplayMetadata();
    }
    final statusRaw = json['status_field'] as Map?;
    return DisplayMetadata(
      statusField: statusRaw == null ? null : StatusFieldMetadata.fromMap(Map<String, dynamic>.from(statusRaw)),
    );
  }
}

class FormMetadata {
  FormMetadata({
    required this.schemaVersion,
    required this.entityCode,
    required this.sections,
    this.conditions = const [],
    this.i18n,
    this.display,
  });

  final String schemaVersion;
  final String entityCode;
  final List<Map<String, dynamic>> sections;
  final List<Map<String, dynamic>> conditions;
  final Map<String, dynamic>? i18n;
  final DisplayMetadata? display;

  factory FormMetadata.fromJson(Map<String, dynamic> json) {
    final displayRaw = json['display'];
    return FormMetadata(
      schemaVersion: json['schema_version'] as String,
      entityCode: json['entity_code'] as String,
      sections: (json['sections'] as List)
          .map((section) => Map<String, dynamic>.from(section as Map))
          .toList(),
      conditions: (json['conditions'] as List? ?? [])
          .map((condition) => Map<String, dynamic>.from(condition as Map))
          .toList(),
      i18n: json['i18n'] == null ? null : Map<String, dynamic>.from(json['i18n'] as Map),
      display: displayRaw == null
          ? null
          : DisplayMetadata.fromJson(Map<String, dynamic>.from(displayRaw as Map)),
    );
  }

  bool get isValid => schemaVersion.isNotEmpty && entityCode.isNotEmpty && sections.isNotEmpty;
}

class GridMetadata {
  GridMetadata({
    required this.schemaVersion,
    required this.entityCode,
    required this.columns,
    required this.export,
    this.offline = true,
    this.realtime = true,
    this.grouping = false,
    this.bulkActions = false,
    this.i18n,
  });

  final String schemaVersion;
  final String entityCode;
  final List<Map<String, dynamic>> columns;
  final Map<String, dynamic> export;
  final bool offline;
  final bool realtime;
  final bool grouping;
  final bool bulkActions;
  final Map<String, dynamic>? i18n;

  factory GridMetadata.fromJson(Map<String, dynamic> json) {
    return GridMetadata(
      schemaVersion: json['schema_version'] as String,
      entityCode: json['entity_code'] as String,
      columns: List<Map<String, dynamic>>.from(json['columns'] as List),
      export: Map<String, dynamic>.from(json['export'] as Map),
      offline: json['offline'] as bool? ?? true,
      realtime: json['realtime'] as bool? ?? true,
      grouping: json['grouping'] as bool? ?? false,
      bulkActions: json['bulk_actions'] == true,
      i18n: json['i18n'] as Map<String, dynamic>?,
    );
  }

  bool get isValid => schemaVersion.isNotEmpty && entityCode.isNotEmpty && columns.isNotEmpty;
}

class DynamicFormRenderer {
  DynamicFormRenderer(this.metadata, {this.locale = 'en'});

  final FormMetadata metadata;
  final String locale;

  List<String> fieldNames() {
    final names = <String>[];
    for (final section in metadata.sections) {
      for (final field in section['fields'] as List) {
        names.add(field['name'] as String);
      }
    }
    return names;
  }

  FormFieldMetadata? getField(String name) {
    final map = fieldMetadata(metadata, name);
    return map != null ? FormFieldMetadata.fromMap(map) : null;
  }

  bool isReadOnly(String name) => getField(name)?.readOnly ?? false;

  String sectionLabel(String sectionCode) {
    final key = 'section.$sectionCode';
    final localized = metadata.i18n?[locale]?[key];
    if (localized != null) {
      return localized as String;
    }
    for (final section in metadata.sections) {
      if (section['code'] == sectionCode) {
        return section['label'] as String? ?? sectionCode;
      }
    }
    return sectionCode;
  }

  List<String> sectionFieldNames(String sectionCode) {
    for (final section in metadata.sections) {
      if (section['code'] == sectionCode) {
        return (section['fields'] as List).map((field) => (field as Map)['name'] as String).toList();
      }
    }
    return [];
  }

  String label(String name) {
    for (final section in metadata.sections) {
      for (final field in section['fields'] as List) {
        if (field['name'] == name) {
          final i18n = field['i18n'] as Map?;
          return (i18n?[locale] ?? field['label'] ?? name) as String;
        }
      }
    }
    return name;
  }

  bool isRequired(String name) {
    for (final section in metadata.sections) {
      for (final field in section['fields'] as List) {
        if (field['name'] == name) {
          return field['required'] == true;
        }
      }
    }
    return false;
  }

  bool isVisible(String name, Map<String, dynamic> values) {
    var visible = true;
    for (final rule in metadata.conditions) {
      final targets = List<String>.from(rule['targets'] as List? ?? []);
      if (!targets.contains(name)) continue;
      final field = rule['field'];
      final op = rule['operator'];
      final expected = rule['value'];
      final actual = values[field];
      final matches = op == 'equals' ? actual == expected : actual != null;
      if (rule['action'] == 'show') {
        visible = visible && matches;
      } else if (rule['action'] == 'hide') {
        visible = visible && !matches;
      }
    }
    return visible;
  }

  int layoutSpan(String name) {
    final field = fieldMetadata(metadata, name);
    return (field?['span'] as int?) ?? 12;
  }

  int layoutRow(String name) {
    final field = fieldMetadata(metadata, name);
    return (field?['row'] as int?) ?? 0;
  }

  List<List<String>> layoutRows(List<String> visibleNames) {
    final byRow = <int, List<String>>{};
    for (final name in visibleNames) {
      byRow.putIfAbsent(layoutRow(name), () => []).add(name);
    }
    final rows = byRow.keys.toList()..sort();
    return rows.map((row) => byRow[row]!).toList();
  }

  String? validateField(Map<String, dynamic> field, dynamic value) {
    if (field['required'] == true && (value == null || '$value'.isEmpty)) {
      return '${field['label'] ?? field['name']} is required';
    }
    if (value == null || '$value'.isEmpty) return null;
    final fieldType = field['field_type'] as String? ?? 'text';
    if (fieldType == 'currency') {
      final amount = double.tryParse('$value');
      if (amount == null) {
        return '${field['label'] ?? field['name']} must be a valid amount';
      }
    }
    final rules = field['validation'] as List? ?? [];
    for (final rule in rules) {
      if (rule['rule'] == 'email' && !'$value'.contains('@')) {
        return rule['message'] as String? ?? 'Invalid email';
      }
    }
    return null;
  }
}

class DynamicGridRenderer {
  DynamicGridRenderer(this.metadata, {this.locale = 'en'});

  final GridMetadata metadata;
  final String locale;

  List<String> columnFields() {
    return metadata.columns.map((column) => column['field'] as String).toList();
  }

  String columnLabel(String field) {
    final localeMap = metadata.i18n?[locale];
    if (localeMap is Map && localeMap[field] != null) {
      return '${localeMap[field]}';
    }
    for (final column in metadata.columns) {
      if (column['field'] == field) {
        return '${column['label'] ?? field}';
      }
    }
    return field;
  }

  String? columnFieldType(String field) {
    for (final column in metadata.columns) {
      if (column['field'] == field) {
        final type = column['field_type'];
        return type == null ? null : '$type';
      }
    }
    return null;
  }

  String? columnCurrencyCode(String field) {
    for (final column in metadata.columns) {
      if (column['field'] == field) {
        final code = column['currency_code'];
        return code == null ? null : '$code';
      }
    }
    return null;
  }

  String? columnLookupEntity(String field) {
    for (final column in metadata.columns) {
      if (column['field'] == field) {
        final entity = column['lookup_entity'];
        return entity == null ? null : '$entity';
      }
    }
    return null;
  }

  List<Map<String, dynamic>> sortRecords(
    List<Map<String, dynamic>> records,
    String? field,
    bool ascending,
  ) {
    if (field == null) return records;
    final sorted = List<Map<String, dynamic>>.from(records);
    sorted.sort((a, b) {
      final cmp = '${a[field] ?? ''}'.compareTo('${b[field] ?? ''}');
      return ascending ? cmp : -cmp;
    });
    return sorted;
  }

  List<Map<String, dynamic>> filterRecords(
    List<Map<String, dynamic>> records,
    Map<String, String> filters,
  ) {
    final active = filters.entries.where((e) => e.value.trim().isNotEmpty).toList();
    if (active.isEmpty) return records;
    return records.where((record) {
      return active.every(
        (f) => '${record[f.key] ?? ''}'.toLowerCase().contains(f.value.toLowerCase()),
      );
    }).toList();
  }

  List<MapEntry<String, List<Map<String, dynamic>>>> groupRecords(
    List<Map<String, dynamic>> records,
    String? groupField,
  ) {
    if (groupField == null) {
      return [MapEntry('', records)];
    }
    final groups = <String, List<Map<String, dynamic>>>{};
    for (final record in records) {
      final key = '${record[groupField] ?? '(empty)'}';
      groups.putIfAbsent(key, () => []).add(record);
    }
    return groups.entries.toList();
  }
}

Map<String, dynamic>? fieldMetadata(FormMetadata metadata, String name) {
  for (final section in metadata.sections) {
    for (final field in section['fields'] as List) {
      if (field['name'] == name) {
        return Map<String, dynamic>.from(field as Map);
      }
    }
  }
  return null;
}
