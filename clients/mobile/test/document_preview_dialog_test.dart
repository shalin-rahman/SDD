import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';
import 'package:emcap_mobile/widgets/document_preview_dialog.dart';

class _PreviewClient extends EmcapClient {
  _PreviewClient(this._documents);

  final Map<String, Map<String, dynamic>> _documents;

  @override
  Future<Map<String, dynamic>> getDocument(String documentId) async {
    final doc = _documents[documentId];
    if (doc == null) {
      throw Exception('not found');
    }
    return doc;
  }
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await I18nService.loadBundles();
  });

  Future<void> pumpDialog(WidgetTester tester, EmcapClient client, String docId) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Builder(
          builder: (ctx) {
            return Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed: () => showDocumentPreviewDialog(ctx, client: client, documentId: docId),
                  child: const Text('open'),
                ),
              ),
            );
          },
        ),
      ),
    );
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
  }

  testWidgets('document preview dialog shows text content', (tester) async {
    await pumpDialog(
      tester,
      _PreviewClient({
        'doc-text': {
          'filename': 'notes.txt',
          'ocr_text': 'Hello preview',
          'virus_scan_status': 'clean',
        },
      }),
      'doc-text',
    );

    expect(find.text('notes.txt'), findsOneWidget);
    expect(find.text('Hello preview'), findsOneWidget);
    expect(find.text('clean'), findsOneWidget);
    expect(find.text(EmcapLocale.t('document.preview.download')), findsOneWidget);
  });

  testWidgets('document preview dialog shows image from base64', (tester) async {
    // Minimal valid 1x1 PNG (not arbitrary bytes — MemoryImage requires decodable image data).
    const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    await pumpDialog(
      tester,
      _PreviewClient({
        'doc-img': {
          'filename': 'photo.png',
          'content_base64': pngBase64,
        },
      }),
      'doc-img',
    );

    expect(find.text('photo.png'), findsOneWidget);
    expect(find.byType(Image), findsOneWidget);
  });

  testWidgets('document preview dialog shows download-only for pdf', (tester) async {
    final bytes = Uint8List.fromList(List.generate(120, (i) => i % 256));
    await pumpDialog(
      tester,
      _PreviewClient({
        'doc-pdf': {
          'filename': 'report.pdf',
          'content_base64': base64Encode(bytes),
        },
      }),
      'doc-pdf',
    );

    expect(find.text('report.pdf'), findsOneWidget);
    expect(find.text(EmcapLocale.t('document.preview.downloadOnly')), findsOneWidget);
  });

  testWidgets('document preview dialog shows load error with retry', (tester) async {
    await pumpDialog(tester, _PreviewClient({}), 'missing-doc');

    expect(find.text(EmcapLocale.t('document.preview.loadFailed')), findsOneWidget);
    expect(find.text(EmcapLocale.t('common.retry')), findsOneWidget);
  });
}
