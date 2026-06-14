class DocumentPlatformSettings {
  const DocumentPlatformSettings({
    required this.storageBackend,
    required this.maxUploadSizeMb,
    required this.virusScanEnabled,
    required this.retentionDays,
  });

  final String storageBackend;
  final int maxUploadSizeMb;
  final bool virusScanEnabled;
  final int retentionDays;
}

/// Read-only document platform settings from GET /config/platform payload.
DocumentPlatformSettings parseDocumentPlatformSettings(Map<String, dynamic> config) {
  final documents = config['documents'] as Map<String, dynamic>?;
  return DocumentPlatformSettings(
    storageBackend: '${documents?['storage_backend'] ?? 'filesystem'}',
    maxUploadSizeMb: (documents?['max_upload_size_mb'] as num?)?.toInt() ?? 25,
    virusScanEnabled: documents?['virus_scan_enabled'] != false,
    retentionDays: (documents?['retention_days'] as num?)?.toInt() ?? 365,
  );
}
