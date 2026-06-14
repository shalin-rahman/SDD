import { parseDocumentPlatformSettings } from './document-platform-settings.util';

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
