import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandingPreviewPanelComponent } from './branding-preview-panel.component';

describe('BrandingPreviewPanelComponent', () => {
  let fixture: ComponentFixture<BrandingPreviewPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandingPreviewPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BrandingPreviewPanelComponent);
    fixture.componentInstance.primaryColor = '#ff0000';
    fixture.componentInstance.title = 'Products';
    fixture.detectChanges();
  });

  it('renders toolbar and page header with preview primary', () => {
    const toolbar = fixture.nativeElement.querySelector('.branding-preview__toolbar') as HTMLElement;
    const header = fixture.nativeElement.querySelector('app-page-header');
    expect(toolbar).toBeTruthy();
    expect(header).toBeTruthy();
    expect(fixture.componentInstance.resolvedPrimary()).toBe('#ff0000');
  });
});
