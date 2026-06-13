import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { EmptyStateComponent } from '../../shared/layout/empty-state.component';
import { LoadingPanelComponent } from '../../shared/layout/loading-panel.component';
import { PageHeaderComponent } from '../../shared/layout/page-header.component';
import { SectionCardComponent } from '../../shared/layout/section-card.component';
import { LayoutService } from '../../shared/services/layout.service';
import { I18nService } from '../../shared/services/i18n.service';
import { formatRecordFieldValue } from '../../shared/utils/field-display.util';
import { workflowSlaLevel, type WorkflowSlaLevel } from '../../shared/utils/workflow-sla.util';

export interface WorkflowInstanceRow {
  id: string;
  workflow_code: string;
  entity_code: string;
  record_id: string;
  current_state: string;
  assignee: string;
  due_at: string | null;
  sla_hours: number | null;
}

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    PageHeaderComponent,
    LoadingPanelComponent,
    EmptyStateComponent,
    SectionCardComponent,
  ],
  templateUrl: './workflow.component.html',
  styleUrl: './workflow.component.scss',
})
export class WorkflowComponent implements OnInit, OnDestroy {
  private readonly api = inject(EmcapApiService);
  private readonly layout = inject(LayoutService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  readonly i18n = inject(I18nService);

  loading = true;
  loadError = '';
  escalateMsg = '';
  instances: WorkflowInstanceRow[] = [];
  stateFilter = '';
  assigneeFilter = '';
  isMobile = false;

  detailPayload: Record<string, unknown> | null = null;
  pendingTransition: { instance: WorkflowInstanceRow; action: string } | null = null;
  delegateTarget: WorkflowInstanceRow | null = null;
  delegateTo = 'inventory-manager';

  ngOnInit(): void {
    this.layout.isMobile$.pipe(takeUntil(this.destroy$)).subscribe((mobile) => {
      this.isMobile = mobile;
    });
    void this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredInstances(): WorkflowInstanceRow[] {
    return this.instances.filter((row) => {
      if (this.stateFilter && row.current_state !== this.stateFilter) {
        return false;
      }
      if (this.assigneeFilter && row.assignee !== this.assigneeFilter) {
        return false;
      }
      return true;
    });
  }

  get stateOptions(): string[] {
    return [...new Set(this.instances.map((row) => row.current_state).filter(Boolean))].sort();
  }

  get assigneeOptions(): string[] {
    return [...new Set(this.instances.map((row) => row.assignee).filter(Boolean))].sort();
  }

  get detailEntries(): Array<{ key: string; label: string; value: string }> {
    if (!this.detailPayload) {
      return [];
    }
    const labels: Record<string, string> = {
      id: 'ID',
      workflow_code: this.i18n.t('platform.workflow.colWorkflow'),
      entity_code: this.i18n.t('platform.workflow.colEntity'),
      record_id: this.i18n.t('platform.workflow.colRecord'),
      current_state: this.i18n.t('platform.workflow.colState'),
      assignee: this.i18n.t('platform.workflow.colAssignee'),
      due_at: this.i18n.t('platform.workflow.colDueAt'),
    };
    return Object.entries(this.detailPayload)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        key,
        label: labels[key] ?? key,
        value:
          key === 'due_at'
            ? formatRecordFieldValue(key, 'datetime', value)
            : String(value),
      }));
  }

  async load(): Promise<void> {
    this.loading = true;
    this.loadError = '';
    try {
      const { instances } = await this.api.client.listWorkflowInstances();
      this.instances = instances.map((row) => this.normalizeRow(row));
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : this.i18n.t('platform.workflow.loadFailed');
      this.instances = [];
    } finally {
      this.loading = false;
    }
  }

  async escalate(): Promise<void> {
    const result = await this.api.client.escalateWorkflows();
    this.escalateMsg = `${this.i18n.t('platform.workflow.escalated')}: ${String(result.escalated)}`;
    await this.load();
  }

  openProducts(): void {
    void this.router.navigate(['/app/entity/PRODUCT']);
  }

  entityRoute(entityCode: string): string[] {
    return ['/app/entity', entityCode];
  }

  instanceId(instance: WorkflowInstanceRow): string {
    return instance.id;
  }

  formatDue(instance: WorkflowInstanceRow): string {
    if (instance.due_at) {
      return formatRecordFieldValue('due_at', 'datetime', instance.due_at);
    }
    if (instance.sla_hours != null) {
      return `${instance.sla_hours}h SLA`;
    }
    return '—';
  }

  slaLevel(instance: WorkflowInstanceRow): WorkflowSlaLevel {
    return workflowSlaLevel(instance.due_at);
  }

  slaClass(instance: WorkflowInstanceRow): string {
    const level = this.slaLevel(instance);
    return level === 'none' ? '' : `sla-badge--${level}`;
  }

  slaLabel(instance: WorkflowInstanceRow): string {
    const level = this.slaLevel(instance);
    if (level === 'overdue') {
      return this.i18n.t('platform.workflow.slaOverdue');
    }
    if (level === 'warning') {
      return this.i18n.t('platform.workflow.slaDueSoon');
    }
    if (level === 'ok') {
      return this.i18n.t('platform.workflow.slaOnTrack');
    }
    return '';
  }

  rowActions(instance: WorkflowInstanceRow): string[] {
    if (instance.current_state === 'draft') {
      return ['submit'];
    }
    if (instance.current_state === 'submitted') {
      return ['approve', 'reject'];
    }
    return [];
  }

  canDelegate(instance: WorkflowInstanceRow): boolean {
    return instance.current_state === 'submitted';
  }

  actionLabel(action: string): string {
    const key = `platform.workflow.${action}` as const;
    return this.i18n.t(key);
  }

  confirmTransition(instance: WorkflowInstanceRow, action: string): void {
    this.pendingTransition = { instance, action };
  }

  async runTransition(): Promise<void> {
    if (!this.pendingTransition) {
      return;
    }
    const { instance, action } = this.pendingTransition;
    this.pendingTransition = null;
    await this.api.client.transitionWorkflow(instance.id, action, 'admin');
    await this.load();
  }

  openDelegate(instance: WorkflowInstanceRow): void {
    this.delegateTarget = instance;
    this.delegateTo = 'inventory-manager';
  }

  async runDelegate(): Promise<void> {
    if (!this.delegateTarget || !this.delegateTo.trim()) {
      return;
    }
    const id = this.delegateTarget.id;
    this.delegateTarget = null;
    await this.api.client.delegateWorkflow(id, this.delegateTo.trim());
    await this.load();
  }

  openDetail(instance: WorkflowInstanceRow): void {
    void this.api.client.getWorkflowInstance(instance.id).then((detail) => {
      this.detailPayload = detail;
    });
  }

  closeDetail(): void {
    this.detailPayload = null;
  }

  private normalizeRow(row: Record<string, unknown>): WorkflowInstanceRow {
    return {
      id: String(row['id'] ?? ''),
      workflow_code: String(row['workflow_code'] ?? ''),
      entity_code: String(row['entity_code'] ?? ''),
      record_id: String(row['record_id'] ?? ''),
      current_state: String(row['current_state'] ?? ''),
      assignee: String(row['assignee'] ?? ''),
      due_at: row['due_at'] ? String(row['due_at']) : null,
      sla_hours: typeof row['sla_hours'] === 'number' ? row['sla_hours'] : null,
    };
  }
}
