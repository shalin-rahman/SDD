import 'dart:convert';
import 'dart:typed_data';

enum DocumentPreviewMode { image, pdf, text, download }

enum VirusScanBadgeKind { clean, pending, blocked, unknown }

class DocumentVersionOption {
  const DocumentVersionOption({required this.id, required this.version});

  final String id;
  final String version;
}

class DocumentPreviewView {
  const DocumentPreviewView({
    required this.mode,
    required this.mimeType,
    this.bytes,
    this.textContent,
  });

  final DocumentPreviewMode mode;
  final String mimeType;
  final Uint8List? bytes;
  final String? textContent;
}

const _extensionMime = <String, String>{
  'pdf': 'application/pdf',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'txt': 'text/plain',
  'csv': 'text/csv',
  'json': 'application/json',
  'xml': 'text/xml',
  'html': 'text/html',
  'htm': 'text/html',
};

String mimeTypeFromFilename(String filename) {
  final parts = filename.split('.');
  if (parts.length < 2) return 'application/octet-stream';
  final ext = parts.last.toLowerCase();
  return _extensionMime[ext] ?? 'application/octet-stream';
}

bool isTextMimeType(String mimeType) {
  return mimeType.startsWith('text/') ||
      mimeType == 'application/json' ||
      mimeType == 'application/xml';
}

List<DocumentVersionOption> parseDocumentVersions(
  Map<String, dynamic> payload,
  String fallbackId,
) {
  final raw = payload['versions'];
  if (raw is List && raw.isNotEmpty) {
    return raw.asMap().entries.map((entry) {
      final row = entry.value;
      if (row is! Map) {
        return DocumentVersionOption(id: fallbackId, version: '${entry.key + 1}');
      }
      return DocumentVersionOption(
        id: '${row['id'] ?? fallbackId}',
        version: '${row['version'] ?? entry.key + 1}',
      );
    }).toList();
  }
  return [
    DocumentVersionOption(
      id: fallbackId,
      version: '${payload['version'] ?? 1}',
    ),
  ];
}

Uint8List? decodeBase64Content(String value) {
  try {
    final normalized = value.replaceAll(RegExp(r'\s'), '');
    if (normalized.isEmpty || normalized.length % 4 == 1) return null;
    return base64Decode(normalized);
  } catch (_) {
    return null;
  }
}

Uint8List? decodeHexContent(String value) {
  final normalized = value.replaceAll(RegExp(r'\s'), '');
  if (normalized.isEmpty || normalized.length.isOdd) return null;
  if (!RegExp(r'^[0-9a-fA-F]+$').hasMatch(normalized)) return null;
  final bytes = Uint8List(normalized.length ~/ 2);
  for (var i = 0; i < normalized.length; i += 2) {
    bytes[i ~/ 2] = int.parse(normalized.substring(i, i + 2), radix: 16);
  }
  return bytes;
}

Uint8List? decodeDocumentContent(Map<String, dynamic> payload) {
  final rawContent = payload['content_base64'] ?? payload['content'];
  if (rawContent is! String || rawContent.trim().isEmpty) return null;

  final base64Bytes = decodeBase64Content(rawContent);
  if (base64Bytes != null && base64Bytes.isNotEmpty) return base64Bytes;

  return decodeHexContent(rawContent);
}

String decodeUtf8Bytes(Uint8List bytes) {
  try {
    return utf8.decode(bytes);
  } catch (_) {
    return '';
  }
}

bool _hasMeaningfulBinary(Uint8List? bytes, int minLength) {
  return bytes != null && bytes.length >= minLength;
}

DocumentPreviewView buildDocumentPreviewView(Map<String, dynamic> payload) {
  final filename = '${payload['filename'] ?? 'document'}';
  final mimeType = mimeTypeFromFilename(filename);
  final bytes = decodeDocumentContent(payload);
  final ocrText = '${payload['ocr_text'] ?? ''}'.trim();

  if (mimeType.startsWith('image/') && _hasMeaningfulBinary(bytes, 64)) {
    return DocumentPreviewView(
      mode: DocumentPreviewMode.image,
      mimeType: mimeType,
      bytes: bytes,
    );
  }

  if (mimeType == 'application/pdf' && _hasMeaningfulBinary(bytes, 100)) {
    return DocumentPreviewView(
      mode: DocumentPreviewMode.pdf,
      mimeType: mimeType,
      bytes: bytes,
    );
  }

  if (isTextMimeType(mimeType) || ocrText.isNotEmpty) {
    final textContent = ocrText.isNotEmpty ? ocrText : (bytes != null ? decodeUtf8Bytes(bytes) : '');
    return DocumentPreviewView(
      mode: DocumentPreviewMode.text,
      mimeType: mimeType,
      bytes: bytes,
      textContent: textContent,
    );
  }

  return DocumentPreviewView(
    mode: DocumentPreviewMode.download,
    mimeType: mimeType,
    bytes: bytes,
    textContent: ocrText.isNotEmpty ? ocrText : null,
  );
}

VirusScanBadgeKind virusScanBadgeKind(String status) {
  final normalized = status.trim().toLowerCase();
  if (normalized.isEmpty) return VirusScanBadgeKind.unknown;
  if (normalized == 'clean' || normalized == 'passed' || normalized == 'ok') {
    return VirusScanBadgeKind.clean;
  }
  if (normalized == 'pending' || normalized == 'scanning' || normalized == 'queued') {
    return VirusScanBadgeKind.pending;
  }
  if (normalized.contains('infect') || normalized == 'failed' || normalized == 'blocked') {
    return VirusScanBadgeKind.blocked;
  }
  return VirusScanBadgeKind.unknown;
}

String documentDownloadFallbackText(DocumentPreviewView view, String filename) {
  if (view.textContent != null && view.textContent!.isNotEmpty) {
    return view.textContent!;
  }
  if (view.bytes != null && view.bytes!.isNotEmpty) {
    return base64Encode(view.bytes!);
  }
  return filename;
}
