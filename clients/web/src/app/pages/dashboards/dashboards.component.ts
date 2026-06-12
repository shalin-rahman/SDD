import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';

@Component({
  selector: 'app-dashboards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>{{ i18n.t('platform.dashboards.title') }}</h2>
    <p *ngIf="error" class="error">{{ error }}</p>
    <p *ngIf="!error && dashboards.length === 0">{{ i18n.t('platform.dashboards.noDashboards') }}</p>
    <div *ngFor="let dash of dashboards">
      <h3>{{ dash.name ?? dash.code ?? i18n.t('platform.dashboards.defaultName') }}</h3>
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
  readonly i18n = inject(I18nService);

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
      this.error = err instanceof Error ? err.message : this.i18n.t('platform.dashboards.loadFailed');
    }
  }

  dashWidgets(dash: Record<string, unknown>): Record<string, unknown>[] {
    return (dash.widgets as Record<string, unknown>[]) ?? [];
  }
}
