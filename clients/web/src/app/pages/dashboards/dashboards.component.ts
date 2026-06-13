import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { EmcapApiService } from '../../services/emcap-api.service';
import { EmptyStateComponent } from '../../shared/layout/empty-state.component';
import { LoadingPanelComponent } from '../../shared/layout/loading-panel.component';
import { PageHeaderComponent } from '../../shared/layout/page-header.component';
import { SectionCardComponent } from '../../shared/layout/section-card.component';
import { I18nService } from '../../shared/services/i18n.service';

@Component({
  selector: 'app-dashboards',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    PageHeaderComponent,
    LoadingPanelComponent,
    EmptyStateComponent,
    SectionCardComponent,
  ],
  templateUrl: './dashboards.component.html',
  styleUrl: './dashboards.component.scss',
})
export class DashboardsComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  readonly i18n = inject(I18nService);

  loading = true;
  loadError = '';
  dashboards: Record<string, unknown>[] = [];

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.loadError = '';
    try {
      const { dashboards } = await this.api.client.listDashboards();
      this.dashboards = dashboards;
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : this.i18n.t('platform.dashboards.loadFailed');
    } finally {
      this.loading = false;
    }
  }

  dashboardName(dash: Record<string, unknown>): string {
    const name = dash['name'];
    const code = dash['code'];
    if (typeof name === 'string' && name.trim()) {
      return name;
    }
    if (typeof code === 'string' && code.trim()) {
      return code;
    }
    return this.i18n.t('platform.dashboards.defaultName');
  }

  dashboardCode(dash: Record<string, unknown>): string {
    return typeof dash['code'] === 'string' ? dash['code'] : '';
  }

  dashboardWidgets(dash: Record<string, unknown>): Record<string, unknown>[] {
    return (dash['widgets'] as Record<string, unknown>[]) ?? [];
  }

  widgetTitle(widget: Record<string, unknown>): string {
    const label = widget['label'];
    const code = widget['code'];
    if (typeof label === 'string' && label.trim()) {
      return label;
    }
    if (typeof code === 'string' && code.trim()) {
      return code;
    }
    return this.i18n.t('platform.dashboards.defaultWidget');
  }

  widgetValue(widget: Record<string, unknown>): string {
    const value = widget['value'];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
    const metric = widget['metric'];
    if (typeof metric === 'string' && metric.trim()) {
      return metric;
    }
    return '—';
  }

  widgetIcon(widget: Record<string, unknown>): string {
    const icon = widget['icon'];
    if (typeof icon === 'string' && icon.trim()) {
      return icon;
    }
    return 'insights';
  }

  widgetReportCode(widget: Record<string, unknown>): string | null {
    const reportCode = widget['report_code'];
    return typeof reportCode === 'string' && reportCode.trim() ? reportCode : null;
  }
}
