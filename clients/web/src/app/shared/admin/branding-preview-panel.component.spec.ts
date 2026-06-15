import { ComponentFixture, TestBed } from '@angular/core/testing';

import { I18nService } from '../services/i18n.service';
import { BrandingPreviewPanelComponent } from './branding-preview-panel.component';

describe('BrandingPreviewPanelComponent', () => {
  let fixture: ComponentFixture<BrandingPreviewPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandingPreviewPanelComponent],
      providers: [I18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(BrandingPreviewPanelComponent);
    fixture.componentInstance.primaryColor = '#005cbb';
    fixture.componentInstance.title = 'Products';
    fixture.detectChanges();
  });

  it('renders toolbar and page header with preview primary', () => {
    const toolbar = fixture.nativeElement.querySelector('.branding-preview__toolbar') as HTMLElement;
    const header = fixture.nativeElement.querySelector('app-page-header');
    expect(toolbar).toBeTruthy();
    expect(header).toBeTruthy();
    expect(fixture.componentInstance.resolvedPrimary()).toBe('#005cbb');
    expect(fixture.componentInstance.contrastAdequate()).toBeTrue();
  });

  it('shows contrast warning for light primary colors', () => {
    fixture.componentInstance.primaryColor = '#ffffcc';
    fixture.detectChanges();
    expect(fixture.componentInstance.contrastAdequate()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.emcap-badge--warn')).toBeTruthy();
  });
});
