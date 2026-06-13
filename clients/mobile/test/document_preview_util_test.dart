import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/document_preview_util.dart';

void main() {
  test('detects mime type from filename', () {
    expect(mimeTypeFromFilename('report.pdf'), 'application/pdf');
    expect(mimeTypeFromFilename('photo.png'), 'image/png');
  });

  test('builds text preview from ocr_text', () {
    final view = buildDocumentPreviewView({
      'filename': 'notes.txt',
      'ocr_text': 'Hello world',
    });
    expect(view.mode, DocumentPreviewMode.text);
    expect(view.textContent, 'Hello world');
  });

  test('builds image preview from base64 content', () {
    final bytes = Uint8List.fromList(List.generate(80, (i) => i));
    final view = buildDocumentPreviewView({
      'filename': 'photo.png',
      'content_base64': base64Encode(bytes),
    });
    expect(view.mode, DocumentPreviewMode.image);
    expect(view.bytes?.length, 80);
  });

  test('parses version list when API returns versions', () {
    final versions = parseDocumentVersions(
      {
        'version': 2,
        'versions': [
          {'id': 'v1', 'version': 1},
          {'id': 'v2', 'version': 2},
        ],
      },
      'fallback',
    );
    expect(versions.length, 2);
    expect(versions[1].id, 'v2');
  });

  test('maps virus scan status to badge kind', () {
    expect(virusScanBadgeKind('clean'), VirusScanBadgeKind.clean);
    expect(virusScanBadgeKind('pending'), VirusScanBadgeKind.pending);
    expect(virusScanBadgeKind('infected'), VirusScanBadgeKind.blocked);
  });

  test('decodes hex document content', () {
    final bytes = decodeDocumentContent({'content': '48656c6c6f'});
    expect(bytes, isNotNull);
    expect(decodeUtf8Bytes(bytes!), 'Hello');
  });
}
