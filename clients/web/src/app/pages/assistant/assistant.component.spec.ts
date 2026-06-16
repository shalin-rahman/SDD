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

  it('sends chat messages when AI is enabled', async () => {
    const aiChat = jasmine.createSpy('aiChat').and.resolveTo({ reply: 'Inventory is healthy.' });
    getPlatformConfig.and.resolveTo({ modules: { ai: { enabled: true } } });
    TestBed.inject(EmcapApiService).client.aiChat = aiChat;

    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.onSend('Summarize inventory');
    await fixture.whenStable();

    expect(aiChat).toHaveBeenCalledWith('Summarize inventory');
    expect(fixture.componentInstance.messages.length).toBe(2);
  });

  it('handles config load failure and chat send errors', async () => {
    getPlatformConfig.and.rejectWith(new Error('cfg down'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.configError).toContain('cfg down');

    getPlatformConfig.and.resolveTo({ ai: { enabled: true } });
    await fixture.componentInstance.loadConfig();
    expect(fixture.componentInstance.aiEnabled).toBeTrue();

    const aiChat = jasmine.createSpy('aiChat').and.rejectWith(new Error('chat down'));
    TestBed.inject(EmcapApiService).client.aiChat = aiChat;
    fixture.componentInstance.onSend('hello');
    await fixture.whenStable();
    expect(fixture.componentInstance.chatError).toContain('chat down');
    fixture.componentInstance.dismissChatError();
    expect(fixture.componentInstance.chatError).toBe('');
  });
});
