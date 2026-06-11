class FormMetadata {
  FormMetadata({
    required this.schemaVersion,
    required this.entityCode,
    required this.sections,
    this.conditions = const [],
    this.i18n,
  });

  final String schemaVersion;
  final String entityCode;
  final List<Map<String, dynamic>> sections;
  final List<Map<String, dynamic>> conditions;
  final Map<String, dynamic>? i18n;

  factory FormMetadata.fromJson(Map<String, dynamic> json) {
    return FormMetadata(
      schemaVersion: json['schema_version'] as String,
      entityCode: json['entity_code'] as String,
      sections: List<Map<String, dynamic>>.from(json['sections'] as List),
      conditions: List<Map<String, dynamic>>.from(json['conditions'] as List? ?? []),
      i18n: json['i18n'] as Map<String, dynamic>?,
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
  });

  final String schemaVersion;
  final String entityCode;
  final List<Map<String, dynamic>> columns;
  final Map<String, dynamic> export;
  final bool offline;
  final bool realtime;
  final bool grouping;

  factory GridMetadata.fromJson(Map<String, dynamic> json) {
    return GridMetadata(
      schemaVersion: json['schema_version'] as String,
      entityCode: json['entity_code'] as String,
      columns: List<Map<String, dynamic>>.from(json['columns'] as List),
      export: Map<String, dynamic>.from(json['export'] as Map),
      offline: json['offline'] as bool? ?? true,
      realtime: json['realtime'] as bool? ?? true,
      grouping: json['grouping'] as bool? ?? false,
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

  String? validateField(Map<String, dynamic> field, dynamic value) {
    if (field['required'] == true && (value == null || '$value'.isEmpty)) {
      return '${field['label'] ?? field['name']} is required';
    }
    if (value == null || '$value'.isEmpty) return null;
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
  DynamicGridRenderer(this.metadata);

  final GridMetadata metadata;

  List<String> columnFields() {
    return metadata.columns.map((column) => column['field'] as String).toList();
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
