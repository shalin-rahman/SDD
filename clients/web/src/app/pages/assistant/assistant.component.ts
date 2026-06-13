import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmcapApiService } from '../../services/emcap-api.service';
import { AssistantChatPanelComponent } from '../../shared/assistant/assistant-chat-panel.component';
import type { ChatMessage } from '../../shared/assistant/assistant-chat.types';
import { EmptyStateComponent } from '../../shared/layout/empty-state.component';
import { LoadingPanelComponent } from '../../shared/layout/loading-panel.component';
import { PageHeaderComponent } from '../../shared/layout/page-header.component';
import { I18nService } from '../../shared/services/i18n.service';
import { extractAssistantText, nextChatMessageId } from '../../shared/utils/assistant-chat.util';

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    LoadingPanelComponent,
    EmptyStateComponent,
    AssistantChatPanelComponent,
  ],
  templateUrl: './assistant.component.html',
  styleUrl: './assistant.component.scss',
})
export class AssistantComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  readonly i18n = inject(I18nService);

  configLoading = true;
  configError = '';
  aiEnabled = false;
  messages: ChatMessage[] = [];
  sending = false;
  chatError = '';

  readonly suggestionKeys = [
    'platform.assistant.suggestion.inventory',
    'platform.assistant.suggestion.workflow',
    'platform.assistant.suggestion.reports',
  ] as const;

  ngOnInit(): void {
    void this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    this.configLoading = true;
    this.configError = '';
    try {
      const config = await this.api.client.getPlatformConfig();
      const modules = config['modules'] as Record<string, { enabled?: boolean }> | undefined;
      const ai = config['ai'] as { enabled?: boolean } | undefined;
      this.aiEnabled = modules?.ai?.enabled === true || ai?.enabled === true;
    } catch (err) {
      this.configError =
        err instanceof Error ? err.message : this.i18n.t('platform.assistant.loadFailed');
      this.aiEnabled = false;
    } finally {
      this.configLoading = false;
    }
  }

  onSend(text: string): void {
    void this.sendMessage(text);
  }

  dismissChatError(): void {
    this.chatError = '';
  }

  private async sendMessage(text: string): Promise<void> {
    this.chatError = '';
    this.messages = [...this.messages, { id: nextChatMessageId(), role: 'user', content: text }];
    this.sending = true;

    try {
      const result = await this.api.client.aiChat(text);
      const content = extractAssistantText(result);
      this.messages = [...this.messages, { id: nextChatMessageId(), role: 'assistant', content }];
    } catch (err) {
      this.chatError =
        err instanceof Error ? err.message : this.i18n.t('platform.assistant.chatFailed');
    } finally {
      this.sending = false;
    }
  }
}
