export interface DocumentPlatformSettings {
  storageBackend: string;
  maxUploadSizeMb: number;
  virusScanEnabled: boolean;
  retentionDays: number;
}

/** Read-only document platform settings from GET /config/platform payload. */
export function parseDocumentPlatformSettings(
  config: Record<string, unknown>,
): DocumentPlatformSettings {
  const documents = config['documents'] as Record<string, unknown> | undefined;
  return {
    storageBackend: String(documents?.['storage_backend'] ?? 'filesystem'),
    maxUploadSizeMb: Number(documents?.['max_upload_size_mb'] ?? 25),
    virusScanEnabled: documents?.['virus_scan_enabled'] !== false,
    retentionDays: Number(documents?.['retention_days'] ?? 365),
  };
}
