import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(EmcapApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(I18nService);

  username = 'admin';
  password = 'admin123';
  error = '';
  providers: string[] = [];
  selectedProvider = 'username_password';
  loadingProviders = true;

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      void this.router.navigate(['/app']);
      return;
    }
    if (this.route.snapshot.queryParamMap.get('sessionExpired') === '1') {
      this.error = this.i18n.t('security.session.expired');
    }
    void this.loadProviders();
  }

  async loadProviders(): Promise<void> {
    this.loadingProviders = true;
    try {
      const payload = await this.api.client.getAuthProviders();
      this.providers = payload.providers;
      if (!this.providers.includes(this.selectedProvider)) {
        this.selectedProvider = this.providers[0] ?? 'username_password';
      }
    } catch {
      this.providers = ['username_password'];
    } finally {
      this.loadingProviders = false;
    }
  }

  selectProvider(provider: string): void {
    this.selectedProvider = provider;
    this.error = '';
  }

  providerLabel(provider: string): string {
    const key = `platform.login.provider.${provider}`;
    const label = this.i18n.t(key);
    return label === key ? provider : label;
  }

  async onSubmit(): Promise<void> {
    this.error = '';
    try {
      const result = await this.api.client.login(this.username, this.password);
      this.auth.setSession(result.access_token, result.tenant_id);
      void this.router.navigate(['/app']);
    } catch (err) {
      this.error = err instanceof Error ? err.message : this.i18n.t('platform.login.loginFailed');
    }
  }

  async onOAuth(): Promise<void> {
    this.error = '';
    try {
      const providers = await this.api.client.getAuthProviders();
      if (!providers.providers.includes('oauth')) {
        this.error = this.i18n.t('platform.login.oauthDisabled');
        return;
      }
      const result = await this.api.client.loginOAuth('emcap-client', 'emcap-secret');
      this.auth.setSession(result.access_token, result.tenant_id);
      void this.router.navigate(['/app']);
    } catch (err) {
      this.error = err instanceof Error ? err.message : this.i18n.t('platform.login.oauthFailed');
    }
  }
}
