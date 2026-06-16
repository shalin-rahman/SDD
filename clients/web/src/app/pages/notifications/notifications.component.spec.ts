import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { LayoutService } from '../../shared/services/layout.service';
import { NotificationsComponent } from './notifications.component';

describe('NotificationsComponent', () => {
  let fixture: ComponentFixture<NotificationsComponent>;
  let listNotifications: jasmine.Spy;

  beforeEach(async () => {
    listNotifications = jasmine.createSpy('listNotifications').and.resolveTo({ notifications: [] });
    await TestBed.configureTestingModule({
      imports: [NotificationsComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: { listNotifications },
          },
        },
        {
          provide: LayoutService,
          useValue: { isMobile$: of(false) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsComponent);
  });

  it('renders empty state when no notifications', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listNotifications).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('No notifications sent yet.');
  });

  it('filters unread notifications and marks items read', async () => {
    listNotifications.and.resolveTo({
      notifications: [
        {
          id: 'n1',
          channel: 'email',
          recipient: 'a@b.com',
          subject: 'Hello',
          status: 'sent',
          created_at: '2026-06-14T10:00:00Z',
        },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.channelIcon('email')).toBe('email');
    cmp.openNotification(cmp.notifications[0]);
    expect(cmp.isRead(cmp.notifications[0])).toBeTrue();
    cmp.readFilter = 'unread';
    expect(cmp.filteredNotifications.length).toBe(0);
    cmp.closeDetail();
    expect(cmp.selected).toBeNull();
  });

  it('handles load errors and all channel icon branches', async () => {
    listNotifications.and.rejectWith(new Error('notify down'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toContain('notify down');

    const cmp = fixture.componentInstance;
    expect(cmp.channelIcon('push')).toBe('notifications_active');
    expect(cmp.channelIcon('sms')).toBe('sms');
    expect(cmp.channelIcon('whatsapp')).toBe('chat');
    expect(cmp.channelIcon('in_app')).toBe('inbox');
    expect(cmp.channelIcon('unknown')).toBe('notifications');
    expect(cmp.channelLabel('custom')).toBe('custom');
    expect(cmp.statusLabel('DELIVERED')).toBeTruthy();
    expect(cmp.formatSentAt(null)).toBeTruthy();
  });

  it('returns all notifications when read filter is all', async () => {
    listNotifications.and.resolveTo({
      notifications: [
        {
          id: 'n2',
          channel: 'email',
          recipient: 'x@y.com',
          subject: 'Hi',
          status: 'sent',
          created_at: null,
        },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.readFilter = 'all';
    expect(cmp.filteredNotifications.length).toBe(1);
    cmp.openNotification(cmp.notifications[0]);
    cmp.openNotification(cmp.notifications[0]);
    expect(cmp.isRead(cmp.notifications[0])).toBeTrue();
  });
});
