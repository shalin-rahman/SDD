import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

import type { AbacPolicyRow, SecurityPolicyEntity } from '../../api/emcap-client';
import { EmcapApiService } from '../../services/emcap-api.service';
import { DetailPlaceholderComponent } from '../../shared/layout/detail-placeholder.component';
import { MasterDetailLayoutComponent } from '../../shared/layout/master-detail-layout.component';
import { PageHeaderComponent } from '../../shared/layout/page-header.component';
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
  ],
  templateUrl: './admin-security.component.html',
  styleUrl: './admin-security.component.scss',
})
export class AdminSecurityComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  readonly i18n = inject(I18nService);

  entities: SecurityPolicyEntity[] = [];
  rules: Record<string, string> = {};
  abacPolicies: AbacPolicyRow[] = [];
  selectedCode: string | null = null;
  loadError = '';
  abacError = '';
  abacSaved = false;
  canEditAbac = false;

  ngOnInit(): void {
    void this.reload();
    void this.loadAbac();
    void this.resolveEditAccess();
  }

  get selectedEntity(): SecurityPolicyEntity | null {
    return this.entities.find((entity) => entity.code === this.selectedCode) ?? null;
  }

  async resolveEditAccess(): Promise<void> {
    try {
      const me = await this.api.client.getMe();
      const permissions = extractUserPermissions(me);
      this.canEditAbac =
        hasPermission(permissions, 'admin.security.write') ||
        hasPermission(permissions, 'admin.*') ||
        hasPermission(permissions, '*.*');
    } catch {
      this.canEditAbac = false;
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
    this.abacPolicies = this.abacPolicies.filter((_, i) => i !== index);
  }

  async saveAbac(): Promise<void> {
    if (!this.canEditAbac) return;
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
  }

  fieldAccessLabel(access: string): string {
    return access === 'restricted'
      ? this.i18n.t('admin.security.accessRestricted')
      : this.i18n.t('admin.security.accessOpen');
  }
}
