import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MenuItem } from '../../api/emcap-client';
import { AuthService } from '../../services/auth.service';
import { EmcapApiService } from '../../services/emcap-api.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="app-header">
      <div>
        <h1>EMCAP</h1>
        <p class="tenant-status">{{ tenantLine }}</p>
        <select *ngIf="multiTenant" [value]="selectedTenant" (change)="onTenantChange($event)">
          <option *ngFor="let tenant of tenants" [value]="tenantId(tenant)">
            {{ tenantLabel(tenant) }}
          </option>
        </select>
      </div>
      <button type="button" (click)="signOut()">Sign out</button>
    </header>
    <nav class="app-nav">
      <a class="nav-link" routerLink="/app/workflow" routerLinkActive="active">Workflow tasks</a>
      <a class="nav-link" routerLink="/app/reports" routerLinkActive="active">Reports</a>
      <a class="nav-link" routerLink="/app/dashboards" routerLinkActive="active">Dashboards</a>
      <a class="nav-link" routerLink="/app/notifications" routerLinkActive="active"
        >Notifications</a
      >
      <a class="nav-link" routerLink="/app/account" routerLinkActive="active">Account</a>
      <a *ngIf="aiEnabled" class="nav-link" routerLink="/app/assistant" routerLinkActive="active"
        >Assistant</a
      >
      <a
        *ngFor="let menu of menus"
        class="nav-link"
        routerLink="/app/entity/{{ menu.entity_code }}"
        routerLinkActive="active"
      >
        {{ menu.label }}
      </a>
    </nav>
    <main class="app-main">
      <router-outlet />
    </main>
  `,
})
export class ShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(EmcapApiService);
  private readonly router = inject(Router);

  tenantLine = '';
  multiTenant = false;
  selectedTenant = 'default';
  tenants: Record<string, unknown>[] = [];
  menus: MenuItem[] = [];
  aiEnabled = false;

  ngOnInit(): void {
    void this.loadShell();
  }

  async loadShell(): Promise<void> {
    try {
      const config = await this.api.client.getPlatformConfig();
      const modules = config.modules as Record<string, { enabled?: boolean }> | undefined;
      this.aiEnabled = modules?.ai?.enabled === true;
    } catch {
      this.aiEnabled = false;
    }

    try {
      const health = await this.api.client.getHealth();
      this.tenantLine = `mode: multi_tenant=${String(health.multi_tenant)} · ${health.tenant_strategy}`;
      const tenantsPayload = await this.api.client.listTenants();
      this.tenants = tenantsPayload.tenants;
      this.multiTenant = health.multi_tenant;
      if (tenantsPayload.white_label) {
        document.documentElement.style.setProperty('--emcap-primary', '#1a56db');
      }
      if (this.multiTenant && this.tenants.length > 0) {
        this.selectedTenant = this.auth.getTenantId();
      }
    } catch {
      this.tenantLine = '';
    }

    try {
      const { menus } = await this.api.client.getMenus();
      this.menus = menus;
      const url = this.router.url.replace(/\/$/, '');
      if (menus.length > 0 && (url === '/app' || url.endsWith('/app'))) {
        await this.router.navigate(['/app/entity', menus[0].entity_code]);
      }
    } catch {
      this.menus = [];
    }
  }

  tenantId(tenant: Record<string, unknown>): string {
    return String(tenant.id ?? tenant.code ?? 'default');
  }

  tenantLabel(tenant: Record<string, unknown>): string {
    return String(tenant.name ?? tenant.code ?? tenant.id);
  }

  onTenantChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedTenant = value;
    this.api.client.setTenantId(value);
    this.auth.setSession(this.auth.getToken()!, value);
  }

  signOut(): void {
    this.auth.logout();
  }
}
