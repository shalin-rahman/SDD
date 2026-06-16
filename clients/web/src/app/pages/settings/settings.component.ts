import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';

import { EmcapApiService } from '../../services/emcap-api.service';
import {
  SettingsToggleGroupComponent,
  type SettingsToggleItem,
} from '../../shared/admin/settings-toggle-group.component';
import { AdminFormPanelComponent } from '../../shared/admin/admin-form-panel.component';
import { BrandingPreviewPanelComponent } from '../../shared/admin/branding-preview-panel.component';
import { LayoutEditorPanelComponent } from '../../shared/admin/layout-editor-panel.component';
import { DetailPlaceholderComponent } from '../../shared/layout/detail-placeholder.component';
import { EmptyStateComponent } from '../../shared/layout/empty-state.component';
import { MasterDetailLayoutComponent } from '../../shared/layout/master-detail-layout.component';
import { PageHeaderComponent } from '../../shared/layout/page-header.component';
import { ShellContextService } from '../../shared/services/shell-context.service';
import { ThemeService } from '../../shared/services/theme.service';
import { I18nService } from '../../shared/services/i18n.service';
import {
  parseDocumentPlatformSettings,
  mergeDocumentSettings,
  buildDocumentSettingsPayload,
  type DocumentPlatformSettings,
} from '../../shared/utils/document-platform-settings.util';
import type { ReportScheduleSummary } from '../../api/emcap-client';
import {
  parseSecurityPlatformSettings,
  type SecurityPlatformSettings,
} from '../../shared/utils/security-platform-settings.util';
import {
  formatContrastRatio,
  hasAdequatePrimaryContrast,
  isBrandingPathEditable,
  parseTenantBranding,
  previewPrimaryColor,
  primaryOnWhiteContrast,
} from '../../shared/utils/branding.util';

interface EmailTemplate {
  id: string;
  code: string;
  channel: string;
  subject: string;
  body: string;
}

interface IntegrationRegistryEntry {
  id: string;
  labelKey: string;
  status: 'configured' | 'partial' | 'not_configured';
  detail: string;
}

