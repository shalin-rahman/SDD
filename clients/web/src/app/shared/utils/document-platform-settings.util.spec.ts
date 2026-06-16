import {
  buildDocumentSettingsPayload,
  mergeDocumentSettings,
  parseDocumentPlatformSettings,
} from './document-platform-settings.util';

describe('parseDocumentPlatformSettings', () => {
  it('returns defaults when documents section is missing', () => {
    expect(parseDocumentPlatformSettings({})).toEqual({
      storageBackend: 'filesystem',
      maxUploadSizeMb: 25,
      virusScanEnabled: true,
      retentionDays: 365,
    });
  });

  it('reads document settings from platform config', () => {
    expect(
      parseDocumentPlatformSettings({
        documents: {
          storage_backend: 's3',
          max_upload_size_mb: 50,
          virus_scan_enabled: false,
          retention_days: 90,
        },
      }),
    ).toEqual({
      storageBackend: 's3',
      maxUploadSizeMb: 50,
      virusScanEnabled: false,
      retentionDays: 90,
    });
  });
});

describe('mergeDocumentSettings', () => {
  it('merges admin settings over platform defaults', () => {
    const platform = parseDocumentPlatformSettings({});
    const merged = mergeDocumentSettings(platform, {
      documents: { max_upload_size_mb: 40, retention_days: 200 },
    });
    expect(merged.maxUploadSizeMb).toBe(40);
    expect(merged.retentionDays).toBe(200);
    expect(merged.storageBackend).toBe('filesystem');
  });
});

describe('buildDocumentSettingsPayload', () => {
  it('maps view model to API snake_case keys', () => {
    expect(
      buildDocumentSettingsPayload({
        storageBackend: 's3',
        maxUploadSizeMb: 10,
        virusScanEnabled: false,
        retentionDays: 30,
      }),
    ).toEqual({
      storage_backend: 's3',
      max_upload_size_mb: 10,
      virus_scan_enabled: false,
      retention_days: 30,
    });
  });
});
