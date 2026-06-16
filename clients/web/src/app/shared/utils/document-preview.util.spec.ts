import {
  buildDocumentPreviewView,
  decodeDocumentContent,
  isTextMimeType,
  mimeTypeFromFilename,
  parseDocumentVersions,
  triggerDocumentDownload,
  revokePreviewBlobUrl,
  virusScanBadgeClass,
} from './document-preview.util';

describe('document-preview.util', () => {
  it('detects mime type from filename', () => {
    expect(mimeTypeFromFilename('report.pdf')).toBe('application/pdf');
    expect(mimeTypeFromFilename('photo.png')).toBe('image/png');
  });

  it('builds text preview from ocr_text', () => {
    const view = buildDocumentPreviewView({
      filename: 'notes.txt',
      ocr_text: 'Hello world',
    });
    expect(view.mode).toBe('text');
    expect(view.textContent).toBe('Hello world');
  });

  it('parses version list when API returns versions', () => {
    const versions = parseDocumentVersions(
      {
        version: 2,
        versions: [
          { id: 'v1', version: 1 },
          { id: 'v2', version: 2 },
        ],
      },
      'fallback',
    );
    expect(versions.length).toBe(2);
    expect(versions[1].id).toBe('v2');
  });

  it('maps virus scan status to badge class', () => {
    expect(virusScanBadgeClass('clean')).toBe('virus-badge--clean');
    expect(virusScanBadgeClass('pending')).toBe('virus-badge--pending');
    expect(virusScanBadgeClass('infected')).toBe('virus-badge--blocked');
    expect(virusScanBadgeClass('')).toBe('virus-badge--unknown');
  });

  it('builds image and pdf preview modes from binary content', () => {
    const bytes = new Uint8Array(120).fill(0xab);
    const contentBase64 = btoa(String.fromCharCode(...bytes));

    const imageView = buildDocumentPreviewView({
      filename: 'photo.png',
      content_base64: contentBase64,
    });
    expect(imageView.mode).toBe('image');
    expect(imageView.blobUrl).toBeTruthy();

    const pdfView = buildDocumentPreviewView({
      filename: 'report.pdf',
      content_base64: contentBase64,
    });
    expect(pdfView.mode).toBe('pdf');
  });

  it('falls back to download mode for unknown binary', () => {
    const view = buildDocumentPreviewView({
      filename: 'archive.bin',
      content_base64: btoa('short'),
    });
    expect(view.mode).toBe('download');
  });

  it('decodes hex document content', () => {
    const bytes = decodeDocumentContent({ content: '48656c6c6f' });
    expect(bytes).not.toBeNull();
  });

  it('triggers browser download for document bytes', () => {
    const link = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(link);
    spyOn(link, 'click');
    spyOn(URL, 'createObjectURL').and.returnValue('blob:doc');
    spyOn(URL, 'revokeObjectURL');

    triggerDocumentDownload('notes.txt', new Uint8Array([72, 105]), 'fallback');
    expect(link.click).toHaveBeenCalled();
  });

  it('maps additional virus scan statuses and revokes blob urls', () => {
    expect(virusScanBadgeClass('passed')).toBe('virus-badge--clean');
    expect(virusScanBadgeClass('scanning')).toBe('virus-badge--pending');
    expect(virusScanBadgeClass('blocked')).toBe('virus-badge--blocked');
    expect(virusScanBadgeClass('unknown-status')).toBe('virus-badge--unknown');

    const view = buildDocumentPreviewView({ filename: 'notes.txt', ocr_text: 'Hello' });
    spyOn(URL, 'revokeObjectURL');
    revokePreviewBlobUrl(view);
    revokePreviewBlobUrl(null);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('returns octet-stream for unknown extensions and empty virus status variants', () => {
    expect(mimeTypeFromFilename('data.unknown')).toBe('application/octet-stream');
    expect(virusScanBadgeClass('ok')).toBe('virus-badge--clean');
    expect(virusScanBadgeClass('failed')).toBe('virus-badge--blocked');
  });

  it('rejects empty and malformed content', () => {
    expect(decodeDocumentContent({})).toBeNull();
    expect(decodeDocumentContent({ content: '' })).toBeNull();
    expect(decodeDocumentContent({ content_base64: '' })).toBeNull();
    expect(decodeDocumentContent({ content: 'not-hex-value!' })).toBeNull();
  });

  it('parses version fallback when versions array is empty', () => {
    const versions = parseDocumentVersions({ version: 3 }, 'doc-1');
    expect(versions).toEqual([{ id: 'doc-1', version: '3' }]);
  });

  it('builds text preview from decoded bytes and triggers fallback download', () => {
    const view = buildDocumentPreviewView({
      filename: 'readme.txt',
      content_base64: btoa('plain text'),
    });
    expect(view.mode).toBe('text');
    expect(view.textContent).toContain('plain');

    const link = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(link);
    spyOn(link, 'click');
    spyOn(URL, 'createObjectURL').and.returnValue('blob:fallback');
    spyOn(URL, 'revokeObjectURL');
    triggerDocumentDownload('empty.bin', undefined);
    expect(link.click).not.toHaveBeenCalled();
    triggerDocumentDownload('notes.txt', undefined, 'fallback text');
    expect(link.click).toHaveBeenCalled();
  });

  it('revokes blob url when preview view has blobUrl', () => {
    const bytes = new Uint8Array(120).fill(0xab);
    const view = buildDocumentPreviewView({
      filename: 'photo.png',
      content_base64: btoa(String.fromCharCode(...bytes)),
    });
    spyOn(URL, 'revokeObjectURL');
    revokePreviewBlobUrl(view);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('covers additional mime types, text detection, and queued virus status', () => {
    expect(mimeTypeFromFilename('photo.jpg')).toBe('image/jpeg');
    expect(mimeTypeFromFilename('chart.gif')).toBe('image/gif');
    expect(mimeTypeFromFilename('data.json')).toBe('application/json');
    expect(mimeTypeFromFilename('feed.xml')).toBe('text/xml');
    expect(mimeTypeFromFilename('page.html')).toBe('text/html');
    expect(isTextMimeType('application/json')).toBeTrue();
    expect(isTextMimeType('application/xml')).toBeTrue();
    expect(virusScanBadgeClass('queued')).toBe('virus-badge--pending');
    expect(virusScanBadgeClass('infected')).toBe('virus-badge--blocked');

    const view = buildDocumentPreviewView({
      filename: 'binary.dat',
      ocr_text: 'extracted text',
    });
    expect(view.mode).toBe('text');
    expect(view.textContent).toBe('extracted text');
  });

  it('uses default filename when triggering download', () => {
    const link = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(link);
    spyOn(link, 'click');
    spyOn(URL, 'createObjectURL').and.returnValue('blob:default');
    spyOn(URL, 'revokeObjectURL');

    triggerDocumentDownload('', new Uint8Array([1]), undefined);
    expect(link.download).toBe('document');
  });

  it('covers extension-less filenames, version fallbacks, and default document name', () => {
    expect(mimeTypeFromFilename('README')).toBe('application/octet-stream');
    expect(mimeTypeFromFilename('photo.webp')).toBe('image/webp');
    expect(mimeTypeFromFilename('icon.svg')).toBe('image/svg+xml');

    const versions = parseDocumentVersions(
      { versions: [{ version: 2 }, { id: 'v2' }] },
      'fallback-id',
    );
    expect(versions[0].id).toBe('fallback-id');
    expect(versions[0].version).toBe('2');
    expect(versions[1].version).toBe('2');

    expect(decodeDocumentContent({ content_base64: 'abcde' })).toBeNull();

    const view = buildDocumentPreviewView({
      filename: undefined as unknown as string,
      content_base64: btoa('short'),
    });
    expect(view.mode).toBe('download');
    expect(view.mimeType).toBe('application/octet-stream');
  });
});
