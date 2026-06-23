/// Printable HTML helpers — web `export.util.ts` parity.

class PrintableDocumentBlocks {
  const PrintableDocumentBlocks({this.header = '', this.footer = ''});

  final String header;
  final String footer;
}

class PrintableFieldRow {
  const PrintableFieldRow({required this.label, required this.value});

  final String label;
  final String value;
}

String escapeHtml(String value) {
  return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
}

String _formatPrintBlock(String? text) {
  final trimmed = text?.trim() ?? '';
  if (trimmed.isEmpty) {
    return '';
  }
  return escapeHtml(trimmed).replaceAll('\n', '<br>');
}

/// Build printable HTML for a field list document (e.g. invoice detail).
String buildPrintableFieldsHtml(
  String title,
  List<PrintableFieldRow> fields, {
  PrintableDocumentBlocks blocks = const PrintableDocumentBlocks(),
}) {
  final headerBlock = _formatPrintBlock(blocks.header);
  final footerBlock = _formatPrintBlock(blocks.footer);
  final headerHtml =
      headerBlock.isNotEmpty ? '<header class="doc-header">$headerBlock</header>' : '';
  final footerHtml =
      footerBlock.isNotEmpty ? '<footer class="doc-footer">$footerBlock</footer>' : '';
  final rows = fields
      .map(
        (field) =>
            '<tr><th>${escapeHtml(field.label)}</th><td>${escapeHtml(field.value)}</td></tr>',
      )
      .join('');
  return '''<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
body { font-family: system-ui, sans-serif; margin: 1.5rem; }
.doc-header, .doc-footer { white-space: pre-wrap; margin-bottom: 1rem; color: #333; }
.doc-footer { margin-top: 1.5rem; font-size: 0.9rem; color: #555; }
h1 { margin: 0 0 1rem; font-size: 1.25rem; }
table { border-collapse: collapse; width: 100%; max-width: 40rem; }
th, td { border: 1px solid #ccc; padding: 0.35rem 0.5rem; text-align: left; vertical-align: top; }
th { background: #f5f5f5; width: 35%; }
</style></head><body>
$headerHtml
<h1>${escapeHtml(title)}</h1>
<table>$rows</table>
$footerHtml
</body></html>''';
}
