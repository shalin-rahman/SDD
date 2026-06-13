import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import { EmptyStateComponent } from '../layout/empty-state.component';
import { LoadingPanelComponent } from '../layout/loading-panel.component';
import { I18nService } from '../services/i18n.service';
import { AssistantMessageBubbleComponent } from './assistant-message-bubble.component';
import type { ChatMessage } from './assistant-chat.types';

@Component({
  selector: 'app-assistant-chat-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    LoadingPanelComponent,
    EmptyStateComponent,
    AssistantMessageBubbleComponent,
  ],
  templateUrl: './assistant-chat-panel.component.html',
  styleUrl: './assistant-chat-panel.component.scss',
})
export class AssistantChatPanelComponent {
  readonly i18n = inject(I18nService);

  @Input({ required: true }) messages: ChatMessage[] = [];
  @Input() sending = false;
  @Input() chatError = '';
  @Input() suggestionKeys: readonly string[] = [];

  @Output() send = new EventEmitter<string>();
  @Output() dismissError = new EventEmitter<void>();

  draft = '';

  suggestionLabel(key: string): string {
    return this.i18n.t(key);
  }

  sendSuggestion(key: string): void {
    this.send.emit(this.i18n.t(key));
  }

  sendDraft(): void {
    const text = this.draft.trim();
    if (!text || this.sending) {
      return;
    }
    this.draft = '';
    this.send.emit(text);
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendDraft();
    }
  }

  messageKey(message: ChatMessage): string {
    return message.id;
  }
}
