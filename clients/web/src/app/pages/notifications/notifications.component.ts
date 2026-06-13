import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { EmptyStateComponent } from '../../shared/layout/empty-state.component';
import { LoadingPanelComponent } from '../../shared/layout/loading-panel.component';
import { PageHeaderComponent } from '../../shared/layout/page-header.component';
import { SectionCardComponent } from '../../shared/layout/section-card.component';
import { LayoutService } from '../../shared/services/layout.service';
import { I18nService } from '../../shared/services/i18n.service';
import { formatRecordFieldValue } from '../../shared/utils/field-display.util';

export type NotificationReadFilter = 'all' | 'unread';

export interface NotificationItem {
  id: string;
  channel: string;
  recipient: string;
  subject: string;
  status: string;
  created_at: string | null;
}

const READ_IDS_STORAGE_KEY = 'emcap.notifications.readIds';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    LoadingPanelComponent,
    EmptyStateComponent,
    SectionCardComponent,
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private readonly api = inject(EmcapApiService);
  private readonly layout = inject(LayoutService);
  private readonly destroy$ = new Subject<void>();
  readonly i18n = inject(I18nService);

  loading = true;
  loadError = '';
  notifications: NotificationItem[] = [];
  readFilter: NotificationReadFilter = 'all';
  selected: NotificationItem | null = null;
  isMobile = false;
  private readIds = new Set<string>();

  ngOnInit(): void {
    this.readIds = this.loadReadIds();
    this.layout.isMobile$.pipe(takeUntil(this.destroy$)).subscribe((mobile) => {
      this.isMobile = mobile;
    });
    void this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredNotifications(): NotificationItem[] {
    if (this.readFilter === 'unread') {
      return this.notifications.filter((note) => !this.isRead(note));
    }
    return this.notifications;
  }

  async load(): Promise<void> {
    this.loading = true;
    this.loadError = '';
    try {
      const { notifications } = await this.api.client.listNotifications();
      this.notifications = notifications.map((row) => this.normalizeRow(row));
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : this.i18n.t('platform.notifications.listFailed');
      this.notifications = [];
    } finally {
      this.loading = false;
    }
  }

  isRead(note: NotificationItem): boolean {
    return this.readIds.has(note.id);
  }

  openNotification(note: NotificationItem): void {
    this.selected = note;
    this.markRead(note.id);
  }

  closeDetail(): void {
    this.selected = null;
  }

  channelIcon(channel: string): string {
    const normalized = channel.toLowerCase().replace(/[_-]/g, '');
    if (normalized === 'email') {
      return 'email';
    }
    if (normalized === 'push') {
      return 'notifications_active';
    }
    if (normalized === 'sms') {
      return 'sms';
    }
    if (normalized === 'whatsapp') {
      return 'chat';
    }
    if (normalized === 'inapp') {
      return 'inbox';
    }
    return 'notifications';
  }

  channelLabel(channel: string): string {
    const key = `platform.notifications.channel.${channel.toLowerCase()}` as const;
    const translated = this.i18n.t(key);
    return translated === key ? channel : translated;
  }

  formatSentAt(value: string | null): string {
    if (!value) {
      return '—';
    }
    return formatRecordFieldValue('created_at', 'datetime', value);
  }

  statusLabel(status: string): string {
    const key = `platform.notifications.status.${status.toLowerCase()}` as const;
    const translated = this.i18n.t(key);
    return translated === key ? status : translated;
  }

  itemKey(note: NotificationItem): string {
    return note.id;
  }

  private normalizeRow(row: Record<string, unknown>): NotificationItem {
    return {
      id: String(row['id'] ?? ''),
      channel: String(row['channel'] ?? 'in-app'),
      recipient: String(row['recipient'] ?? ''),
      subject: String(row['subject'] ?? ''),
      status: String(row['status'] ?? 'sent'),
      created_at: row['created_at'] ? String(row['created_at']) : null,
    };
  }

  private loadReadIds(): Set<string> {
    try {
      const raw = localStorage.getItem(READ_IDS_STORAGE_KEY);
      if (!raw) {
        return new Set<string>();
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return new Set<string>();
      }
      return new Set(parsed.filter((id): id is string => typeof id === 'string'));
    } catch {
      return new Set<string>();
    }
  }

  private markRead(id: string): void {
    if (!id || this.readIds.has(id)) {
      return;
    }
    this.readIds.add(id);
    localStorage.setItem(READ_IDS_STORAGE_KEY, JSON.stringify([...this.readIds]));
  }
}
