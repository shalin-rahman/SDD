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

  test('builds pdf preview for large pdf payload', () {
    final bytes = Uint8List.fromList(List.generate(120, (i) => i % 256));
    final view = buildDocumentPreviewView({
      'filename': 'report.pdf',
      'content_base64': base64Encode(bytes),
    });
    expect(view.mode, DocumentPreviewMode.pdf);
    expect(view.bytes?.length, 120);
  });

  test('isTextMimeType recognizes text and json', () {
    expect(isTextMimeType('text/plain'), isTrue);
    expect(isTextMimeType('application/json'), isTrue);
    expect(isTextMimeType('application/pdf'), isFalse);
  });

  test('buildDocumentPreviewView falls back to download mode for unknown binary', () {
    final view = buildDocumentPreviewView({
      'filename': 'archive.bin',
      'content_base64': base64Encode(Uint8List.fromList([1, 2, 3])),
    });
    expect(view.mode, DocumentPreviewMode.download);
  });

  test('parseDocumentVersions falls back to single version', () {
    final versions = parseDocumentVersions({'version': 3}, 'doc-1');
    expect(versions.length, 1);
    expect(versions.first.id, 'doc-1');
    expect(versions.first.version, '3');
  });

  test('buildDocumentPreviewView prefers ocr_text over empty bytes', () {
    final view = buildDocumentPreviewView({
      'filename': 'scan.pdf',
      'ocr_text': 'Extracted text',
    });
    expect(view.mode, DocumentPreviewMode.text);
    expect(view.textContent, 'Extracted text');
  });

  test('virusScanBadgeKind handles passed alias', () {
    expect(virusScanBadgeKind('passed'), VirusScanBadgeKind.clean);
  });

  test('decodeDocumentContent returns null for empty payload', () {
    expect(decodeDocumentContent({}), isNull);
    expect(decodeDocumentContent({'content': ''}), isNull);
  });

  test('documentDownloadFallbackText prefers text content', () {
    final view = buildDocumentPreviewView({
      'filename': 'notes.txt',
      'ocr_text': 'Saved note',
    });
    expect(documentDownloadFallbackText(view, 'notes.txt'), 'Saved note');
  });

  test('mimeTypeFromFilename returns octet-stream without extension', () {
    expect(mimeTypeFromFilename('README'), 'application/octet-stream');
    expect(mimeTypeFromFilename('data.unknown'), 'application/octet-stream');
  });

  test('decodeBase64Content rejects invalid padding', () {
    expect(decodeBase64Content('abc'), isNull);
    expect(decodeBase64Content(''), isNull);
  });

  test('decodeHexContent rejects non-hex payload', () {
    expect(decodeHexContent('zz'), isNull);
    expect(decodeHexContent('123'), isNull);
  });

  test('buildDocumentPreviewView decodes text file bytes', () {
    final view = buildDocumentPreviewView({
      'filename': 'readme.txt',
      'content': '48656c6c6f',
    });
    expect(view.mode, DocumentPreviewMode.text);
    expect(view.textContent, 'Hello');
  });

  test('parseDocumentVersions maps invalid row to fallback id', () {
    final versions = parseDocumentVersions(
      {
        'version': 1,
        'versions': ['bad-row'],
      },
      'doc-fallback',
    );
    expect(versions.length, 1);
    expect(versions.first.id, 'doc-fallback');
  });

  test('virusScanBadgeKind covers scanning and blocked aliases', () {
    expect(virusScanBadgeKind(''), VirusScanBadgeKind.unknown);
    expect(virusScanBadgeKind('scanning'), VirusScanBadgeKind.pending);
    expect(virusScanBadgeKind('queued'), VirusScanBadgeKind.pending);
    expect(virusScanBadgeKind('infected'), VirusScanBadgeKind.blocked);
    expect(virusScanBadgeKind('failed'), VirusScanBadgeKind.blocked);
    expect(virusScanBadgeKind('ok'), VirusScanBadgeKind.clean);
    expect(virusScanBadgeKind('mystery'), VirusScanBadgeKind.unknown);
  });

  test('documentDownloadFallbackText falls back to base64 bytes', () {
    final bytes = Uint8List.fromList([1, 2, 3]);
    final view = buildDocumentPreviewView({
      'filename': 'archive.bin',
      'content_base64': base64Encode(bytes),
    });
    expect(documentDownloadFallbackText(view, 'archive.bin'), base64Encode(bytes));
  });

  test('documentDownloadFallbackText uses filename when no content', () {
    final view = buildDocumentPreviewView({'filename': 'empty.bin'});
    expect(documentDownloadFallbackText(view, 'empty.bin'), 'empty.bin');
  });

  test('decodeUtf8Bytes returns empty string on invalid utf8', () {
    expect(decodeUtf8Bytes(Uint8List.fromList([0xFF, 0xFE, 0xFD])), '');
  });

  test('buildDocumentPreviewView uses small image as download mode', () {
    final view = buildDocumentPreviewView({
      'filename': 'tiny.png',
      'content_base64': base64Encode(Uint8List.fromList([1, 2, 3])),
    });
    expect(view.mode, DocumentPreviewMode.download);
  });
}
