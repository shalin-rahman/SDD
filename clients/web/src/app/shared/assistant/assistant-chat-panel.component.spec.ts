import { ComponentFixture, TestBed } from '@angular/core/testing';

import { I18nService } from '../services/i18n.service';
import { AssistantChatPanelComponent } from './assistant-chat-panel.component';

describe('AssistantChatPanelComponent', () => {
  let fixture: ComponentFixture<AssistantChatPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantChatPanelComponent],
      providers: [I18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantChatPanelComponent);
    fixture.componentRef.setInput('messages', []);
    fixture.componentRef.setInput('suggestionKeys', [
      'platform.assistant.suggestion.inventory',
      'platform.assistant.suggestion.workflow',
      'platform.assistant.suggestion.reports',
    ]);
  });

  it('renders empty state with suggestions without alert', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.assistant-chat')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Ask a question or pick a suggestion below.');
    expect(fixture.nativeElement.querySelectorAll('.assistant-chat__suggestions button').length).toBe(3);
  });

  it('emits send when suggestion is clicked', () => {
    const sendSpy = jasmine.createSpy('send');
    fixture.componentInstance.send.subscribe(sendSpy);
    fixture.detectChanges();

    const firstButton = fixture.nativeElement.querySelector('.assistant-chat__suggestions button') as HTMLButtonElement;
    firstButton.click();

    expect(sendSpy).toHaveBeenCalledWith('Summarize inventory status');
  });

  it('renders message bubbles for conversation', () => {
    fixture.componentRef.setInput('messages', [
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'assistant', content: 'Hi there' },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-assistant-message-bubble').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Hello');
    expect(fixture.nativeElement.textContent).toContain('Hi there');
  });
});
