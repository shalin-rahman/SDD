import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { I18nService } from '../services/i18n.service';
import type { ChatRole } from './assistant-chat.types';

@Component({
  selector: 'app-assistant-message-bubble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assistant-message-bubble.component.html',
  styleUrl: './assistant-message-bubble.component.scss',
})
export class AssistantMessageBubbleComponent {
  readonly i18n = inject(I18nService);

  @Input({ required: true }) role!: ChatRole;
  @Input({ required: true }) content = '';

  roleLabel(): string {
    return this.role === 'user'
      ? this.i18n.t('platform.assistant.you')
      : this.i18n.t('platform.assistant.title');
  }
}
