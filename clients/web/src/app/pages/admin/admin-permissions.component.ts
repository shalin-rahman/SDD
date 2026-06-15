import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { EmcapApiService } from '../../services/emcap-api.service';
import { PageHeaderComponent, type PageBreadcrumb } from '../../shared/layout/page-header.component';
import { I18nService } from '../../shared/services/i18n.service';
import {
  groupPermissions,
  hasSelectedPermission,
  type PermissionGroup,
} from '../../shared/utils/permission.util';

interface AdminRole {
  id: string;
  code: string;
  name: string;
  permissions: string[];
}

@Component({
  selector: 'app-admin-permissions',
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent],
  templateUrl: './admin-permissions.component.html',
  styleUrl: './admin-permissions.component.scss',
})
export class AdminPermissionsComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  readonly i18n = inject(I18nService);

  adminBreadcrumbs(): PageBreadcrumb[] {
    return [
      { label: this.i18n.t('shell.breadcrumb.admin') },
      { label: this.i18n.t('admin.permissions.title') },
    ];
  }

  roles: AdminRole[] = [];
  groups: PermissionGroup[] = [];
  loadError = '';

  ngOnInit(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loadError = '';
    try {
      const [rolesPayload, permissionsPayload] = await Promise.all([
        this.api.client.listAdminRoles(),
        this.api.client.getPermissions(),
      ]);
      this.roles = rolesPayload.roles as unknown as AdminRole[];
      this.groups = groupPermissions(permissionsPayload.permissions);
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : 'Failed to load permissions';
    }
  }

  roleHas(role: AdminRole, permission: string): boolean {
    return hasSelectedPermission(role.permissions, permission);
  }
}
