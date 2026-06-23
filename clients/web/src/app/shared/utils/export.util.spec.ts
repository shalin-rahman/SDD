import {
  buildPrintableFieldsHtml,
  buildPrintableTableHtml,
  downloadCsv,
  printHtmlDocument,
  printPdfTable,
} from './export.util';

describe('export.util', () => {
  it('builds csv with escaped values', () => {
    const link = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(link);
    spyOn(link, 'click');
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    spyOn(URL, 'revokeObjectURL');

    downloadCsv(['name'], [{ name: 'A "quoted"' }], 'test.csv');

    expect(link.download).toBe('test.csv');
    expect(link.click).toHaveBeenCalled();
  });

  it('builds printable table html with org header and footer blocks', () => {
    const html = buildPrintableTableHtml(['sku'], [{ sku: 'A-1' }], 'Products', {
      header: 'Acme Corp',
      footer: 'Generated 2026-06-23',
    });
    expect(html).toContain('Acme Corp');
    expect(html).toContain('Generated 2026-06-23');
    expect(html).toContain('<td>A-1</td>');
    expect(html).toContain('doc-header');
    expect(html).toContain('doc-footer');
  });

  it('escapes html in printable field rows', () => {
    const html = buildPrintableFieldsHtml(
      'Invoice',
      [{ label: 'Notes', value: '<script>alert(1)</script>' }],
      { header: 'Header & Co' },
    );
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Header &amp; Co');
  });

  it('opens printable pdf table window', () => {
    const print = jasmine.createSpy('print');
    const doc = { write: jasmine.createSpy('write'), close: jasmine.createSpy('close') };
    spyOn(window, 'open').and.returnValue({ document: doc, print } as unknown as Window);

    printPdfTable(['sku'], [{ sku: 'A-1' }], 'Products', { header: 'Acme' });

    expect(doc.write).toHaveBeenCalled();
    const html = doc.write.calls.mostRecent().args[0] as string;
    expect(html).toContain('Acme');
    expect(print).toHaveBeenCalled();
  });

  it('printHtmlDocument no-ops when popup is blocked', () => {
    spyOn(window, 'open').and.returnValue(null);
    expect(() => printHtmlDocument('<html></html>')).not.toThrow();
  });

  it('no-ops pdf export when popup is blocked', () => {
    spyOn(window, 'open').and.returnValue(null);
    expect(() => printPdfTable(['sku'], [{ sku: 'A-1' }], 'Products')).not.toThrow();
  });
});