const TEMPLATE_VARIABLES = ['{{name}}', '{{tenant}}', '{{code}}', '{{date}}'] as const;

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatExpansionModule,
    MatTabsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    PageHeaderComponent,
    SettingsToggleGroupComponent,
    MasterDetailLayoutComponent,
    AdminFormPanelComponent,
    DetailPlaceholderComponent,
    EmptyStateComponent,
    BrandingPreviewPanelComponent,
    LayoutEditorPanelComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  private readonly shellContext = inject(ShellContextService);
  private readonly theme = inject(ThemeService);
  readonly i18n = inject(I18nService);

  settings: Record<string, unknown> = {};
  editablePaths: string[] = [];
  overridePaths: string[] = [];
  integrationOverridePaths: string[] = [];
  templates: EmailTemplate[] = [];
  audit: Record<string, unknown>[] = [];
  loadError = '';
  status = '';
  reloadHint = '';
  moduleEffectiveSummary = '';
  tenantStrategy = '';
  multiTenant = false;
  isolationConfigured = '';
  isolationEffective = '';
  isolationHasOverride = false;
  isolationReloadHint = '';
  isolationOpsAvailable = false;
  isolationModeDraft = 'shared_database';
  isolationConfirmToken = '';
  isolationOpsStatus = '';
  readonly isolationModes = [
    'shared_database',
    'database_per_tenant',
    'schema_per_tenant',
    'hybrid',
  ] as const;

  isolationModeLabel(mode: string): string {
    const key = `settings.isolation.modes.${mode}`;
    const label = this.i18n.t(key);
    return label === key ? mode : label;
  }

  selectedTemplateId: string | null = null;
  creatingTemplate = false;
  templateCode = '';
  templateChannel = 'email';
  templateSubject = '';
  templateBody = '';
  readonly templateVariables = TEMPLATE_VARIABLES;
  tenantTheme = 'default';
  tenantDomain = 'localhost';
  tenantPrimaryColor = '';
  tenantLogoUrl = '';
  brandingPrimaryFallback = '';
  paymentProvider = 'stripe';
  paymentPublishableKey = '';
  paymentSecretDraft = '';
  paymentSecretConfigured = false;
  readonly paymentProviders = ['stripe', 'paypal', 'manual'] as const;
  integrations: Record<string, unknown> = {};
  restBaseUrl = '';
  kafkaBootstrap = '';
  kafkaTopicPrefix = '';
  soapEndpoint = '';
  webhookSecretDraft = '';
  webhookSecretConfigured = false;
  integrationTestStatus = '';
  documentSettings: DocumentPlatformSettings = parseDocumentPlatformSettings({});
  securitySettings: SecurityPlatformSettings = parseSecurityPlatformSettings({});
  reportSchedules: ReportScheduleSummary[] = [];
  reportScheduleStatus = '';
  readonly documentStorageBackends = ['filesystem', 's3'] as const;

  ngOnInit(): void {
    void this.reload();
  }

  get selectedTemplate(): EmailTemplate | null {
    return this.templates.find((template) => template.id === this.selectedTemplateId) ?? null;
  }

  async reload(): Promise<void> {
    this.loadError = '';
    try {
      const [settingsPayload, integrationsPayload, templatesPayload, auditPayload, health, platformConfig, schedulesPayload] =
        await Promise.all([
        this.api.client.getAdminSettings(),
        this.api.client.getAdminIntegrations(),
        this.api.client.listAdminTemplates(),
        this.api.client.getAdminAudit(),
        this.api.client.getHealth(),
        this.api.client.getPlatformConfig(),
        this.api.client.getAdminReportSchedules(),
      ]);
      this.settings = settingsPayload.settings;
      this.editablePaths = settingsPayload.editable_paths ?? [];
      this.overridePaths = settingsPayload.override_paths ?? [];
      this.integrations = integrationsPayload.integrations;
      this.integrationOverridePaths = integrationsPayload.override_paths ?? [];
      this.templates = templatesPayload.templates as unknown as EmailTemplate[];
      this.audit = auditPayload.audit;
      this.tenantStrategy = health.tenant_strategy;
      this.multiTenant = health.multi_tenant;
      this.documentSettings = mergeDocumentSettings(
        parseDocumentPlatformSettings(platformConfig),
        settingsPayload.settings,
      );
      this.securitySettings = parseSecurityPlatformSettings(platformConfig);
      this.reportSchedules = schedulesPayload.schedules;
      const branding = parseTenantBranding(this.settings, platformConfig);
      this.tenantTheme = branding.theme;
      this.tenantDomain = branding.domain;
      this.tenantPrimaryColor = branding.primaryColor;
      this.tenantLogoUrl = branding.logoUrl;
      this.brandingPrimaryFallback = branding.primaryColor;
      this.syncPaymentFields();
      this.syncIntegrationFields();
      this.refreshModuleEffectiveSummary();
      await this.loadIsolationOps();
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : this.i18n.t('settings.loadFailed');
    }
  }

  templateChannelBar(): { channel: string; label: string; enabled: boolean }[] {
    return [
      {
        channel: 'email',
        label: this.i18n.t('settings.channels.email'),
        enabled: this.bool('notifications', 'email'),
      },
      {
        channel: 'sms',
        label: this.i18n.t('settings.channels.sms'),
        enabled: this.smsChannelEnabled(),
      },
      {
        channel: 'push',
        label: this.i18n.t('settings.channels.push'),
        enabled: this.pushChannelEnabled(),
      },
    ];
  }

  channelBarStateLabel(enabled: boolean): string {
    return enabled ? this.i18n.t('settings.channels.enabled') : this.i18n.t('settings.channels.disabled');
  }

  moduleItems(): SettingsToggleItem[] {
    return [
      {
        key: 'workflow',
        label: this.i18n.t('settings.modules.workflow'),
        checked: this.flag('modules', 'workflow', 'enabled'),
        custom: this.isCustom('modules.workflow.enabled'),
      },
      {
        key: 'payments',
        label: this.i18n.t('settings.modules.payments'),
        checked: this.flag('modules', 'payments', 'enabled'),
        custom: this.isCustom('modules.payments.enabled'),
      },
      {
        key: 'notifications',
        label: this.i18n.t('settings.modules.notifications'),
        checked: this.flag('modules', 'notifications', 'enabled'),
        custom: this.isCustom('modules.notifications.enabled'),
      },
      {
        key: 'ai',
        label: this.i18n.t('settings.modules.ai'),
        checked: this.flag('modules', 'ai', 'enabled'),
        custom: this.isCustom('modules.ai.enabled'),
      },
    ];
  }

  authItems(): SettingsToggleItem[] {
    return [
      {
        key: 'username_password',
        label: this.i18n.t('settings.auth.usernamePassword'),
        checked: this.bool('authentication', 'username_password'),
        custom: this.isCustom('authentication.username_password'),
      },
      {
        key: 'oauth',
        label: this.i18n.t('settings.auth.oauth'),
        checked: this.bool('authentication', 'oauth'),
        custom: this.isCustom('authentication.oauth'),
      },
      {
        key: 'ldap',
        label: this.i18n.t('settings.auth.ldap'),
        checked: this.bool('authentication', 'ldap'),
        custom: this.isCustom('authentication.ldap'),
      },
      {
        key: 'sso',
        label: this.i18n.t('settings.auth.sso'),
        checked: this.bool('authentication', 'sso'),
        custom: this.isCustom('authentication.sso'),
      },
    ];
  }

  notificationItems(): SettingsToggleItem[] {
    return [
      {
        key: 'email',
        label: this.i18n.t('settings.channels.email'),
        checked: this.bool('notifications', 'email'),
        custom: this.isCustom('notifications.email'),
      },
      {
        key: 'sms',
        label: this.i18n.t('settings.channels.sms'),
        checked: this.bool('notifications', 'sms'),
        custom: this.isCustom('notifications.sms'),
      },
      {
        key: 'push',
        label: this.i18n.t('settings.channels.push'),
        checked: this.bool('notifications', 'push'),
        custom: this.isCustom('notifications.push'),
      },
      {
        key: 'whatsapp',
        label: this.i18n.t('settings.channels.whatsapp'),
        checked: this.bool('notifications', 'whatsapp'),
        custom: this.isCustom('notifications.whatsapp'),
      },
    ];
  }

  gridItems(): SettingsToggleItem[] {
    return [
      {
        key: 'export_csv',
        label: this.i18n.t('settings.grid.exportCsv'),
        checked: this.bool('grid', 'export_csv'),
        custom: this.isCustom('grid.export_csv'),
      },
      {
        key: 'export_excel',
        label: this.i18n.t('settings.grid.exportExcel'),
        checked: this.bool('grid', 'export_excel'),
        custom: this.isCustom('grid.export_excel'),
      },
      {
        key: 'export_pdf',
        label: this.i18n.t('settings.grid.exportPdf'),
        checked: this.bool('grid', 'export_pdf'),
        custom: this.isCustom('grid.export_pdf'),
      },
      {
        key: 'grouping',
        label: this.i18n.t('settings.grid.grouping'),
        checked: this.bool('grid', 'grouping'),
        custom: this.isCustom('grid.grouping'),
      },
      {
        key: 'realtime',
        label: this.i18n.t('settings.grid.realtime'),
        checked: this.bool('grid', 'realtime'),
        custom: this.isCustom('grid.realtime'),
      },
      {
        key: 'offline',
        label: this.i18n.t('settings.grid.offline'),
        checked: this.bool('grid', 'offline'),
        custom: this.isCustom('grid.offline'),
      },
    ];
  }

  workflowItems(): SettingsToggleItem[] {
    return [
      {
        key: 'enabled',
        label: this.i18n.t('settings.workflow.engine'),
        checked: this.bool('workflow', 'enabled'),
        custom: this.isCustom('workflow.enabled'),
      },
      {
        key: 'escalation',
        label: this.i18n.t('settings.workflow.escalation'),
        checked: this.bool('workflow', 'escalation'),
        custom: this.isCustom('workflow.escalation'),
      },
      {
        key: 'delegation',
        label: this.i18n.t('settings.workflow.delegation'),
        checked: this.bool('workflow', 'delegation'),
        custom: this.isCustom('workflow.delegation'),
      },
      {
        key: 'sla_tracking',
        label: this.i18n.t('settings.workflow.slaTracking'),
        checked: this.bool('workflow', 'sla_tracking'),
        custom: this.isCustom('workflow.sla_tracking'),
      },
    ];
  }

  rulesItems(): SettingsToggleItem[] {
    return [
      {
        key: 'formula_enabled',
        label: this.i18n.t('settings.rules.formula'),
        checked: this.bool('rules', 'formula_enabled'),
        custom: this.isCustom('rules.formula_enabled'),
      },
      {
        key: 'scripting_enabled',
        label: this.i18n.t('settings.rules.scripting'),
        checked: this.bool('rules', 'scripting_enabled'),
        custom: this.isCustom('rules.scripting_enabled'),
      },
    ];
  }

  paymentItems(): SettingsToggleItem[] {
    return [
      {
        key: 'enabled',
        label: this.i18n.t('settings.payments.enabled'),
        checked: this.bool('payments', 'enabled'),
        custom: this.isCustom('payments.enabled'),
      },
    ];
  }

  paymentsModuleEnabled(): boolean {
    return this.flag('modules', 'payments', 'enabled');
  }

  paymentCredentialsEnabled(): boolean {
    return this.paymentsModuleEnabled() && this.bool('payments', 'enabled');
  }

  aiItems(): SettingsToggleItem[] {
    return [
      {
        key: 'enabled',
        label: this.i18n.t('settings.ai.enabled'),
        checked: this.bool('ai', 'enabled'),
        custom: this.isCustom('ai.enabled'),
      },
    ];
  }

  auditItems(): SettingsToggleItem[] {
    return [
      {
        key: 'enabled',
        label: this.i18n.t('settings.audit.enabled'),
        checked: this.bool('audit', 'enabled'),
        custom: this.isCustom('audit.enabled'),
      },
      {
        key: 'immutable',
        label: this.i18n.t('settings.audit.immutable'),
        checked: this.bool('audit', 'immutable'),
        custom: this.isCustom('audit.immutable'),
      },
    ];
  }

  integrationRegistry(): IntegrationRegistryEntry[] {
    const restConfigured = this.restBaseUrl.trim().length > 0;
    const kafkaConfigured =
      this.kafkaBootstrap.trim().length > 0 && this.kafkaTopicPrefix.trim().length > 0;
    const kafkaPartial =
      (this.kafkaBootstrap.trim().length > 0) !== (this.kafkaTopicPrefix.trim().length > 0);
    const soapConfigured = this.soapEndpoint.trim().length > 0;
    return [
      {
        id: 'rest',
        labelKey: 'settings.integrations.registry.rest',
        status: restConfigured ? 'configured' : 'not_configured',
        detail: restConfigured ? this.restBaseUrl : this.i18n.t('settings.integrations.registry.notSet'),
      },
      {
        id: 'kafka',
        labelKey: 'settings.integrations.registry.kafka',
        status: kafkaConfigured ? 'configured' : kafkaPartial ? 'partial' : 'not_configured',
        detail: kafkaConfigured
          ? `${this.kafkaBootstrap} · ${this.kafkaTopicPrefix}`
          : this.i18n.t('settings.integrations.registry.notSet'),
      },
      {
        id: 'soap',
        labelKey: 'settings.integrations.registry.soap',
        status: soapConfigured ? 'configured' : 'not_configured',
        detail: soapConfigured ? this.soapEndpoint : this.i18n.t('settings.integrations.registry.notSet'),
      },
      {
        id: 'webhook',
        labelKey: 'settings.integrations.registry.webhook',
        status: this.webhookSecretConfigured ? 'configured' : 'not_configured',
        detail: this.webhookSecretConfigured
          ? this.i18n.t('settings.integrations.registry.secretConfigured')
          : this.i18n.t('settings.integrations.registry.notSet'),
      },
    ];
  }

  integrationStatusLabel(status: IntegrationRegistryEntry['status']): string {
    if (status === 'configured') {
      return this.i18n.t('settings.integrations.registry.statusConfigured');
    }
    if (status === 'partial') {
      return this.i18n.t('settings.integrations.registry.statusPartial');
    }
    return this.i18n.t('settings.integrations.registry.statusNotConfigured');
  }

  selectPaymentProvider(provider: (typeof this.paymentProviders)[number]): void {
    if (!this.paymentCredentialsEnabled()) {
      return;
    }
    this.paymentProvider = provider;
  }

  paymentProviderSelected(provider: string): boolean {
    return this.paymentProvider === provider;
  }

  paymentProviderLabel(provider: string): string {
    const key = `settings.payments.providers.${provider}`;
    const label = this.i18n.t(key);
    return label === key ? provider : label;
  }

  documentStorageBackendLabel(backend: string): string {
    const key = `settings.documents.backends.${backend}`;
    const label = this.i18n.t(key);
    return label === key ? backend : label;
  }

  insertTemplateVariable(variable: string): void {
    this.templateBody = `${this.templateBody}${variable}`;
  }

  smsChannelEnabled(): boolean {
    return this.bool('notifications', 'sms');
  }

  pushChannelEnabled(): boolean {
    return this.bool('notifications', 'push');
  }

  private isCustom(path: string): boolean {
    return this.overridePaths.includes(path);
  }

  private refreshModuleEffectiveSummary(): void {
    const enabled = this.moduleItems()
      .filter((item) => item.checked)
      .map((item) => item.label);
    this.moduleEffectiveSummary =
      enabled.length > 0
        ? `${this.i18n.t('settings.modules.effectivePrefix')} ${enabled.join(', ')}`
        : this.i18n.t('settings.modules.effectiveNone');
  }

  virusScanLabel(): string {
    return this.documentSettings.virusScanEnabled
      ? this.i18n.t('settings.documents.enabled')
      : this.i18n.t('settings.documents.disabled');
  }

  securityHeadersLabel(): string {
    return this.securitySettings.securityHeadersEnabled
      ? this.i18n.t('settings.security.headersEnabled')
      : this.i18n.t('settings.security.headersDisabled');
  }

  brandingPrimaryEditable(): boolean {
    return isBrandingPathEditable(this.editablePaths, 'tenants.default.primary_color');
  }

  brandingLogoEditable(): boolean {
    return isBrandingPathEditable(this.editablePaths, 'tenants.default.logo_url');
  }

  brandingPreviewPrimary(): string {
    return previewPrimaryColor(this.tenantPrimaryColor, this.brandingPrimaryFallback);
  }

  brandingReadOnly(): boolean {
    return !this.brandingPrimaryEditable() && !this.brandingLogoEditable();
  }

  brandingContrastAdequate(): boolean {
    return hasAdequatePrimaryContrast(this.brandingPreviewPrimary());
  }

  brandingContrastRatioLabel(): string {
    return formatContrastRatio(primaryOnWhiteContrast(this.brandingPreviewPrimary()));
  }

  brandingContrastHint(): string {
    const ratio = `${this.brandingContrastRatioLabel()}:1`;
    return this.brandingContrastAdequate()
      ? `${this.i18n.t('settings.branding.contrastOk')} (${ratio})`
      : `${this.i18n.t('settings.branding.contrastWarning')} (${ratio})`;
  }

  onModuleChange(event: { key: string; checked: boolean }): void {
    this.setFlag('modules', event.key, 'enabled', event.checked);
  }

  onAuthChange(event: { key: string; checked: boolean }): void {
    this.setBool('authentication', event.key, event.checked);
  }

  onNotificationChange(event: { key: string; checked: boolean }): void {
    this.setBool('notifications', event.key, event.checked);
  }

  onGridChange(event: { key: string; checked: boolean }): void {
    this.setBool('grid', event.key, event.checked);
  }

  onWorkflowChange(event: { key: string; checked: boolean }): void {
    this.setBool('workflow', event.key, event.checked);
  }

  onRulesChange(event: { key: string; checked: boolean }): void {
    this.setBool('rules', event.key, event.checked);
  }

  onPaymentChange(event: { key: string; checked: boolean }): void {
    this.setBool('payments', event.key, event.checked);
  }

  onAiChange(event: { key: string; checked: boolean }): void {
    this.setBool('ai', event.key, event.checked);
  }

  onAuditChange(event: { key: string; checked: boolean }): void {
    this.setBool('audit', event.key, event.checked);
  }

  selectTemplate(template: EmailTemplate): void {
    this.creatingTemplate = false;
    this.selectedTemplateId = template.id;
    this.templateCode = template.code;
    this.templateChannel = template.channel;
    this.templateSubject = template.subject;
    this.templateBody = template.body;
  }

  startCreateTemplate(): void {
    this.creatingTemplate = true;
    this.selectedTemplateId = null;
    this.templateCode = '';
    this.templateChannel = 'email';
    this.templateSubject = '';
    this.templateBody = '';
  }

  applyBranding(): void {
    const tenants = (this.settings['tenants'] as Record<string, Record<string, string>>) ?? {};
    const next: Record<string, string> = {
      ...(tenants.default ?? {}),
      theme: this.tenantTheme,
      domain: this.tenantDomain,
    };
    if (this.brandingPrimaryEditable()) {
      next['primary_color'] = this.brandingPreviewPrimary();
    }
    if (this.brandingLogoEditable()) {
      next['logo_url'] = this.tenantLogoUrl.trim();
    }
    tenants.default = next;
    this.settings = { ...this.settings, tenants };
  }

  applyPaymentCredentials(): void {
    const payments = (this.settings['payments'] as Record<string, unknown>) ?? {};
    const stripe = (payments['stripe'] as Record<string, unknown>) ?? {};
    payments['provider'] = this.paymentProvider;
    stripe['publishable_key'] = this.paymentPublishableKey;
    if (this.paymentSecretDraft.trim()) {
      stripe['secret_key'] = this.paymentSecretDraft.trim();
    } else {
      delete stripe['secret_key'];
    }
    payments['stripe'] = stripe;
    this.settings = { ...this.settings, payments };
  }

  private syncIntegrationFields(): void {
    const rest = this.integrations['rest'] as Record<string, unknown> | undefined;
    const kafka = this.integrations['kafka'] as Record<string, unknown> | undefined;
    const soap = this.integrations['soap'] as Record<string, unknown> | undefined;
    const webhook = this.integrations['webhook'] as Record<string, unknown> | undefined;
    this.restBaseUrl = (rest?.['base_url'] as string) ?? '';
    this.kafkaBootstrap = (kafka?.['bootstrap'] as string) ?? '';
    this.kafkaTopicPrefix = (kafka?.['topic_prefix'] as string) ?? '';
    this.soapEndpoint = (soap?.['endpoint'] as string) ?? '';
    const secretView = webhook?.['signing_secret'] as { configured?: boolean } | string | undefined;
    this.webhookSecretConfigured =
      typeof secretView === 'object' && secretView !== null && secretView.configured === true;
    this.webhookSecretDraft = '';
    this.integrationTestStatus = '';
  }

  applyIntegrationFields(): void {
    const rest = (this.integrations['rest'] as Record<string, unknown>) ?? {};
    const kafka = (this.integrations['kafka'] as Record<string, unknown>) ?? {};
    const soap = (this.integrations['soap'] as Record<string, unknown>) ?? {};
    const webhook = (this.integrations['webhook'] as Record<string, unknown>) ?? {};
    rest['base_url'] = this.restBaseUrl;
    kafka['bootstrap'] = this.kafkaBootstrap;
    kafka['topic_prefix'] = this.kafkaTopicPrefix;
    soap['endpoint'] = this.soapEndpoint;
    if (this.webhookSecretDraft.trim()) {
      webhook['signing_secret'] = this.webhookSecretDraft.trim();
    } else {
      delete webhook['signing_secret'];
    }
    this.integrations = {
      ...this.integrations,
      rest,
      kafka,
      soap,
      webhook,
    };
  }

  async testRestIntegration(): Promise<void> {
    this.integrationTestStatus = '';
    try {
      const result = await this.api.client.testAdminRestIntegration();
      this.integrationTestStatus = `${this.i18n.t('settings.integrations.testOk')} (${result['job_id']})`;
    } catch (err) {
      this.integrationTestStatus =
        err instanceof Error ? err.message : this.i18n.t('settings.integrations.testFailed');
    }
  }

  private syncPaymentFields(): void {
    const payments = this.settings['payments'] as Record<string, unknown> | undefined;
    this.paymentProvider = (payments?.['provider'] as string) ?? 'stripe';
    const stripe = payments?.['stripe'] as Record<string, unknown> | undefined;
    this.paymentPublishableKey = (stripe?.['publishable_key'] as string) ?? '';
    const secretView = stripe?.['secret_key'] as { configured?: boolean } | string | undefined;
    this.paymentSecretConfigured =
      typeof secretView === 'object' && secretView !== null && secretView.configured === true;
    this.paymentSecretDraft = '';
  }

  async saveReportSchedule(row: ReportScheduleSummary): Promise<void> {
    this.reportScheduleStatus = '';
    try {
      const updated = await this.api.client.updateAdminReportSchedule(
        row.code,
        row.schedule_cron ?? '',
      );
      const index = this.reportSchedules.findIndex((item) => item.code === updated.code);
      if (index >= 0) {
        this.reportSchedules = [
          ...this.reportSchedules.slice(0, index),
          updated,
          ...this.reportSchedules.slice(index + 1),
        ];
      }
      this.reportScheduleStatus = this.i18n.t('settings.reports.scheduleSaved');
    } catch (err) {
      this.reportScheduleStatus =
        err instanceof Error ? err.message : this.i18n.t('settings.reports.scheduleSaveFailed');
    }
  }

  private applyDocumentFields(): void {
    this.settings = {
      ...this.settings,
      documents: buildDocumentSettingsPayload(this.documentSettings),
    };
  }

  async saveSettings(): Promise<void> {
    this.applyBranding();
    this.applyPaymentCredentials();
    this.applyIntegrationFields();
    this.applyDocumentFields();
    this.status = '';
    this.reloadHint = '';
    try {
      const [settingsPayload, integrationsPayload] = await Promise.all([
        this.api.client.updateAdminSettings(this.settings),
        this.api.client.updateAdminIntegrations(this.integrations),
      ]);
      this.settings = settingsPayload.settings;
      this.overridePaths = settingsPayload.override_paths ?? [];
      this.integrations = integrationsPayload.integrations;
      this.integrationOverridePaths = integrationsPayload.override_paths ?? [];
      this.syncPaymentFields();
      this.syncIntegrationFields();
      this.documentSettings = mergeDocumentSettings(this.documentSettings, settingsPayload.settings);
      this.status = this.i18n.t('settings.saved');
      this.reloadHint = this.i18n.t('settings.reloadHint');
      this.refreshModuleEffectiveSummary();
      if (this.brandingPrimaryEditable()) {
        this.theme.applyTenantPrimary(this.brandingPreviewPrimary());
      }
      await this.shellContext.load();
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : this.i18n.t('settings.saveFailed');
    }
  }

  async saveTemplate(): Promise<void> {
    try {
      if (this.selectedTemplate) {
        await this.api.client.updateAdminTemplate(this.selectedTemplate.id, {
          channel: this.templateChannel,
          subject: this.templateSubject,
          body: this.templateBody,
        });
      } else {
        await this.api.client.createAdminTemplate({
          code: this.templateCode,
          channel: this.templateChannel,
          subject: this.templateSubject,
          body: this.templateBody,
        });
      }
      await this.reload();
      this.startCreateTemplate();
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : this.i18n.t('settings.templates.saveFailed');
    }
  }

  async deleteTemplate(): Promise<void> {
    if (!this.selectedTemplate) {
      return;
    }
    await this.api.client.deleteAdminTemplate(this.selectedTemplate.id);
    await this.reload();
    this.startCreateTemplate();
  }

  async loadIsolationOps(): Promise<void> {
    try {
      const state = await this.api.client.getTenantIsolationOps();
      this.isolationOpsAvailable = true;
      this.isolationConfigured = state.configured_mode;
      this.isolationEffective = state.effective_mode;
      this.isolationHasOverride = state.has_override;
      this.isolationReloadHint = state.reload_hint;
      this.isolationModeDraft = state.effective_mode;
    } catch {
      this.isolationOpsAvailable = false;
      this.isolationConfigured = this.tenantStrategy;
      this.isolationEffective = this.tenantStrategy;
    }
  }

  async applyIsolationMode(): Promise<void> {
    this.isolationOpsStatus = '';
    try {
      const result = await this.api.client.putTenantIsolationOps({
        mode: this.isolationModeDraft,
        confirmation_token: this.isolationConfirmToken,
      });
      this.isolationOpsStatus = result.reload_hint;
      this.isolationConfirmToken = '';
      await this.loadIsolationOps();
      const health = await this.api.client.getHealth();
      this.tenantStrategy = health.tenant_strategy;
    } catch (err) {
      this.isolationOpsStatus = err instanceof Error ? err.message : this.i18n.t('settings.isolation.applyFailed');
    }
  }

  private bool(section: string, key: string): boolean {
    const value = this.settings[section] as Record<string, boolean> | undefined;
    return value?.[key] === true;
  }

  private flag(section: string, key: string, field: string): boolean {
    const value = this.settings[section] as Record<string, Record<string, boolean>> | undefined;
    return value?.[key]?.[field] === true;
  }

  private setBool(section: string, key: string, checked: boolean): void {
    const current = (this.settings[section] as Record<string, boolean>) ?? {};
    this.settings = { ...this.settings, [section]: { ...current, [key]: checked } };
  }

  private setFlag(section: string, key: string, field: string, checked: boolean): void {
    const current = (this.settings[section] as Record<string, Record<string, boolean>>) ?? {};
    this.settings = {
      ...this.settings,
      [section]: { ...current, [key]: { ...(current[key] ?? {}), [field]: checked } },
    };
  }
}
