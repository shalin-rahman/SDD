import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { EmcapApiService } from '../../services/emcap-api.service';
import { AdminFormPanelComponent } from '../../shared/admin/admin-form-panel.component';
import { AdminListToolbarComponent } from '../../shared/admin/admin-list-toolbar.component';
import { PermissionPickerComponent } from '../../shared/admin/permission-picker.component';
import { DetailPlaceholderComponent } from '../../shared/layout/detail-placeholder.component';
import { MasterDetailLayoutComponent } from '../../shared/layout/master-detail-layout.component';
import { PageHeaderComponent } from '../../shared/layout/page-header.component';
import { LayoutService } from '../../shared/services/layout.service';
import { I18nService } from '../../shared/services/i18n.service';

interface AdminRole {
  id: string;
  code: string;
  name: string;
  permissions: string[];
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    PageHeaderComponent,
    MasterDetailLayoutComponent,
    AdminListToolbarComponent,
    AdminFormPanelComponent,
    PermissionPickerComponent,
    DetailPlaceholderComponent,
  ],
  templateUrl: './admin-roles.component.html',
  styleUrl: './admin-roles.component.scss',
})
export class AdminRolesComponent implements OnInit, OnDestroy {
  private readonly api = inject(EmcapApiService);
  private readonly layout = inject(LayoutService);
  readonly i18n = inject(I18nService);
  private readonly destroy$ = new Subject<void>();

  roles: AdminRole[] = [];
  allPermissions: string[] = [];
  loadError = '';
  selectedId: string | null = null;
  creating = false;
  mobileDetailOpen = false;
  isMobile = false;

  draftCode = '';
  draftName = '';
  draftPermissions: string[] = [];

  displayedColumns = ['code', 'name', 'permissions'];

  ngOnInit(): void {
    this.layout.isMobile$.pipe(takeUntil(this.destroy$)).subscribe((mobile) => {
      this.isMobile = mobile;
      if (!mobile) {
        this.mobileDetailOpen = false;
      }
    });
    void this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get selected(): AdminRole | null {
    return this.roles.find((role) => role.id === this.selectedId) ?? null;
  }

  get detailOpen(): boolean {
    return this.isMobile && this.mobileDetailOpen;
  }

  async reload(): Promise<void> {
    this.loadError = '';
    try {
      const [rolesPayload, permissionsPayload] = await Promise.all([
        this.api.client.listAdminRoles(),
        this.api.client.getPermissions(),
      ]);
      this.roles = rolesPayload.roles as unknown as AdminRole[];
      this.allPermissions = permissionsPayload.permissions;
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : 'Failed to load roles';
    }
  }

  selectRole(role: AdminRole): void {
    this.creating = false;
    this.selectedId = role.id;
    this.draftCode = role.code;
    this.draftName = role.name;
    this.draftPermissions = [...role.permissions];
    if (this.isMobile) {
      this.mobileDetailOpen = true;
    }
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId = null;
    this.draftCode = '';
    this.draftName = '';
    this.draftPermissions = ['*.read'];
    if (this.isMobile) {
      this.mobileDetailOpen = true;
    }
  }

  closeDetail(): void {
    this.mobileDetailOpen = false;
    this.creating = false;
    this.selectedId = null;
  }

  onPermissionsChange(permissions: string[]): void {
    this.draftPermissions = permissions;
  }

  async save(): Promise<void> {
    try {
      let savedId = this.selectedId;
      if (this.selected) {
        await this.api.client.updateAdminRole(this.selected.id, {
          name: this.draftName,
          permissions: this.draftPermissions,
        });
        savedId = this.selected.id;
      } else {
        const created = await this.api.client.createAdminRole({
          code: this.draftCode,
          name: this.draftName,
          permissions: this.draftPermissions,
        });
        savedId = String(created['id'] ?? '');
        this.creating = false;
      }
      await this.reload();
      if (savedId) {
        this.selectedId = savedId;
        const refreshed = this.roles.find((role) => role.id === savedId);
        if (refreshed) {
          this.selectRole(refreshed);
        }
      }
      if (this.isMobile) {
        this.mobileDetailOpen = true;
      }
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : 'Save failed';
    }
  }

  permissionSummary(role: AdminRole): string {
    if (role.permissions.length <= 3) {
      return role.permissions.join(', ');
    }
    return `${role.permissions.slice(0, 3).join(', ')} (+${role.permissions.length - 3})`;
  }
}
