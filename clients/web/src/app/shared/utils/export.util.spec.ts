import { downloadCsv } from './export.util';

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
});
