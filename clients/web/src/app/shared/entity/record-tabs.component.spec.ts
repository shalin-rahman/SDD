import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { RecordTabsComponent } from './record-tabs.component';
import { I18nService } from '../services/i18n.service';

describe('RecordTabsComponent', () => {
  let fixture: ComponentFixture<RecordTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordTabsComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: I18nService,
          useValue: {
            t: (key: string) => key,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordTabsComponent);
  });

  /** Mat-tab bodies are lazy-loaded; render the tab strip first, then activate workflow. */
  function selectWorkflowTab(): void {
    fixture.componentInstance.showWorkflowTab = true;
    fixture.detectChanges();

    const tabHeaders = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLElement>;
    tabHeaders[tabHeaders.length - 1].click();
    fixture.detectChanges();
  }

  it('renders workflow tab when enabled', () => {
    fixture.componentInstance.workflowInstances = [
      {
        id: 'wf-1',
        workflow_code: 'STOCK_ADJUSTMENT',
        current_state: 'draft',
        assignee: 'admin',
      },
    ];
    selectWorkflowTab();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('record.workflow');
    expect(text).toContain('STOCK_ADJUSTMENT');
    expect(text).toContain('record.openInbox');
  });

  it('shows empty workflow message when no instances', () => {
    selectWorkflowTab();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('record.noWorkflowInstances');
  });
});
