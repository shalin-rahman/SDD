import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';

import type { ReportSummary } from '../../api/emcap-client';
import { EmcapApiService } from '../../services/emcap-api.service';
import { EmptyStateComponent } from '../../shared/layout/empty-state.component';
import { LoadingPanelComponent } from '../../shared/layout/loading-panel.component';
import { PageHeaderComponent } from '../../shared/layout/page-header.component';
import { SectionCardComponent } from '../../shared/layout/section-card.component';
import { LayoutService } from '../../shared/services/layout.service';
import { I18nService } from '../../shared/services/i18n.service';
import { formatRecordFieldValue } from '../../shared/utils/field-display.util';
import { downloadCsv } from '../../shared/utils/export.util';

export type ReportRunStatus = 'completed' | 'running' | 'failed';

export interface ReportHistoryEntry {
  run_id: string;
  report_code: string;
  report_name: string;
  row_count: number;
  created_at: string;
  status: ReportRunStatus;
  error?: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    PageHeaderComponent,
    LoadingPanelComponent,
    EmptyStateComponent,
    SectionCardComponent,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit, OnDestroy {
  private readonly api = inject(EmcapApiService);
  private readonly layout = inject(LayoutService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  readonly i18n = inject(I18nService);

  loading = true;
  loadError = '';
  historyError = '';
  highlightCode: string | null = null;
  reports: ReportSummary[] = [];
  history: ReportHistoryEntry[] = [];
  runningCode: string | null = null;
  downloadingRunId: string | null = null;
  isMobile = false;

  ngOnInit(): void {
    this.layout.isMobile$.pipe(takeUntil(this.destroy$)).subscribe((mobile) => {
      this.isMobile = mobile;
    });
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.highlightCode = params.get('code');
    });
    void this.loadReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  scheduleLabel(report: ReportSummary): string {
    return report.schedule_cron ?? this.i18n.t('platform.reports.noSchedule');
  }

  async loadReports(): Promise<void> {
    this.loading = true;
    this.loadError = '';
    try {
      const { reports } = await this.api.client.listReports();
      this.reports = reports;
      await this.loadHistory();
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : this.i18n.t('platform.reports.loadFailed');
    } finally {
      this.loading = false;
    }
  }

  async loadHistory(): Promise<void> {
    this.historyError = '';
    try {
      const batches = await Promise.all(
        this.reports.map(async (report) => {
          const { runs } = await this.api.client.listReportRuns(report.code);
          return runs.map((run) => this.normalizeHistoryRun(run, report));
        }),
      );
      this.history = batches
        .flat()
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    } catch (err) {
      this.historyError = err instanceof Error ? err.message : this.i18n.t('platform.reports.historyFailed');
      this.history = [];
    }
  }

  async runReport(code: string): Promise<void> {
    const report = this.reports.find((entry) => entry.code === code);
    const pendingId = `pending-${code}-${Date.now()}`;
    const pending: ReportHistoryEntry = {
      run_id: pendingId,
      report_code: code,
      report_name: report?.name ?? code,
      row_count: 0,
      created_at: new Date().toISOString(),
      status: 'running',
    };
    this.runningCode = code;
    this.history = [pending, ...this.history.filter((entry) => entry.run_id !== pendingId)];

    try {
      await this.api.client.runReport(code);
      this.history = this.history.filter((entry) => entry.run_id !== pendingId);
      await this.loadHistory();
    } catch (err) {
      this.history = this.history.map((entry) =>
        entry.run_id === pendingId
          ? {
              ...entry,
              status: 'failed',
              error: err instanceof Error ? err.message : this.i18n.t('platform.reports.runFailed'),
            }
          : entry,
      );
    } finally {
      this.runningCode = null;
    }
  }

  retryRun(reportCode: string): void {
    void this.runReport(reportCode);
  }

  async downloadRunCsv(entry: ReportHistoryEntry): Promise<void> {
    if (entry.status !== 'completed') {
      return;
    }
    this.downloadingRunId = entry.run_id;
    try {
      const detail = await this.api.client.getReportRun(entry.run_id);
      if (detail.rows.length === 0) {
        this.historyError = this.i18n.t('platform.reports.noRows');
        return;
      }
      const columns = detail.columns.length > 0 ? detail.columns : Object.keys(detail.rows[0] ?? {});
      downloadCsv(columns, detail.rows, `${entry.report_code}-${entry.run_id.slice(0, 8)}.csv`);
    } catch (err) {
      this.historyError = err instanceof Error ? err.message : this.i18n.t('platform.reports.downloadFailed');
    } finally {
      this.downloadingRunId = null;
    }
  }

  formatRunAt(value: string): string {
    return formatRecordFieldValue('created_at', 'datetime', value);
  }

  statusLabel(status: ReportRunStatus): string {
    if (status === 'running') {
      return this.i18n.t('platform.reports.statusRunning');
    }
    if (status === 'failed') {
      return this.i18n.t('platform.reports.statusFailed');
    }
    return this.i18n.t('platform.reports.statusCompleted');
  }

  statusClass(status: ReportRunStatus): string {
    return `status-chip--${status}`;
  }

  entryKey(entry: ReportHistoryEntry): string {
    return entry.run_id;
  }

  isHighlighted(code: string): boolean {
    return this.highlightCode != null && this.highlightCode === code;
  }

  isDownloading(entry: ReportHistoryEntry): boolean {
    return this.downloadingRunId === entry.run_id;
  }

  private normalizeHistoryRun(run: Record<string, unknown>, report: ReportSummary): ReportHistoryEntry {
    return {
      run_id: String(run['run_id'] ?? ''),
      report_code: String(run['report_code'] ?? report.code),
      report_name: report.name,
      row_count: Number(run['row_count'] ?? 0),
      created_at: String(run['created_at'] ?? ''),
      status: run['status'] === 'failed' ? 'failed' : 'completed',
    };
  }
}
