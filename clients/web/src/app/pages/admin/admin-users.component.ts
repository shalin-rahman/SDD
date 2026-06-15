import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { EmcapApiService } from '../../services/emcap-api.service';
import { AdminFormPanelComponent } from '../../shared/admin/admin-form-panel.component';
import { EmptyStateComponent } from '../../shared/layout/empty-state.component';
import { AdminListToolbarComponent } from '../../shared/admin/admin-list-toolbar.component';
import { DetailPlaceholderComponent } from '../../shared/layout/detail-placeholder.component';
import { MasterDetailLayoutComponent } from '../../shared/layout/master-detail-layout.component';
import { PageHeaderComponent, type PageBreadcrumb } from '../../shared/layout/page-header.component';
import { LayoutService } from '../../shared/services/layout.service';
import { I18nService } from '../../shared/services/i18n.service';
import { formatRoleSummary } from '../../shared/utils/permission.util';

interface AdminUser {
  id: string;
  username: string;
  tenant_id: string;
  active: boolean;
  roles: Array<{ code: string; name: string }>;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    PageHeaderComponent,
    MasterDetailLayoutComponent,
    AdminListToolbarComponent,
    AdminFormPanelComponent,
    EmptyStateComponent,
    DetailPlaceholderComponent,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private readonly api = inject(EmcapApiService);
  private readonly layout = inject(LayoutService);
  readonly i18n = inject(I18nService);
  private readonly destroy$ = new Subject<void>();

  adminBreadcrumbs(): PageBreadcrumb[] {
    return [
      { label: this.i18n.t('shell.breadcrumb.admin') },
      { label: this.i18n.t('admin.users.title') },
    ];
  }

  users: AdminUser[] = [];
  roles: Array<{ id: string; code: string; name: string }> = [];
  loadError = '';
  selectedId: string | null = null;
  creating = false;
  mobileDetailOpen = false;
  isMobile = false;

  searchTerm = '';

  draftUsername = '';
  draftPassword = '';
  draftTenantId = 'default';
  draftRoleCodes: string[] = ['viewer'];
  draftActive = true;

  displayedColumns = ['username', 'tenant_id', 'roles', 'active'];
  readonly formatRoleSummary = formatRoleSummary;

  get filteredUsers(): AdminUser[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) {
      return this.users;
    }
    return this.users.filter(
      (user) =>
        user.username.toLowerCase().includes(q) ||
        user.tenant_id.toLowerCase().includes(q) ||
        formatRoleSummary(user.roles).toLowerCase().includes(q),
    );
  }

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

  get selected(): AdminUser | null {
    return this.users.find((user) => user.id === this.selectedId) ?? null;
  }

  get detailOpen(): boolean {
    return this.isMobile && this.mobileDetailOpen;
  }

  async reload(): Promise<void> {
    this.loadError = '';
    try {
      const [usersPayload, rolesPayload] = await Promise.all([
        this.api.client.listAdminUsers(),
        this.api.client.listAdminRoles(),
      ]);
      this.users = usersPayload.users as unknown as AdminUser[];
      this.roles = rolesPayload.roles as unknown as Array<{ id: string; code: string; name: string }>;
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : 'Failed to load users';
    }
  }

  selectUser(user: AdminUser): void {
    this.creating = false;
    this.selectedId = user.id;
    this.draftUsername = user.username;
    this.draftPassword = '';
    this.draftTenantId = user.tenant_id;
    this.draftRoleCodes = user.roles.map((role) => role.code);
    this.draftActive = user.active;
    if (this.isMobile) {
      this.mobileDetailOpen = true;
    }
  }

  startCreate(): void {
    this.creating = true;
    this.selectedId = null;
    this.draftUsername = '';
    this.draftPassword = '';
    this.draftTenantId = 'default';
    this.draftRoleCodes = ['viewer'];
    this.draftActive = true;
    if (this.isMobile) {
      this.mobileDetailOpen = true;
    }
  }

  closeDetail(): void {
    this.mobileDetailOpen = false;
    this.creating = false;
    this.selectedId = null;
  }

  async save(): Promise<void> {
    try {
      let savedId = this.selectedId;
      if (this.selected) {
        await this.api.client.updateAdminUser(this.selected.id, {
          tenant_id: this.draftTenantId,
          active: this.draftActive,
          role_codes: this.draftRoleCodes,
          password: this.draftPassword || undefined,
        });
        savedId = this.selected.id;
      } else {
        const created = await this.api.client.createAdminUser({
          username: this.draftUsername,
          password: this.draftPassword,
          tenant_id: this.draftTenantId,
          role_codes: this.draftRoleCodes,
        });
        savedId = String(created['id'] ?? '');
        this.creating = false;
      }
      await this.reload();
      if (savedId) {
        this.selectedId = savedId;
        const refreshed = this.users.find((user) => user.id === savedId);
        if (refreshed) {
          this.selectUser(refreshed);
        }
      }
      if (this.isMobile) {
        this.mobileDetailOpen = true;
      }
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : 'Save failed';
    }
  }

  async deactivateSelected(): Promise<void> {
    if (!this.selected) {
      return;
    }
    await this.api.client.deactivateAdminUser(this.selected.id);
    await this.reload();
    this.closeDetail();
  }
}
