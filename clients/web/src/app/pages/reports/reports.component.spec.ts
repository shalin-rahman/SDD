import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { LayoutService } from '../../shared/services/layout.service';
import { ReportsComponent } from './reports.component';

describe('ReportsComponent', () => {
  let fixture: ComponentFixture<ReportsComponent>;
  let listReports: jasmine.Spy;
  let listReportRuns: jasmine.Spy;
  let getReportRun: jasmine.Spy;

  beforeEach(async () => {
    listReports = jasmine.createSpy('listReports').and.resolveTo({ reports: [] });
    listReportRuns = jasmine.createSpy('listReportRuns').and.resolveTo({ runs: [] });
    getReportRun = jasmine.createSpy('getReportRun');
    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              listReports,
              listReportRuns,
              runReport: jasmine.createSpy('runReport'),
              getReportRun,
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

  it('highlights module report row when code query param matches', async () => {
    listReports.and.resolveTo({
      reports: [
        {
          code: 'LOW_STOCK',
          name: 'Low Stock',
          entity_code: 'PRODUCT',
          schedule_cron: '0 7 * * *',
        },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.highlightCode = 'LOW_STOCK';
    component.loading = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.reports-table__row--highlight')).toBeTruthy();
  });

  it('shows empty-rows message instead of downloading empty CSV', async () => {
    listReports.and.resolveTo({
      reports: [{ code: 'LOW_STOCK', name: 'Low Stock', entity_code: 'PRODUCT', schedule_cron: null }],
    });
    listReportRuns.and.resolveTo({
      runs: [
        {
          run_id: 'run-1',
          report_code: 'LOW_STOCK',
          row_count: 0,
          created_at: '2026-06-14T10:00:00Z',
          status: 'completed',
        },
      ],
    });
    getReportRun.and.resolveTo({ columns: ['sku'], rows: [], report_code: 'LOW_STOCK', run_id: 'run-1' });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    await component.downloadRunCsv(component.history[0]);

    expect(getReportRun).toHaveBeenCalledWith('run-1');
    expect(component.historyError).toContain('No rows returned');
  });
});
