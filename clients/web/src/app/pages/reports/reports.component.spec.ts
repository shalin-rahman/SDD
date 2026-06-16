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

  it('runs report and handles success and failure branches', async () => {
    const runReport = TestBed.inject(EmcapApiService).client.runReport as jasmine.Spy;
    listReports.and.resolveTo({
      reports: [{ code: 'LOW_STOCK', name: 'Low Stock', entity_code: 'PRODUCT', schedule_cron: null }],
    });
    listReportRuns.and.resolveTo({ runs: [] });

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.scheduleLabel(cmp.reports[0])).toContain('Manual only');
    expect(cmp.statusLabel('running')).toBeTruthy();
    expect(cmp.statusLabel('failed')).toBeTruthy();
    expect(cmp.isHighlighted('LOW_STOCK')).toBeFalse();

    runReport.and.resolveTo({ report_code: 'LOW_STOCK', rows: [] });
    await cmp.runReport('LOW_STOCK');
    expect(runReport).toHaveBeenCalled();

    runReport.and.rejectWith(new Error('run failed'));
    await cmp.runReport('LOW_STOCK');
    expect(cmp.history.some((entry) => entry.status === 'failed')).toBeTrue();
  });

  it('downloads CSV when report run has rows', async () => {
    listReports.and.resolveTo({
      reports: [{ code: 'LOW_STOCK', name: 'Low Stock', entity_code: 'PRODUCT', schedule_cron: '0 7 * * *' }],
    });
    getReportRun.and.resolveTo({
      columns: ['sku'],
      rows: [{ sku: 'A-1' }],
      report_code: 'LOW_STOCK',
      run_id: 'run-2',
    });
    listReportRuns.and.resolveTo({
      runs: [
        {
          run_id: 'run-2',
          report_code: 'LOW_STOCK',
          row_count: 1,
          created_at: '2026-06-14T10:00:00Z',
          status: 'completed',
        },
      ],
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    const entry = cmp.history[0];
    await cmp.downloadRunCsv(entry);
    expect(cmp.historyError).toBe('');
    expect(cmp.isDownloading(entry)).toBeFalse();
  });

  it('handles catalog and history load failures', async () => {
    listReports.and.rejectWith(new Error('catalog down'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toContain('catalog down');

    listReports.and.resolveTo({
      reports: [{ code: 'LOW_STOCK', name: 'Low Stock', entity_code: 'PRODUCT', schedule_cron: null }],
    });
    listReportRuns.and.rejectWith(new Error('history down'));
    await fixture.componentInstance.loadReports();
    expect(fixture.componentInstance.historyError).toContain('history down');
  });

  it('skips download for non-completed runs and retries failed runs', async () => {
    listReports.and.resolveTo({
      reports: [{ code: 'LOW_STOCK', name: 'Low Stock', entity_code: 'PRODUCT', schedule_cron: null }],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    const running: import('./reports.component').ReportHistoryEntry = {
      run_id: 'run-x',
      report_code: 'LOW_STOCK',
      report_name: 'Low Stock',
      row_count: 0,
      created_at: '2026-06-14T10:00:00Z',
      status: 'running',
    };
    await cmp.downloadRunCsv(running);
    expect(getReportRun).not.toHaveBeenCalled();

    cmp.retryRun('LOW_STOCK');
    expect(TestBed.inject(EmcapApiService).client.runReport).toHaveBeenCalled();
    expect(cmp.statusLabel('completed')).toBeTruthy();
    expect(cmp.formatRunAt('2026-06-14T10:00:00Z')).not.toBe('');
  });

  it('surfaces download errors from getReportRun', async () => {
    listReports.and.resolveTo({
      reports: [{ code: 'LOW_STOCK', name: 'Low Stock', entity_code: 'PRODUCT', schedule_cron: null }],
    });
    listReportRuns.and.resolveTo({
      runs: [
        {
          run_id: 'run-err',
          report_code: 'LOW_STOCK',
          row_count: 1,
          created_at: '2026-06-14T10:00:00Z',
          status: 'completed',
        },
      ],
    });
    getReportRun.and.rejectWith(new Error('download down'));

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    await cmp.downloadRunCsv(cmp.history[0]);
    expect(cmp.historyError).toContain('download down');
  });

  it('highlights matching code and downloads CSV with inferred columns', async () => {
    listReports.and.resolveTo({
      reports: [{ code: 'LOW_STOCK', name: 'Low Stock', entity_code: 'PRODUCT', schedule_cron: null }],
    });
    listReportRuns.and.resolveTo({
      runs: [
        {
          run_id: 'run-fail',
          report_code: 'LOW_STOCK',
          row_count: 0,
          created_at: '2026-06-14T10:00:00Z',
          status: 'failed',
        },
        {
          run_id: 'run-cols',
          report_code: 'LOW_STOCK',
          row_count: 1,
          created_at: '2026-06-14T11:00:00Z',
          status: 'completed',
        },
      ],
    });
    getReportRun.and.resolveTo({
      columns: [],
      rows: [{ sku: 'A-1', qty: 2 }],
      report_code: 'LOW_STOCK',
      run_id: 'run-cols',
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.highlightCode = 'LOW_STOCK';
    expect(cmp.isHighlighted('LOW_STOCK')).toBeTrue();
    expect(cmp.statusLabel(cmp.history.find((e) => e.run_id === 'run-fail')!.status)).toBeTruthy();

    const completed = cmp.history.find((e) => e.run_id === 'run-cols')!;
    await cmp.downloadRunCsv(completed);
    expect(cmp.historyError).toBe('');
  });

  it('surfaces non-Error load and run failures', async () => {
    listReports.and.rejectWith('catalog down');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toBeTruthy();

    listReports.and.resolveTo({
      reports: [{ code: 'LOW_STOCK', name: 'Low Stock', entity_code: 'PRODUCT', schedule_cron: null }],
    });
    listReportRuns.and.resolveTo({ runs: [] });
    const runReport = TestBed.inject(EmcapApiService).client.runReport as jasmine.Spy;
    runReport.and.rejectWith('run down');
    await fixture.componentInstance.runReport('LOW_STOCK');
    expect(fixture.componentInstance.history.some((e) => e.status === 'failed')).toBeTrue();
  });
});
