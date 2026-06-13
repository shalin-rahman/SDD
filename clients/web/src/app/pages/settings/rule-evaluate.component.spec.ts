import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { RuleEvaluateComponent } from './rule-evaluate.component';

describe('RuleEvaluateComponent', () => {
  let fixture: ComponentFixture<RuleEvaluateComponent>;
  let evaluateWorkflowRule: jasmine.Spy;

  beforeEach(async () => {
    evaluateWorkflowRule = jasmine
      .createSpy('evaluateWorkflowRule')
      .and.resolveTo({ result: true });
    await TestBed.configureTestingModule({
      imports: [RuleEvaluateComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: { evaluateWorkflowRule },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RuleEvaluateComponent);
  });

  it('renders evaluate panel and shows result after evaluate', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Rule evaluate');

    const button = fixture.nativeElement.querySelector('button[color="primary"]') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(evaluateWorkflowRule).toHaveBeenCalledWith('amount > 100', { amount: 150 });
    expect(fixture.nativeElement.textContent).toContain('true');
  });

  it('shows error for invalid context JSON', async () => {
    fixture.componentInstance.contextJson = '{ invalid json';
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[color="primary"]') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(evaluateWorkflowRule).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('valid JSON object');
  });
});
