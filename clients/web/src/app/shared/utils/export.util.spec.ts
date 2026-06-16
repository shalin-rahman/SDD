import { downloadCsv, printPdfTable } from './export.util';

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

  it('opens printable pdf table window', () => {
    const print = jasmine.createSpy('print');
    const doc = { write: jasmine.createSpy('write'), close: jasmine.createSpy('close') };
    spyOn(window, 'open').and.returnValue({ document: doc, print } as unknown as Window);

    printPdfTable(['sku'], [{ sku: 'A-1' }], 'Products');

    expect(doc.write).toHaveBeenCalled();
    expect(print).toHaveBeenCalled();
  });

  it('no-ops pdf export when popup is blocked', () => {
    spyOn(window, 'open').and.returnValue(null);
    expect(() => printPdfTable(['sku'], [{ sku: 'A-1' }], 'Products')).not.toThrow();
  });
});
