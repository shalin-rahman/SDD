import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

import type { AbacPolicyRow, SecurityPolicyEntity } from '../../api/emcap-client';
import { EmcapApiService } from '../../services/emcap-api.service';
import { AdminFormPanelComponent } from '../../shared/admin/admin-form-panel.component';
import { PermissionPickerComponent } from '../../shared/admin/permission-picker.component';
import { DetailPlaceholderComponent } from '../../shared/layout/detail-placeholder.component';
import { MasterDetailLayoutComponent } from '../../shared/layout/master-detail-layout.component';
import { PageHeaderComponent, type PageBreadcrumb } from '../../shared/layout/page-header.component';
import { I18nService } from '../../shared/services/i18n.service';
import { hasPermission } from '../../services/shell-nav.util';
import { extractUserPermissions } from '../../shared/utils/tenant.util';

@Component({
  selector: 'app-admin-security',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    PageHeaderComponent,
    MasterDetailLayoutComponent,
    DetailPlaceholderComponent,
    AdminFormPanelComponent,
    PermissionPickerComponent,
  ],
  templateUrl: './admin-security.component.html',
  styleUrl: './admin-security.component.scss',
})
export class AdminSecurityComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  readonly i18n = inject(I18nService);

  adminBreadcrumbs(): PageBreadcrumb[] {
    return [
      { label: this.i18n.t('shell.breadcrumb.admin') },
      { label: this.i18n.t('admin.security.title') },
    ];
  }

  entities: SecurityPolicyEntity[] = [];
  rules: Record<string, string> = {};
  abacPolicies: AbacPolicyRow[] = [];
  allPermissions: string[] = [];
  selectedCode: string | null = null;
  loadError = '';
  abacError = '';
  abacSaved = false;
  canEditSecurity = false;

  editingFieldName: string | null = null;
  draftReadRoles: string[] = [];
  fieldSaveError = '';
  fieldAccessSaved = false;

  abacFieldErrors: Record<number, { permission?: string }> = {};

  abacTestPermission = '';
  abacTestAllowed: boolean | null = null;
  abacTestError = '';

  ngOnInit(): void {
    void this.reload();
    void this.loadAbac();
    void this.loadPermissions();
    void this.resolveEditAccess();
  }

  get selectedEntity(): SecurityPolicyEntity | null {
    return this.entities.find((entity) => entity.code === this.selectedCode) ?? null;
  }

  get fieldEditOpen(): boolean {
    return this.editingFieldName !== null;
  }

  async resolveEditAccess(): Promise<void> {
    try {
      const me = await this.api.client.getMe();
      const permissions = extractUserPermissions(me);
      this.canEditSecurity =
        hasPermission(permissions, 'admin.security.write') ||
        hasPermission(permissions, 'admin.*') ||
        hasPermission(permissions, '*.*');
    } catch {
      this.canEditSecurity = false;
    }
  }

  async loadPermissions(): Promise<void> {
    try {
      const payload = await this.api.client.getPermissions();
      this.allPermissions = payload.permissions;
    } catch {
      this.allPermissions = [];
    }
  }

  async reload(): Promise<void> {
    this.loadError = '';
    try {
      const payload = await this.api.client.getAdminSecurityPolicies();
      this.entities = payload.entities;
      this.rules = payload.rules;
      if (this.entities.length && !this.selectedCode) {
        this.selectedCode = this.entities[0]?.code ?? null;
      }
      this.syncEditingField();
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : 'Failed to load security policies';
    }
  }

  async loadAbac(): Promise<void> {
    this.abacError = '';
    try {
      const payload = await this.api.client.getAdminAbacPolicies();
      this.abacPolicies = payload.policies.map((policy) => ({ ...policy }));
    } catch (err) {
      this.abacError = err instanceof Error ? err.message : 'Failed to load ABAC policies';
    }
  }

  addAbacPolicy(): void {
    this.abacSaved = false;
    this.abacPolicies = [
      ...this.abacPolicies,
      {
        permission: '',
        effect: 'allow',
        attribute: 'tenant_id',
        operator: 'equals',
        value: '$user.tenant_id',
      },
    ];
  }

  removeAbacPolicy(index: number): void {
    if (!window.confirm(this.i18n.t('admin.security.abacDeleteConfirm'))) {
      return;
    }
    this.abacSaved = false;
    this.abacPolicies = this.abacPolicies.filter((_, i) => i !== index);
    this.abacFieldErrors = this.reindexAbacErrors(this.abacFieldErrors, index);
  }

  onAbacPermissionChange(index: number): void {
    if (this.abacFieldErrors[index]?.permission) {
      const next = { ...this.abacFieldErrors[index] };
      delete next.permission;
      if (Object.keys(next).length === 0) {
        const copy = { ...this.abacFieldErrors };
        delete copy[index];
        this.abacFieldErrors = copy;
      } else {
        this.abacFieldErrors = { ...this.abacFieldErrors, [index]: next };
      }
    }
  }

  validateAbac(): boolean {
    this.abacFieldErrors = {};
    let valid = true;
    this.abacPolicies.forEach((policy, index) => {
      if (!policy.permission.trim()) {
        this.abacFieldErrors[index] = {
          permission: this.i18n.t('admin.security.validation.permissionRequired'),
        };
        valid = false;
      }
    });
    return valid;
  }

  async saveAbac(): Promise<void> {
    if (!this.canEditSecurity) return;
    if (!this.validateAbac()) {
      return;
    }
    this.abacError = '';
    this.abacSaved = false;
    try {
      const payload = await this.api.client.updateAdminAbacPolicies(this.abacPolicies);
      this.abacPolicies = payload.policies;
      this.abacSaved = true;
    } catch (err) {
      this.abacError = err instanceof Error ? err.message : 'Failed to save ABAC policies';
    }
  }

  selectEntity(code: string): void {
    this.selectedCode = code;
    this.closeFieldEdit();
  }

  openFieldEdit(fieldName: string, readRoles: string[]): void {
    if (!this.canEditSecurity) return;
    this.editingFieldName = fieldName;
    this.draftReadRoles = [...readRoles];
    this.fieldSaveError = '';
    this.fieldAccessSaved = false;
  }

  closeFieldEdit(): void {
    this.editingFieldName = null;
    this.draftReadRoles = [];
    this.fieldSaveError = '';
    this.fieldAccessSaved = false;
  }

  onFieldPermissionsChange(permissions: string[]): void {
    this.draftReadRoles = permissions;
    this.fieldAccessSaved = false;
  }

  async saveFieldAccess(): Promise<void> {
    if (!this.canEditSecurity || !this.selectedEntity || !this.editingFieldName) {
      return;
    }
    this.fieldSaveError = '';
    this.fieldAccessSaved = false;
    try {
      await this.api.client.updateAdminFieldAccess({
        entity_code: this.selectedEntity.code,
        field_name: this.editingFieldName,
        read_roles: this.draftReadRoles,
      });
      await this.reload();
      this.fieldAccessSaved = true;
      this.closeFieldEdit();
    } catch (err) {
      this.fieldSaveError =
        err instanceof Error ? err.message : this.i18n.t('admin.security.fieldAccessSaveFailed');
    }
  }

  fieldAccessLabel(access: string): string {
    return access === 'restricted'
      ? this.i18n.t('admin.security.accessRestricted')
      : this.i18n.t('admin.security.accessOpen');
  }

  async testAbacPermission(): Promise<void> {
    const permission = this.abacTestPermission.trim();
    if (!permission) {
      return;
    }
    this.abacTestError = '';
    this.abacTestAllowed = null;
    try {
      const result = await this.api.client.checkAuth(permission);
      this.abacTestAllowed = result.allowed;
    } catch (err) {
      this.abacTestError =
        err instanceof Error ? err.message : this.i18n.t('admin.security.abacTestFailed');
    }
  }

  private syncEditingField(): void {
    if (!this.editingFieldName || !this.selectedEntity) {
      return;
    }
    const field = this.selectedEntity.fields.find((item) => item.name === this.editingFieldName);
    if (!field) {
      this.closeFieldEdit();
      return;
    }
    this.draftReadRoles = [...field.read_roles];
  }

  private reindexAbacErrors(
    errors: Record<number, { permission?: string }>,
    removedIndex: number,
  ): Record<number, { permission?: string }> {
    const next: Record<number, { permission?: string }> = {};
    for (const [key, value] of Object.entries(errors)) {
      const index = Number(key);
      if (index < removedIndex) {
        next[index] = value;
      } else if (index > removedIndex) {
        next[index - 1] = value;
      }
    }
    return next;
  }
}
