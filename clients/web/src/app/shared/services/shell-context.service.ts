import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import type { MenuItem } from '../../api/emcap-client';
import { AuthService } from '../../services/auth.service';
import { EmcapApiService } from '../../services/emcap-api.service';
import {
  buildPlatformLinks,
  filterMenus,
  groupMenusByModule,
  type ModuleNavGroup,
  type PlatformNavLink,
} from '../../services/shell-nav.util';
import { extractModuleToggles, extractUserPermissions } from '../utils/tenant.util';

export interface ShellContextState {
  tenantLine: string;
  multiTenant: boolean;
  selectedTenant: string;
  tenants: Record<string, unknown>[];
  navGroups: ModuleNavGroup[];
  platformLinks: PlatformNavLink[];
  menus: MenuItem[];
}

@Injectable({ providedIn: 'root' })
export class ShellContextService {
  private readonly api = inject(EmcapApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly tenantLine = signal('');
  readonly multiTenant = signal(false);
  readonly selectedTenant = signal('default');
  readonly tenants = signal<Record<string, unknown>[]>([]);
  readonly navGroups = signal<ModuleNavGroup[]>([]);
  readonly platformLinks = signal<PlatformNavLink[]>([]);
  readonly menus = signal<MenuItem[]>([]);

  async load(): Promise<ShellContextState> {
    let modules: Record<string, { enabled?: boolean }> | undefined;
    let userPermissions = ['*.*'];

    try {
      const config = await this.api.client.getPlatformConfig();
      modules = extractModuleToggles(config);
    } catch {
      modules = undefined;
    }

    try {
      const me = await this.api.client.getMe();
      userPermissions = extractUserPermissions(me);
    } catch {
      userPermissions = ['*.*'];
    }

    const platformLinks = buildPlatformLinks(modules, userPermissions);
    this.platformLinks.set(platformLinks);

    let tenantLine = '';
    let multiTenant = false;
    let selectedTenant = this.auth.getTenantId();
    let tenants: Record<string, unknown>[] = [];

    try {
      const health = await this.api.client.getHealth();
      tenantLine = `multi_tenant=${String(health.multi_tenant)} · ${health.tenant_strategy}`;
      const tenantsPayload = await this.api.client.listTenants();
      tenants = tenantsPayload.tenants;
      multiTenant = health.multi_tenant;
      if (tenantsPayload.white_label) {
        document.documentElement.style.setProperty('--emcap-primary', '#1a56db');
      }
      if (multiTenant && tenants.length > 0) {
        selectedTenant = this.auth.getTenantId();
      }
    } catch {
      tenantLine = '';
    }

    this.tenantLine.set(tenantLine);
    this.multiTenant.set(multiTenant);
    this.tenants.set(tenants);
    this.selectedTenant.set(selectedTenant);

    let filteredMenus: MenuItem[] = [];
    try {
      const { menus } = await this.api.client.getMenus();
      filteredMenus = filterMenus(menus, userPermissions, modules);
      this.menus.set(filteredMenus);
      this.navGroups.set(groupMenusByModule(filteredMenus));

      const url = this.router.url.replace(/\/$/, '');
      if (filteredMenus.length > 0 && (url === '/app' || url.endsWith('/app'))) {
        await this.router.navigate(['/app/entity', filteredMenus[0].entity_code]);
      }
    } catch {
      this.menus.set([]);
      this.navGroups.set([]);
    }

    return {
      tenantLine,
      multiTenant,
      selectedTenant,
      tenants,
      navGroups: this.navGroups(),
      platformLinks,
      menus: filteredMenus,
    };
  }

  selectTenant(tenantId: string): void {
    this.selectedTenant.set(tenantId);
    this.api.client.setTenantId(tenantId);
    this.auth.setSession(this.auth.getToken()!, tenantId);
  }
}
