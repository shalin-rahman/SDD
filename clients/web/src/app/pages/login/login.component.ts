import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { EmcapApiService } from '../../services/emcap-api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>EMCAP</h1>
    <form class="login-form" (ngSubmit)="onSubmit()">
      <input [(ngModel)]="username" name="username" placeholder="Username" />
      <input [(ngModel)]="password" name="password" type="password" placeholder="Password" />
      <button type="submit">Sign in</button>
      <button type="button" (click)="onOAuth()">OAuth (client credentials)</button>
      <p class="error" *ngIf="error">{{ error }}</p>
    </form>
  `,
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(EmcapApiService);
  private readonly router = inject(Router);

  username = 'admin';
  password = 'admin123';
  error = '';

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/app']);
    }
  }

  async onSubmit(): Promise<void> {
    this.error = '';
    try {
      const result = await this.api.client.login(this.username, this.password);
      this.auth.setSession(result.access_token, result.tenant_id);
      this.router.navigate(['/app']);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Login failed';
    }
  }

  async onOAuth(): Promise<void> {
    this.error = '';
    try {
      const providers = await this.api.client.getAuthProviders();
      if (!providers.providers.includes('oauth')) {
        this.error = 'OAuth disabled in config';
        return;
      }
      const result = await this.api.client.loginOAuth('emcap-client', 'emcap-secret');
      this.auth.setSession(result.access_token, result.tenant_id);
      this.router.navigate(['/app']);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'OAuth failed';
    }
  }
}
