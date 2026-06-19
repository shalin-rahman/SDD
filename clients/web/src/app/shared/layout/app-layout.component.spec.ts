import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AppLayoutComponent } from './app-layout.component';
import { I18nService } from '../services/i18n.service';
import { ThemeService } from '../services/theme.service';

describe('AppLayoutComponent', () => {
  let fixture: ComponentFixture<AppLayoutComponent>;
  let i18n: I18nService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: ThemeService,
          useValue: { mode: () => 'light', toggle: jasmine.createSpy('toggle') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppLayoutComponent);
    i18n = TestBed.inject(I18nService);
    fixture.detectChanges();
  });

  it('renders skip link with a11y.skipToContent label', () => {
    const skip = fixture.nativeElement.querySelector('.app-layout__skip-link') as HTMLAnchorElement;
    expect(skip).toBeTruthy();
    expect(skip.getAttribute('href')).toBe('#main-content');
    expect(skip.textContent?.trim()).toBe(i18n.t('a11y.skipToContent'));
  });

  it('labels main content and navigation landmarks', () => {
    const main = fixture.nativeElement.querySelector('#main-content') as HTMLElement;
    expect(main.getAttribute('aria-label')).toBe(i18n.t('a11y.landmark.main'));

    const sidenav = fixture.nativeElement.querySelector('mat-sidenav') as HTMLElement;
    expect(sidenav.getAttribute('aria-label')).toBe(i18n.t('a11y.landmark.navigation'));
  });
});
