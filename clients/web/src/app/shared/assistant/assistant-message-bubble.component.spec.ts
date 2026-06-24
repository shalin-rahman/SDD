import { ComponentFixture, TestBed } from '@angular/core/testing';

import { I18nService } from '../services/i18n.service';
import { AssistantMessageBubbleComponent } from './assistant-message-bubble.component';

describe('AssistantMessageBubbleComponent', () => {
  let fixture: ComponentFixture<AssistantMessageBubbleComponent>;
  let i18n: I18nService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantMessageBubbleComponent],
      providers: [I18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantMessageBubbleComponent);
    i18n = TestBed.inject(I18nService);
    fixture.componentInstance.content = 'Hello there';
  });

  it('labels user messages with you key', () => {
    fixture.componentInstance.role = 'user';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(i18n.t('platform.assistant.you'));
    expect(fixture.nativeElement.textContent).toContain('Hello there');
    expect(fixture.nativeElement.querySelector('.assistant-bubble--user')).toBeTruthy();
  });

  it('labels assistant messages with title key', () => {
    fixture.componentInstance.role = 'assistant';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(i18n.t('platform.assistant.title'));
    expect(fixture.nativeElement.querySelector('.assistant-bubble--assistant')).toBeTruthy();
  });
});
