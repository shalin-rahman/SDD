import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';



import { EmcapApiService } from '../../services/emcap-api.service';

import { I18nService } from '../../shared/services/i18n.service';

import { RuleEvaluateComponent } from './rule-evaluate.component';



describe('RuleEvaluateComponent', () => {

  let fixture: ComponentFixture<RuleEvaluateComponent>;

  let evaluateWorkflowRule: jasmine.Spy;

  let getPlatformConfig: jasmine.Spy;



  beforeEach(async () => {

    evaluateWorkflowRule = jasmine

      .createSpy('evaluateWorkflowRule')

      .and.resolveTo({ result: true });

    getPlatformConfig = jasmine

      .createSpy('getPlatformConfig')

      .and.resolveTo({ rules: { formula_enabled: true } });

    await TestBed.configureTestingModule({

      imports: [RuleEvaluateComponent],

      providers: [

        provideRouter([]),

        I18nService,

        {

          provide: EmcapApiService,

          useValue: {

            client: { evaluateWorkflowRule, getPlatformConfig },

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

    fixture.detectChanges();

    await fixture.whenStable();



    fixture.componentInstance.contextJson = '{ invalid json';

    fixture.detectChanges();



    const button = fixture.nativeElement.querySelector('button[color="primary"]') as HTMLButtonElement;

    button.click();

    await fixture.whenStable();

    fixture.detectChanges();



    expect(evaluateWorkflowRule).not.toHaveBeenCalled();

    expect(fixture.nativeElement.textContent).toContain('valid JSON object');

  });



  it('shows disabled empty state when formula rules are off', async () => {

    getPlatformConfig.and.resolveTo({ rules: { formula_enabled: false } });

    fixture.detectChanges();

    await fixture.whenStable();

    fixture.detectChanges();



    expect(fixture.nativeElement.textContent).toContain('Formula rules are disabled');

    expect(fixture.nativeElement.querySelector('button[color="primary"]')).toBeNull();

  });



  it('retries config load on failure', async () => {

    getPlatformConfig.and.rejectWith(new Error('cfg down'));

    fixture.detectChanges();

    await fixture.whenStable();

    await fixture.componentInstance.loadConfig();

    fixture.detectChanges();

    await fixture.whenStable();

    expect(fixture.componentInstance.configError).toContain('cfg down');

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();

  });

});


