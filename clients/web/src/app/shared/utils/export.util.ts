export interface PrintableDocumentBlocks {
  header?: string;
  footer?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPrintBlock(text: string | undefined): string {
  if (!text?.trim()) {
    return '';
  }
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function downloadCsv(columns: string[], rows: Record<string, unknown>[], filename: string): void {
  const escape = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [columns.map(escape).join(',')];
  for (const row of rows) {
    lines.push(columns.map((col) => escape(row[col])).join(','));
  }
  downloadBlob(lines.join('\n'), filename, 'text/csv');
}

/** Build printable HTML for a tabular export or document view. */
export function buildPrintableTableHtml(
  columns: string[],
  rows: Record<string, unknown>[],
  title: string,
  blocks: PrintableDocumentBlocks = {},
): string {
  const headers = columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('');
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${escapeHtml(String(row[c] ?? ''))}</td>`).join('')}</tr>`,
    )
    .join('');
  const headerBlock = formatPrintBlock(blocks.header);
  const footerBlock = formatPrintBlock(blocks.footer);
  const headerHtml = headerBlock ? `<header class="doc-header">${headerBlock}</header>` : '';
  const footerHtml = footerBlock ? `<footer class="doc-footer">${footerBlock}</footer>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
body { font-family: system-ui, sans-serif; margin: 1.5rem; }
.doc-header, .doc-footer { white-space: pre-wrap; margin-bottom: 1rem; color: #333; }
.doc-footer { margin-top: 1.5rem; font-size: 0.9rem; color: #555; }
h1 { margin: 0 0 1rem; font-size: 1.25rem; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ccc; padding: 0.35rem 0.5rem; text-align: left; }
th { background: #f5f5f5; }
</style></head><body>
${headerHtml}
<h1>${escapeHtml(title)}</h1>
<table><tr>${headers}</tr>${body}</table>
${footerHtml}
</body></html>`;
}

/** Build printable HTML for a field list document (e.g. invoice detail). */
export function buildPrintableFieldsHtml(
  title: string,
  fields: Array<{ label: string; value: string }>,
  blocks: PrintableDocumentBlocks = {},
): string {
  const headerBlock = formatPrintBlock(blocks.header);
  const footerBlock = formatPrintBlock(blocks.footer);
  const headerHtml = headerBlock ? `<header class="doc-header">${headerBlock}</header>` : '';
  const footerHtml = footerBlock ? `<footer class="doc-footer">${footerBlock}</footer>` : '';
  const rows = fields
    .map(
      (field) =>
        `<tr><th>${escapeHtml(field.label)}</th><td>${escapeHtml(field.value)}</td></tr>`,
    )
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
body { font-family: system-ui, sans-serif; margin: 1.5rem; }
.doc-header, .doc-footer { white-space: pre-wrap; margin-bottom: 1rem; color: #333; }
.doc-footer { margin-top: 1.5rem; font-size: 0.9rem; color: #555; }
h1 { margin: 0 0 1rem; font-size: 1.25rem; }
table { border-collapse: collapse; width: 100%; max-width: 40rem; }
th, td { border: 1px solid #ccc; padding: 0.35rem 0.5rem; text-align: left; vertical-align: top; }
th { background: #f5f5f5; width: 35%; }
</style></head><body>
${headerHtml}
<h1>${escapeHtml(title)}</h1>
<table>${rows}</table>
${footerHtml}
</body></html>`;
}

export function printHtmlDocument(html: string): void {
  const win = window.open('', '_blank');
  if (!win) {
    return;
  }
  win.document.write(html);
  win.document.close();
  win.print();
}

export function printPdfTable(
  columns: string[],
  rows: Record<string, unknown>[],
  title: string,
  blocks: PrintableDocumentBlocks = {},
): void {
  printHtmlDocument(buildPrintableTableHtml(columns, rows, title, blocks));
}
