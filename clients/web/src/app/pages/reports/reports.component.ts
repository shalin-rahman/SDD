import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmcapApiService } from '../../services/emcap-api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Reports</h2>
    <p *ngIf="error" class="error">{{ error }}</p>
    <p *ngIf="!error && reports.length === 0">No reports registered.</p>
    <div *ngIf="reports.length > 0" class="report-picker">
      <button *ngFor="let code of reports" type="button" class="nav-link" (click)="runReport(code)">
        {{ code }}
      </button>
    </div>
    <div class="report-result">
      <p *ngIf="running">{{ runningMsg }}</p>
      <p *ngIf="runMeta">{{ runMeta }}</p>
      <h3 *ngIf="resultTitle">{{ resultTitle }}</h3>
      <p *ngIf="noRows">No rows returned.</p>
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

  reports: string[] = [];
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

  async loadReports(): Promise<void> {
    this.error = '';
    try {
      const { reports } = await this.api.client.listReports();
      this.reports = reports;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load reports';
    }
  }

  async runReport(code: string): Promise<void> {
    this.running = true;
    this.runningMsg = `Running ${code}...`;
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
      this.runMeta = `Past runs: ${runs.runs.length} · schedule: daily (cron in module)`;
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
      this.runError = err instanceof Error ? err.message : 'Report run failed';
    }
  }
}
