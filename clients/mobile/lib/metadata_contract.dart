class FormMetadata {
  FormMetadata({
    required this.schemaVersion,
    required this.entityCode,
    required this.sections,
  });

  final String schemaVersion;
  final String entityCode;
  final List<Map<String, dynamic>> sections;

  factory FormMetadata.fromJson(Map<String, dynamic> json) {
    return FormMetadata(
      schemaVersion: json['schema_version'] as String,
      entityCode: json['entity_code'] as String,
      sections: List<Map<String, dynamic>>.from(json['sections'] as List),
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
  });

  final String schemaVersion;
  final String entityCode;
  final List<Map<String, dynamic>> columns;
  final Map<String, dynamic> export;
  final bool offline;
  final bool realtime;

  factory GridMetadata.fromJson(Map<String, dynamic> json) {
    return GridMetadata(
      schemaVersion: json['schema_version'] as String,
      entityCode: json['entity_code'] as String,
      columns: List<Map<String, dynamic>>.from(json['columns'] as List),
      export: Map<String, dynamic>.from(json['export'] as Map),
      offline: json['offline'] as bool? ?? true,
      realtime: json['realtime'] as bool? ?? true,
    );
  }

  bool get isValid => schemaVersion.isNotEmpty && entityCode.isNotEmpty && columns.isNotEmpty;
}

class DynamicFormRenderer {
  DynamicFormRenderer(this.metadata);

  final FormMetadata metadata;

  List<String> fieldNames() {
    final names = <String>[];
    for (final section in metadata.sections) {
      for (final field in section['fields'] as List) {
        names.add(field['name'] as String);
      }
    }
    return names;
  }
}

class DynamicGridRenderer {
  DynamicGridRenderer(this.metadata);

  final GridMetadata metadata;

  List<String> columnFields() {
    return metadata.columns.map((column) => column['field'] as String).toList();
  }
}
