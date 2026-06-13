import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../services/auth.service';
import { EmcapApiService } from '../../services/emcap-api.service';
import { PageHeaderComponent } from '../../shared/layout/page-header.component';
import { EmptyStateComponent } from '../../shared/layout/empty-state.component';
import { LoadingPanelComponent } from '../../shared/layout/loading-panel.component';
import { SectionCardComponent } from '../../shared/layout/section-card.component';
import type { AppLocale } from '../../shared/services/i18n.service';
import { I18nService } from '../../shared/services/i18n.service';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    PageHeaderComponent,
    LoadingPanelComponent,
    EmptyStateComponent,
    SectionCardComponent,
  ],
  templateUrl: './account.component.html',
})
export class AccountComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  private readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);

  loading = true;
  error = '';
  userId = '';
  email = '';
  tenantId = '';
  permissions: string[] = [];
  roles: Record<string, unknown>[] = [];
  showPermissions = false;
  mfaCode = '';
  mfaSecret = '';
  mfaVerified = false;
  mfaError = '';

  ngOnInit(): void {
    this.tenantId = this.auth.getTenantId();
    void this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const [me, permissionsPayload, rolesPayload] = await Promise.all([
        this.api.client.getMe(),
        this.api.client.getPermissions(),
        this.api.client.getRoles(),
      ]);
      this.userId = String(me.user_id ?? me.username ?? me.id ?? '—');
      this.email = String(me.email ?? '');
      this.permissions = permissionsPayload.permissions;
      this.roles = rolesPayload.roles;
    } catch (err) {
      this.error = err instanceof Error ? err.message : this.i18n.t('platform.account.loadFailed');
    } finally {
      this.loading = false;
    }
  }

  onLocaleChange(value: string): void {
    const locale = value as AppLocale;
    if (locale === 'en' || locale === 'fr' || locale === 'bn') {
      this.i18n.setLocale(locale);
    }
  }

  roleLabel(role: Record<string, unknown>): string {
    return String(role.code ?? role.name ?? role);
  }

  enrollMfa(): void {
    this.mfaError = '';
    void this.api.client.enrollMfa().then((r) => {
      this.mfaSecret = `${this.i18n.t('platform.account.mfaSecret')}: ${r.secret}`;
    }).catch((err) => {
      this.mfaError = err instanceof Error ? err.message : 'MFA enroll failed';
    });
  }

  verifyMfa(): void {
    this.mfaError = '';
    void this.api.client.verifyMfa(this.mfaCode).then((r) => {
      this.auth.setSession(r.access_token, this.auth.getTenantId());
      this.mfaVerified = true;
    }).catch((err) => {
      this.mfaError = err instanceof Error ? err.message : 'MFA verify failed';
    });
  }
}
