import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/document_platform_settings_util.dart';

void main() {
  test('returns defaults when documents section is missing', () {
    final settings = parseDocumentPlatformSettings({});
    expect(settings.storageBackend, 'filesystem');
    expect(settings.maxUploadSizeMb, 25);
    expect(settings.virusScanEnabled, isTrue);
    expect(settings.retentionDays, 365);
  });

  test('reads document settings from platform config', () {
    final settings = parseDocumentPlatformSettings({
      'documents': {
        'storage_backend': 's3',
        'max_upload_size_mb': 50,
        'virus_scan_enabled': false,
        'retention_days': 90,
      },
    });
    expect(settings.storageBackend, 's3');
    expect(settings.maxUploadSizeMb, 50);
    expect(settings.virusScanEnabled, isFalse);
    expect(settings.retentionDays, 90);
  });
}
