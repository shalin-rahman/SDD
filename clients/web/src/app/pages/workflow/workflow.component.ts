import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmcapApiService } from '../../services/emcap-api.service';

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Workflow tasks</h2>
    <button type="button" (click)="escalate()">Escalate overdue</button>
    <p *ngIf="escalateMsg">{{ escalateMsg }}</p>
    <p *ngIf="error" class="error">{{ error }}</p>
    <p *ngIf="!error && instances.length === 0">No open workflow instances.</p>
    <table *ngIf="instances.length > 0" class="grid-table">
      <tr>
        <th>workflow</th>
        <th>entity</th>
        <th>record</th>
        <th>state</th>
        <th>assignee</th>
        <th>due_at</th>
        <th>actions</th>
      </tr>
      <tr *ngFor="let instance of instances">
        <td>{{ instance.workflow_code }}</td>
        <td>{{ instance.entity_code }}</td>
        <td>{{ instance.record_id }}</td>
        <td>{{ instance.current_state }}</td>
        <td>{{ instance.assignee }}</td>
        <td>{{ instance.due_at ?? instance.sla_hours }}</td>
        <td>
          <button type="button" class="nav-link" (click)="showDetail(instance)">Detail</button>
          <button
            *ngIf="instance.current_state === 'draft'"
            type="button"
            class="nav-link"
            (click)="transition(instance, 'submit')"
          >
            Submit
          </button>
          <button
            *ngIf="instance.current_state === 'submitted'"
            type="button"
            class="nav-link"
            (click)="transition(instance, 'approve')"
          >
            Approve
          </button>
          <button
            *ngIf="instance.current_state === 'submitted'"
            type="button"
            class="nav-link"
            (click)="transition(instance, 'reject')"
          >
            Reject
          </button>
          <button
            *ngIf="instance.current_state === 'submitted'"
            type="button"
            class="nav-link"
            (click)="delegate(instance)"
          >
            Delegate
          </button>
        </td>
      </tr>
    </table>
  `,
})
export class WorkflowComponent implements OnInit {
  private readonly api = inject(EmcapApiService);

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
      this.error = err instanceof Error ? err.message : 'Failed to load tasks';
      this.instances = [];
    }
  }

  async escalate(): Promise<void> {
    const r = await this.api.client.escalateWorkflows();
    this.escalateMsg = `Escalated: ${String(r.escalated)}`;
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
    const delegateTo = window.prompt('Delegate to', 'inventory-manager');
    if (!delegateTo) return;
    const id = String(instance.id ?? '');
    await this.api.client.delegateWorkflow(id, delegateTo);
    await this.load();
  }
}
