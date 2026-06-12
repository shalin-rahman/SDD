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

export function printPdfTable(columns: string[], rows: Record<string, unknown>[], title: string): void {
  const win = window.open('', '_blank');
  if (!win) return;
  const headers = columns.map((c) => `<th>${c}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${String(row[c] ?? '')}</td>`).join('')}</tr>`)
    .join('');
  win.document.write(
    `<html><head><title>${title}</title></head><body><h1>${title}</h1><table border="1"><tr>${headers}</tr>${body}</table></body></html>`,
  );
  win.document.close();
  win.print();
}
