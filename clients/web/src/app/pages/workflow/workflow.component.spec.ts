import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { LayoutService } from '../../shared/services/layout.service';
import { WorkflowComponent } from './workflow.component';

describe('WorkflowComponent', () => {
  let fixture: ComponentFixture<WorkflowComponent>;
  let listWorkflowInstances: jasmine.Spy;

  beforeEach(async () => {
    listWorkflowInstances = jasmine.createSpy('listWorkflowInstances').and.resolveTo({ instances: [] });
    await TestBed.configureTestingModule({
      imports: [WorkflowComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              listWorkflowInstances,
              escalateWorkflows: jasmine.createSpy('escalateWorkflows').and.resolveTo({ escalated: 0 }),
              getWorkflowInstance: jasmine.createSpy('getWorkflowInstance'),
              transitionWorkflow: jasmine.createSpy('transitionWorkflow'),
              delegateWorkflow: jasmine.createSpy('delegateWorkflow'),
            },
          },
        },
        {
          provide: LayoutService,
          useValue: { isMobile$: of(false) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowComponent);
  });

  it('renders empty state when no instances', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(listWorkflowInstances).toHaveBeenCalled();
    expect(text).toContain('No open workflow instances');
  });

  it('localizes workflow state labels', () => {
    expect(fixture.componentInstance.stateLabel('draft')).toBe('Draft');
    expect(fixture.componentInstance.stateLabel('unknown')).toBe('unknown');
  });

  it('filters instances and runs transitions', async () => {
    listWorkflowInstances.and.resolveTo({
      instances: [
        {
          id: 'wf-1',
          workflow_code: 'APPROVAL',
          entity_code: 'PRODUCT',
          record_id: 'rec-1',
          current_state: 'submitted',
          assignee: 'admin',
          due_at: null,
          sla_hours: 24,
        },
      ],
    });
    const transitionWorkflow = jasmine
      .createSpy('transitionWorkflow')
      .and.resolveTo({ current_state: 'approved' });
    TestBed.inject(EmcapApiService).client.transitionWorkflow = transitionWorkflow;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.filteredInstances.length).toBe(1);
    expect(cmp.rowActions(cmp.instances[0])).toEqual(['approve', 'reject']);
    cmp.confirmTransition(cmp.instances[0], 'approve');
    await cmp.runTransition();
    expect(transitionWorkflow).toHaveBeenCalledWith('wf-1', 'approve', 'admin');
  });

  it('escalates workflows and shows message', async () => {
    const escalate = TestBed.inject(EmcapApiService).client.escalateWorkflows as jasmine.Spy;
    escalate.and.resolveTo({ escalated: 2 });

    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.componentInstance.escalate();

    expect(fixture.componentInstance.escalateMsg).toContain('2');
  });

  it('delegates workflow instance to another assignee', async () => {
    listWorkflowInstances.and.resolveTo({
      instances: [
        {
          id: 'wf-2',
          workflow_code: 'APPROVAL',
          entity_code: 'PRODUCT',
          record_id: 'rec-2',
          current_state: 'submitted',
          assignee: 'admin',
          due_at: null,
          sla_hours: null,
        },
      ],
    });
    const delegateWorkflow = jasmine.createSpy('delegateWorkflow').and.resolveTo({});
    TestBed.inject(EmcapApiService).client.delegateWorkflow = delegateWorkflow;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.openDelegate(cmp.instances[0]);
    await cmp.runDelegate();
    expect(delegateWorkflow).toHaveBeenCalledWith('wf-2', 'inventory-manager');
  });

  it('formats due dates and filters instances', async () => {
    listWorkflowInstances.and.resolveTo({
      instances: [
        {
          id: 'wf-3',
          workflow_code: 'APPROVAL',
          entity_code: 'PRODUCT',
          record_id: 'rec-3',
          current_state: 'draft',
          assignee: 'bob',
          due_at: '2026-06-20T10:00:00Z',
          sla_hours: null,
        },
        {
          id: 'wf-4',
          workflow_code: 'APPROVAL',
          entity_code: 'PRODUCT',
          record_id: 'rec-4',
          current_state: 'submitted',
          assignee: 'alice',
          due_at: null,
          sla_hours: 12,
        },
      ],
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.stateFilter = 'draft';
    expect(cmp.filteredInstances.length).toBe(1);
    expect(cmp.formatDue(cmp.instances[0])).not.toBe('');
    expect(cmp.formatDue(cmp.instances[1])).toContain('12');
    expect(cmp.slaLabel(cmp.instances[0])).toBeTruthy();
    cmp.confirmTransition(cmp.instances[1], 'approve');
    expect(cmp.pendingTransition?.action).toBe('approve');
  });

  it('handles load errors and empty transition/delegate guards', async () => {
    listWorkflowInstances.and.rejectWith(new Error('wf down'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toContain('wf down');

    const cmp = fixture.componentInstance;
    await cmp.runTransition();
    cmp.delegateTarget = cmp.instances[0] ?? null;
    cmp.delegateTo = '  ';
    await cmp.runDelegate();
    expect(TestBed.inject(EmcapApiService).client.delegateWorkflow).not.toHaveBeenCalled();
  });

  it('filters by assignee and exposes draft row actions', async () => {
    listWorkflowInstances.and.resolveTo({
      instances: [
        {
          id: 'wf-d',
          workflow_code: 'APPROVAL',
          entity_code: 'PRODUCT',
          record_id: 'rec-d',
          current_state: 'draft',
          assignee: 'carol',
          due_at: null,
          sla_hours: null,
        },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.assigneeFilter = 'carol';
    expect(cmp.filteredInstances.length).toBe(1);
    expect(cmp.rowActions(cmp.instances[0])).toEqual(['submit']);
    expect(cmp.canDelegate(cmp.instances[0])).toBeFalse();
    expect(cmp.formatDue(cmp.instances[0])).toBeTruthy();
    expect(cmp.slaClass(cmp.instances[0])).toBe('');
    expect(cmp.actionLabel('approve')).toBeTruthy();
    expect(cmp.entityRoute('PRODUCT')).toEqual(['/app/entity', 'PRODUCT']);
    expect(cmp.instanceId(cmp.instances[0])).toBe('wf-d');
  });

  it('opens and closes workflow detail drawer', async () => {
    const getWorkflowInstance = jasmine
      .createSpy('getWorkflowInstance')
      .and.resolveTo({
        id: 'wf-5',
        workflow_code: 'APPROVAL',
        entity_code: 'PRODUCT',
        record_id: 'rec-5',
        current_state: 'submitted',
        assignee: 'admin',
        due_at: '2026-06-20T10:00:00Z',
      });
    TestBed.inject(EmcapApiService).client.getWorkflowInstance = getWorkflowInstance;
    listWorkflowInstances.and.resolveTo({
      instances: [
        {
          id: 'wf-5',
          workflow_code: 'APPROVAL',
          entity_code: 'PRODUCT',
          record_id: 'rec-5',
          current_state: 'submitted',
          assignee: 'admin',
          due_at: '2026-06-20T10:00:00Z',
          sla_hours: null,
        },
      ],
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    await cmp.openDetail(cmp.instances[0]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(getWorkflowInstance).toHaveBeenCalledWith('wf-5');
    expect(cmp.detailEntries.length).toBeGreaterThan(0);
    cmp.closeDetail();
    expect(cmp.detailPayload).toBeNull();
    expect(cmp.detailTarget).toBeNull();
  });

  it('covers state filter, SLA labels, and openProducts navigation', async () => {
    listWorkflowInstances.and.resolveTo({
      instances: [
        {
          id: 'wf-6',
          workflow_code: 'APPROVAL',
          entity_code: 'PRODUCT',
          record_id: 'rec-6',
          current_state: 'approved',
          assignee: 'admin',
          due_at: '2000-01-01T00:00:00Z',
          sla_hours: null,
        },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.stateFilter = 'approved';
    expect(cmp.stateOptions).toContain('approved');
    expect(cmp.assigneeOptions).toContain('admin');
    expect(cmp.rowActions(cmp.instances[0])).toEqual([]);
    expect(cmp.slaLabel(cmp.instances[0])).toBeTruthy();
    expect(cmp.slaClass(cmp.instances[0])).toContain('sla-badge');

    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    cmp.openProducts();
    expect(navigate).toHaveBeenCalled();
  });

  it('covers SLA ok label, non-Error load failure, and filtered detail entries', async () => {
    listWorkflowInstances.and.rejectWith('wf down');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toBeTruthy();

    const cmp = fixture.componentInstance;
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    cmp.instances = [
      {
        id: 'wf-ok',
        workflow_code: 'APPROVAL',
        entity_code: 'PRODUCT',
        record_id: 'rec-ok',
        current_state: 'submitted',
        assignee: 'admin',
        due_at: future,
        sla_hours: null,
      },
    ];
    expect(cmp.slaLabel(cmp.instances[0])).toBeTruthy();
    expect(cmp.slaClass(cmp.instances[0])).toContain('sla-badge--ok');

    cmp.detailPayload = {
      id: 'wf-ok',
      workflow_code: 'APPROVAL',
      entity_code: 'PRODUCT',
      record_id: 'rec-ok',
      current_state: 'submitted',
      assignee: 'admin',
      due_at: future,
      empty_field: '',
      null_field: null,
    };
    expect(cmp.detailEntries.some((e) => e.key === 'empty_field')).toBeFalse();
    expect(cmp.detailEntries.some((e) => e.key === 'due_at')).toBeTrue();
  });
});
