import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>{{ i18n.t('platform.notifications.title') }}</h2>
    <form class="record-form" (ngSubmit)="send()">
      <select [(ngModel)]="channel" name="channel">
        <option *ngFor="let ch of channels" [value]="ch">{{ ch }}</option>
      </select>
      <input [(ngModel)]="recipient" name="recipient" [placeholder]="i18n.t('platform.notifications.recipient')" />
      <input [(ngModel)]="subject" name="subject" [placeholder]="i18n.t('platform.notifications.subject')" />
      <textarea [(ngModel)]="body" name="body" [placeholder]="i18n.t('platform.notifications.body')"></textarea>
      <button type="submit">{{ i18n.t('platform.notifications.send') }}</button>
      <p *ngIf="formError" class="error">{{ formError }}</p>
    </form>
    <h3>{{ i18n.t('platform.notifications.sent') }} ({{ notifications.length }})</h3>
    <p *ngIf="listError" class="error">{{ listError }}</p>
    <ul>
      <li *ngFor="let note of notifications">
        {{ note.subject ?? note.channel }} → {{ note.recipient }}
      </li>
    </ul>
  `,
})
export class NotificationsComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  readonly i18n = inject(I18nService);

  channels: string[] = ['email'];
  channel = 'email';
  recipient = 'ops@example.com';
  subject = 'EMCAP alert';
  body = 'Stock notification';
  notifications: Record<string, unknown>[] = [];
  formError = '';
  listError = '';

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const config = await this.api.client.getPlatformConfig();
      const ch = (config.notifications as Record<string, boolean>) ?? { email: true };
      this.channels = Object.entries(ch)
        .filter(([, enabled]) => enabled)
        .map(([name]) => name);
      if (this.channels.length > 0) {
        this.channel = this.channels[0];
      }
    } catch {
      this.channels = ['email'];
    }
    try {
      const { notifications } = await this.api.client.listNotifications();
      this.notifications = notifications.map((n) => ({
        subject: String(n.subject ?? n.channel ?? ''),
        recipient: String(n.recipient ?? ''),
        channel: String(n.channel ?? ''),
      }));
    } catch (err) {
      this.listError = err instanceof Error ? err.message : this.i18n.t('platform.notifications.listFailed');
    }
  }

  async send(): Promise<void> {
    this.formError = '';
    try {
      await this.api.client.sendNotification({
        channel: this.channel,
        recipient: this.recipient,
        subject: this.subject,
        body: this.body,
      });
      await this.load();
    } catch (err) {
      this.formError = err instanceof Error ? err.message : this.i18n.t('platform.notifications.sendFailed');
    }
  }
}
