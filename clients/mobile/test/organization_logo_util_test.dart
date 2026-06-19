import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/organization_logo_util.dart';

void main() {
  test('validateOrganizationLogoFile accepts png within size limit', () {
    expect(
      validateOrganizationLogoFile(
        filename: 'logo.png',
        sizeBytes: 1024,
        maxUploadSizeMb: 25,
      ),
      isNull,
    );
  });

  test('validateOrganizationLogoFile rejects empty file', () {
    expect(
      validateOrganizationLogoFile(
        filename: 'logo.png',
        sizeBytes: 0,
        maxUploadSizeMb: 25,
      ),
      'empty',
    );
  });

  test('validateOrganizationLogoFile rejects bad extension', () {
    expect(
      validateOrganizationLogoFile(
        filename: 'logo.exe',
        sizeBytes: 10,
        maxUploadSizeMb: 25,
      ),
      'invalid_type',
    );
  });

  test('validateOrganizationLogoFile rejects oversize file', () {
    expect(
      validateOrganizationLogoFile(
        filename: 'logo.png',
        sizeBytes: 26 * 1024 * 1024,
        maxUploadSizeMb: 25,
      ),
      'too_large',
    );
  });

  test('encodeOrganizationLogoContentBase64 round-trips bytes', () {
    final bytes = Uint8List.fromList([0, 255, 128]);
    expect(encodeOrganizationLogoContentBase64(bytes), base64Encode(bytes));
  });

  test('isOrganizationLogoPreviewAllowed accepts http(s) and document content paths', () {
    expect(isOrganizationLogoPreviewAllowed('https://cdn.example/logo.png'), isTrue);
    expect(isOrganizationLogoPreviewAllowed('/api/v1/documents/id/content'), isTrue);
    expect(isOrganizationLogoPreviewAllowed('file:///tmp/logo.png'), isFalse);
  });

  test('resolveOrganizationLogoPreviewUrl prefixes API base for document paths', () {
    expect(
      resolveOrganizationLogoPreviewUrl(
        '/api/v1/documents/doc-1/content',
        'http://localhost:8000',
      ),
      'http://localhost:8000/api/v1/documents/doc-1/content',
    );
  });

  test('resolveOrganizationLogoPreviewUrl passes through https unchanged', () {
    expect(
      resolveOrganizationLogoPreviewUrl('https://cdn.example/logo.png', 'http://localhost:8000'),
      'https://cdn.example/logo.png',
    );
  });

  test('resolveOrganizationLogoPreviewUrl strips trailing slash from base', () {
    expect(
      resolveOrganizationLogoPreviewUrl(
        '/api/v1/documents/doc-1/content',
        'http://localhost:8000/',
      ),
      'http://localhost:8000/api/v1/documents/doc-1/content',
    );
  });

  test('resolveOrganizationLogoPreviewUrl returns empty for disallowed urls', () {
    expect(resolveOrganizationLogoPreviewUrl('', 'http://localhost:8000'), '');
    expect(resolveOrganizationLogoPreviewUrl('file:///tmp/x.png', 'http://localhost:8000'), '');
  });

  test('isOrganizationLogoPreviewAllowed rejects blank url', () {
    expect(isOrganizationLogoPreviewAllowed(''), isFalse);
    expect(isOrganizationLogoPreviewAllowed('   '), isFalse);
  });

  test('isOrganizationLogoPreviewAllowed accepts http URLs case-insensitively', () {
    expect(isOrganizationLogoPreviewAllowed('HTTP://CDN.EXAMPLE/logo.PNG'), isTrue);
  });

  test('resolveOrganizationLogoPreviewUrl trims whitespace before resolving', () {
    expect(
      resolveOrganizationLogoPreviewUrl(
        '  https://cdn.example/logo.png  ',
        'http://localhost:8000',
      ),
      'https://cdn.example/logo.png',
    );
  });
}
