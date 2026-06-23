import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/export_util.dart';

void main() {
  test('buildPrintableFieldsHtml includes header footer and escaped values', () {
    final html = buildPrintableFieldsHtml(
      'Invoice INV-1',
      const [
        PrintableFieldRow(label: 'Amount', value: '100 & 200'),
      ],
      blocks: const PrintableDocumentBlocks(
        header: 'Acme Corp\n1 Main St',
        footer: 'Thank you',
      ),
    );
    expect(html, contains('Acme Corp'));
    expect(html, contains('100 &amp; 200'));
    expect(html, contains('Thank you'));
    expect(html, contains('<title>Invoice INV-1</title>'));
  });
}
