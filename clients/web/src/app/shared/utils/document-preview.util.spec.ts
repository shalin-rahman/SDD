import {
  buildDocumentPreviewView,
  mimeTypeFromFilename,
  parseDocumentVersions,
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
  });
});
