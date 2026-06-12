import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmcapApiService } from '../../services/emcap-api.service';

@Component({
  selector: 'app-dashboards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Dashboards</h2>
    <p *ngIf="error" class="error">{{ error }}</p>
    <p *ngIf="!error && dashboards.length === 0">No dashboards.</p>
    <div *ngFor="let dash of dashboards">
      <h3>{{ dash.name ?? dash.code ?? 'Dashboard' }}</h3>
      <ul>
        <li *ngFor="let widget of dashWidgets(dash)">
          {{ widget.label ?? widget.code }}: {{ widget.value ?? widget.metric }}
        </li>
      </ul>
    </div>
  `,
})
export class DashboardsComponent implements OnInit {
  private readonly api = inject(EmcapApiService);

  dashboards: Record<string, unknown>[] = [];
  error = '';

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.error = '';
    try {
      const { dashboards } = await this.api.client.listDashboards();
      this.dashboards = dashboards;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load dashboards';
    }
  }

  dashWidgets(dash: Record<string, unknown>): Record<string, unknown>[] {
    return (dash.widgets as Record<string, unknown>[]) ?? [];
  }
}
