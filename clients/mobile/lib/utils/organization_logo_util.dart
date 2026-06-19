import 'dart:convert';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';

/// Result of a local logo file pick (injectable in tests).
class OrganizationLogoPick {
  const OrganizationLogoPick({required this.filename, required this.bytes});

  final String filename;
  final Uint8List bytes;
}

const organizationLogoAllowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

/// Validate logo filename and size before upload.
String? validateOrganizationLogoFile({
  required String filename,
  required int sizeBytes,
  required int maxUploadSizeMb,
}) {
  final lower = filename.toLowerCase();
  final allowed = organizationLogoAllowedExtensions.any(lower.endsWith);
  if (!allowed) {
    return 'invalid_type';
  }
  if (sizeBytes <= 0) {
    return 'empty';
  }
  final maxBytes = maxUploadSizeMb * 1024 * 1024;
  if (sizeBytes > maxBytes) {
    return 'too_large';
  }
  return null;
}

/// Encode logo bytes for POST /admin/organization-profile/logo.
String encodeOrganizationLogoContentBase64(Uint8List bytes) {
  return base64Encode(bytes);
}

/// Whether a logo URL is safe to preview (http(s) or uploaded document content path).
bool isOrganizationLogoPreviewAllowed(String url) {
  final trimmed = url.trim();
  if (trimmed.isEmpty) {
    return false;
  }
  final lower = trimmed.toLowerCase();
  if (lower.startsWith('https://') || lower.startsWith('http://')) {
    return true;
  }
  return trimmed.startsWith('/api/v1/documents/') && trimmed.endsWith('/content');
}

/// Resolve logo preview URL — absolute http(s) or API-hosted document content.
String resolveOrganizationLogoPreviewUrl(String logoUrl, String apiBaseUrl) {
  final trimmed = logoUrl.trim();
  if (!isOrganizationLogoPreviewAllowed(trimmed)) {
    return '';
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  final base = apiBaseUrl.endsWith('/') ? apiBaseUrl.substring(0, apiBaseUrl.length - 1) : apiBaseUrl;
  return '$base$trimmed';
}

/// Pick a logo file from device storage (wired from shell; stubbed in widget tests).
Future<OrganizationLogoPick?> pickOrganizationLogoFromDevice() async {
  final result = await FilePicker.platform.pickFiles(
    type: FileType.custom,
    allowedExtensions: organizationLogoAllowedExtensions
        .map((ext) => ext.startsWith('.') ? ext.substring(1) : ext)
        .toList(),
    withData: true,
  );
  if (result == null || result.files.isEmpty) {
    return null;
  }
  final file = result.files.single;
  final bytes = file.bytes;
  final name = file.name;
  if (bytes == null || name.isEmpty) {
    return null;
  }
  return OrganizationLogoPick(filename: name, bytes: bytes);
}
