import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>{{ i18n.t('platform.workflow.title') }}</h2>
    <button type="button" (click)="escalate()">{{ i18n.t('platform.workflow.escalate') }}</button>
    <p *ngIf="escalateMsg">{{ escalateMsg }}</p>
    <p *ngIf="error" class="error">{{ error }}</p>
    <p *ngIf="!error && instances.length === 0">{{ i18n.t('platform.workflow.noInstances') }}</p>
    <table *ngIf="instances.length > 0" class="grid-table">
      <tr>
        <th>{{ i18n.t('platform.workflow.colWorkflow') }}</th>
        <th>{{ i18n.t('platform.workflow.colEntity') }}</th>
        <th>{{ i18n.t('platform.workflow.colRecord') }}</th>
        <th>{{ i18n.t('platform.workflow.colState') }}</th>
        <th>{{ i18n.t('platform.workflow.colAssignee') }}</th>
        <th>{{ i18n.t('platform.workflow.colDueAt') }}</th>
        <th>{{ i18n.t('platform.workflow.colActions') }}</th>
      </tr>
      <tr *ngFor="let instance of instances">
        <td>{{ instance.workflow_code }}</td>
        <td>{{ instance.entity_code }}</td>
        <td>{{ instance.record_id }}</td>
        <td>{{ instance.current_state }}</td>
        <td>{{ instance.assignee }}</td>
        <td>{{ instance.due_at ?? instance.sla_hours }}</td>
        <td>
          <button type="button" class="nav-link" (click)="showDetail(instance)">
            {{ i18n.t('platform.workflow.detail') }}
          </button>
          <button
            *ngIf="instance.current_state === 'draft'"
            type="button"
            class="nav-link"
            (click)="transition(instance, 'submit')"
          >
            {{ i18n.t('platform.workflow.submit') }}
          </button>
          <button
            *ngIf="instance.current_state === 'submitted'"
            type="button"
            class="nav-link"
            (click)="transition(instance, 'approve')"
          >
            {{ i18n.t('platform.workflow.approve') }}
          </button>
          <button
            *ngIf="instance.current_state === 'submitted'"
            type="button"
            class="nav-link"
            (click)="transition(instance, 'reject')"
          >
            {{ i18n.t('platform.workflow.reject') }}
          </button>
          <button
            *ngIf="instance.current_state === 'submitted'"
            type="button"
            class="nav-link"
            (click)="delegate(instance)"
          >
            {{ i18n.t('platform.workflow.delegate') }}
          </button>
        </td>
      </tr>
    </table>
  `,
})
export class WorkflowComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  readonly i18n = inject(I18nService);

  instances: Record<string, unknown>[] = [];
  error = '';
  escalateMsg = '';

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.error = '';
    try {
      const { instances } = await this.api.client.listWorkflowInstances();
      this.instances = instances.map((i) => ({
        ...i,
        workflow_code: String(i.workflow_code ?? ''),
        entity_code: String(i.entity_code ?? ''),
        record_id: String(i.record_id ?? ''),
        current_state: String(i.current_state ?? ''),
        assignee: String(i.assignee ?? ''),
      }));
    } catch (err) {
      this.error = err instanceof Error ? err.message : this.i18n.t('platform.workflow.loadFailed');
      this.instances = [];
    }
  }

  async escalate(): Promise<void> {
    const r = await this.api.client.escalateWorkflows();
    this.escalateMsg = `${this.i18n.t('platform.workflow.escalated')}: ${String(r.escalated)}`;
  }

  showDetail(instance: Record<string, unknown>): void {
    const id = String(instance.id ?? '');
    void this.api.client.getWorkflowInstance(id).then((detail) => {
      window.alert(JSON.stringify(detail, null, 2));
    });
  }

  async transition(instance: Record<string, unknown>, action: string): Promise<void> {
    const id = String(instance.id ?? '');
    await this.api.client.transitionWorkflow(id, action, 'admin');
    await this.load();
  }

  async delegate(instance: Record<string, unknown>): Promise<void> {
    const delegateTo = window.prompt(this.i18n.t('platform.workflow.delegatePrompt'), 'inventory-manager');
    if (!delegateTo) return;
    const id = String(instance.id ?? '');
    await this.api.client.delegateWorkflow(id, delegateTo);
    await this.load();
  }
}
