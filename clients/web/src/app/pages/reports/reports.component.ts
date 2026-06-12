import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import type { ReportSummary } from '../../api/emcap-client';
import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>{{ i18n.t('platform.reports.title') }}</h2>
    <p *ngIf="error" class="error">{{ error }}</p>
    <p *ngIf="!error && reports.length === 0">{{ i18n.t('platform.reports.noReports') }}</p>
    <table *ngIf="reports.length > 0" class="grid-table">
      <tr>
        <th>{{ i18n.t('platform.reports.colCode') }}</th>
        <th>{{ i18n.t('platform.reports.colName') }}</th>
        <th>{{ i18n.t('platform.reports.colEntity') }}</th>
        <th>{{ i18n.t('platform.reports.colSchedule') }}</th>
        <th>{{ i18n.t('platform.reports.colActions') }}</th>
      </tr>
      <tr *ngFor="let report of reports">
        <td>{{ report.code }}</td>
        <td>{{ report.name }}</td>
        <td>{{ report.entity_code }}</td>
        <td>{{ scheduleLabel(report) }}</td>
        <td>
          <button type="button" class="nav-link" (click)="runReport(report.code)">
            {{ i18n.t('platform.reports.run') }}
          </button>
        </td>
      </tr>
    </table>
    <div class="report-result">
      <p *ngIf="running">{{ runningMsg }}</p>
      <p *ngIf="runMeta">{{ runMeta }}</p>
      <h3 *ngIf="resultTitle">{{ resultTitle }}</h3>
      <p *ngIf="noRows">{{ i18n.t('platform.reports.noRows') }}</p>
      <p *ngIf="runError" class="error">{{ runError }}</p>
      <table *ngIf="resultColumns.length > 0" class="grid-table">
        <tr>
          <th *ngFor="let col of resultColumns">{{ col }}</th>
        </tr>
        <tr *ngFor="let row of resultRows">
          <td *ngFor="let col of resultColumns">{{ row[col] }}</td>
        </tr>
      </table>
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  readonly i18n = inject(I18nService);

  reports: ReportSummary[] = [];
  error = '';
  running = false;
  runningMsg = '';
  runMeta = '';
  resultTitle = '';
  resultColumns: string[] = [];
  resultRows: Record<string, unknown>[] = [];
  noRows = false;
  runError = '';

  ngOnInit(): void {
    void this.loadReports();
  }

  scheduleLabel(report: ReportSummary): string {
    return report.schedule_cron ?? this.i18n.t('platform.reports.noSchedule');
  }

  async loadReports(): Promise<void> {
    this.error = '';
    try {
      const { reports } = await this.api.client.listReports();
      this.reports = reports;
    } catch (err) {
      this.error = err instanceof Error ? err.message : this.i18n.t('platform.reports.loadFailed');
    }
  }

  async runReport(code: string): Promise<void> {
    this.running = true;
    this.runningMsg = `${this.i18n.t('platform.reports.running')} ${code}…`;
    this.runMeta = '';
    this.resultTitle = '';
    this.resultColumns = [];
    this.resultRows = [];
    this.noRows = false;
    this.runError = '';
    try {
      const runs = await this.api.client.listReportRuns(code);
      const result = await this.api.client.runReport(code);
      this.running = false;
      this.runningMsg = '';
      this.runMeta = `${this.i18n.t('platform.reports.pastRuns')}: ${runs.runs.length} · ${this.i18n.t('platform.reports.schedule')}: ${this.scheduleLabelForCode(code)}`;
      this.resultTitle = `${result.report_code} (${result.rows.length} rows)`;
      if (result.rows.length === 0) {
        this.noRows = true;
        return;
      }
      this.resultColumns = Object.keys(result.rows[0] ?? {});
      this.resultRows = result.rows;
    } catch (err) {
      this.running = false;
      this.runningMsg = '';
      this.runError = err instanceof Error ? err.message : this.i18n.t('platform.reports.runFailed');
    }
  }

  private scheduleLabelForCode(code: string): string {
    const report = this.reports.find((entry) => entry.code === code);
    return report ? this.scheduleLabel(report) : this.i18n.t('platform.reports.noSchedule');
  }
}
