import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingPanelComponent } from './loading-panel.component';
import { I18nService } from '../services/i18n.service';

describe('LoadingPanelComponent', () => {
  let fixture: ComponentFixture<LoadingPanelComponent>;
  let i18n: I18nService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingPanelComponent],
      providers: [I18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingPanelComponent);
    i18n = TestBed.inject(I18nService);
    fixture.detectChanges();
  });

  it('exposes loading status with screen reader aria-label', () => {
    const panel = fixture.nativeElement.querySelector('.loading-panel') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('status');
    expect(panel.getAttribute('aria-live')).toBe('polite');
    expect(panel.getAttribute('aria-label')).toBe(i18n.t('a11y.screenReader.loading'));
  });

  it('renders optional message text', () => {
    fixture.componentInstance.message = 'Loading users…';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Loading users…');
  });
});
