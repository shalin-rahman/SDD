import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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
});
