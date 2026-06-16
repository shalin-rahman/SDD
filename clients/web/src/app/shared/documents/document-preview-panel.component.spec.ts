import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../services/i18n.service';
import { DocumentPreviewPanelComponent } from './document-preview-panel.component';

describe('DocumentPreviewPanelComponent', () => {
  let fixture: ComponentFixture<DocumentPreviewPanelComponent>;
  let getDocument: jasmine.Spy;

  beforeEach(async () => {
    getDocument = jasmine.createSpy('getDocument').and.resolveTo({
      id: 'doc-1',
      filename: 'notes.txt',
      version: 1,
      virus_scan_status: 'clean',
      ocr_text: 'Customer onboarding notes',
    });

    await TestBed.configureTestingModule({
      imports: [DocumentPreviewPanelComponent],
      providers: [
        I18nService,
        {
          provide: EmcapApiService,
          useValue: { client: { getDocument } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentPreviewPanelComponent);
  });

  it('renders text preview without alert', async () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('document', {
      id: 'doc-1',
      filename: 'notes.txt',
      version: '1',
      virus_scan_status: 'clean',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getDocument).toHaveBeenCalledWith('doc-1');
    expect(fixture.nativeElement.textContent).toContain('Customer onboarding notes');
    expect(fixture.nativeElement.textContent).toContain('clean');
  });

  it('shows download-only state for unsupported binary types', async () => {
    getDocument.and.resolveTo({
      id: 'doc-2',
      filename: 'archive.zip',
      version: 1,
      virus_scan_status: 'pending',
      content_base64: '504b0304',
    });

    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('document', {
      id: 'doc-2',
      filename: 'archive.zip',
      version: '1',
      virus_scan_status: 'pending',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Download');
    expect(fixture.nativeElement.textContent).toContain('pending');
  });

  it('handles load errors, version changes, backdrop close, and download guard', async () => {
    getDocument.and.rejectWith(new Error('doc missing'));
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('document', {
      id: 'doc-3',
      filename: 'notes.txt',
      version: '1',
      virus_scan_status: '',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.loadError).toContain('doc missing');
    expect(cmp.virusScanLabel()).toBeTruthy();
    expect(cmp.virusBadgeClass()).toContain('unknown');

    getDocument.and.resolveTo({
      id: 'doc-3',
      filename: 'notes.txt',
      version: 1,
      virus_scan_status: 'clean',
      ocr_text: 'Retry ok',
      versions: [
        { id: 'doc-3', version: 1 },
        { id: 'doc-3-v2', version: 2 },
      ],
    });
    cmp.retryLoad();
    await fixture.whenStable();
    expect(cmp.versions.length).toBe(2);

    cmp.onVersionChange('');
    cmp.onVersionChange('doc-3');
    cmp.onVersionChange('doc-3-v2');
    await fixture.whenStable();

    cmp.previewView = null;
    cmp.download();

    const closed = jasmine.createSpy('closed');
    cmp.closed.subscribe(closed);
    cmp.close();
    expect(closed).toHaveBeenCalled();

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
  });
});
