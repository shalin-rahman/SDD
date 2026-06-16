export interface DocumentPlatformSettings {
  storageBackend: string;
  maxUploadSizeMb: number;
  virusScanEnabled: boolean;
  retentionDays: number;
}

export interface ReportScheduleRow {
  code: string;
  name: string;
  entity_code: string;
  default_schedule_cron: string | null;
  schedule_cron: string | null;
  has_override: boolean;
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

/** Merge admin settings documents section over platform defaults. */
export function mergeDocumentSettings(
  platform: DocumentPlatformSettings,
  settings: Record<string, unknown>,
): DocumentPlatformSettings {
  const documents = settings['documents'] as Record<string, unknown> | undefined;
  if (!documents) {
    return platform;
  }
  return {
    storageBackend: String(documents['storage_backend'] ?? platform.storageBackend),
    maxUploadSizeMb: Number(documents['max_upload_size_mb'] ?? platform.maxUploadSizeMb),
    virusScanEnabled:
      documents['virus_scan_enabled'] !== undefined
        ? documents['virus_scan_enabled'] === true
        : platform.virusScanEnabled,
    retentionDays: Number(documents['retention_days'] ?? platform.retentionDays),
  };
}

/** Build documents object for PUT /admin/settings. */
export function buildDocumentSettingsPayload(view: DocumentPlatformSettings): Record<string, unknown> {
  return {
    storage_backend: view.storageBackend,
    max_upload_size_mb: view.maxUploadSizeMb,
    virus_scan_enabled: view.virusScanEnabled,
    retention_days: view.retentionDays,
  };
}
