import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { AssistantComponent } from './assistant.component';

describe('AssistantComponent', () => {
  let fixture: ComponentFixture<AssistantComponent>;
  let getPlatformConfig: jasmine.Spy;

  beforeEach(async () => {
    getPlatformConfig = jasmine
      .createSpy('getPlatformConfig')
      .and.resolveTo({ modules: { ai: { enabled: false } } });
    await TestBed.configureTestingModule({
      imports: [AssistantComponent],
      providers: [
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getPlatformConfig,
              aiChat: jasmine.createSpy('aiChat'),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantComponent);
  });

  it('renders disabled state when AI is off', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getPlatformConfig).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('AI disabled in platform config.');
    expect(fixture.nativeElement.querySelector('.assistant-chat')).toBeNull();
  });

  it('renders empty chat with suggestions when AI is enabled', async () => {
    getPlatformConfig.and.resolveTo({ modules: { ai: { enabled: true } } });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-assistant-chat-panel')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Ask a question or pick a suggestion below.');
    expect(fixture.nativeElement.querySelectorAll('.assistant-chat__suggestions button').length).toBe(3);
  });
});
