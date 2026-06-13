import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { LayoutService } from '../../shared/services/layout.service';
import { ReportsComponent } from './reports.component';

describe('ReportsComponent', () => {
  let fixture: ComponentFixture<ReportsComponent>;
  let listReports: jasmine.Spy;

  beforeEach(async () => {
    listReports = jasmine.createSpy('listReports').and.resolveTo({ reports: [] });
    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              listReports,
              listReportRuns: jasmine.createSpy('listReportRuns').and.resolveTo({ runs: [] }),
              runReport: jasmine.createSpy('runReport'),
              getReportRun: jasmine.createSpy('getReportRun'),
            },
          },
        },
        { provide: LayoutService, useValue: { isMobile$: of(false) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
  });

  it('renders empty catalog when no reports', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listReports).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('No reports registered');
  });
});
