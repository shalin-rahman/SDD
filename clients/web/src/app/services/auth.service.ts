import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

const TOKEN_KEY = 'emcap_token';
const TENANT_KEY = 'emcap_tenant';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  getTenantId(): string {
    return sessionStorage.getItem(TENANT_KEY) ?? 'default';
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  setSession(token: string, tenantId: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TENANT_KEY, tenantId);
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TENANT_KEY);
    this.router.navigate(['/']);
  }
}
