import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { ShellContextService } from '../../shared/services/shell-context.service';
import { ThemeService } from '../../shared/services/theme.service';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let getPlatformConfig: jasmine.Spy;
  let updateAdminSettings: jasmine.Spy;
  let applyTenantPrimary: jasmine.Spy;

  beforeEach(async () => {
    applyTenantPrimary = jasmine.createSpy('applyTenantPrimary');
    updateAdminSettings = jasmine.createSpy('updateAdminSettings').and.callFake(async (settings: Record<string, unknown>) => ({
      settings,
      editable_paths: ['tenants.default.primary_color', 'tenants.default.logo_url'],
      override_paths: ['modules.ai.enabled'],
    }));
    getPlatformConfig = jasmine.createSpy('getPlatformConfig').and.resolveTo({
      documents: {
        storage_backend: 'filesystem',
        max_upload_size_mb: 25,
        virus_scan_enabled: true,
        retention_days: 365,
      },
      security: {
        abac_policies: [{ permission: 'customer.read' }, { permission: 'customer.write' }],
      },
    });

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getAdminSettings: jasmine.createSpy('getAdminSettings').and.resolveTo({
                settings: {
                  modules: { ai: { enabled: true } },
                  tenants: { default: { primary_color: '#112233', logo_url: 'https://example/logo.png' } },
                },
                editable_paths: ['tenants.default.primary_color', 'tenants.default.logo_url', 'organization_profile.display_name'],
                override_paths: ['modules.ai.enabled'],
              }),
              getAdminOrganizationProfile: jasmine.createSpy('getAdminOrganizationProfile').and.resolveTo({
                profile: { display_name: 'EMCAP Demo Corp', email: 'contact@example.com' },
                editable_paths: ['organization_profile.display_name'],
                override_paths: [],
              }),
              getAdminIntegrations: jasmine
                .createSpy('getAdminIntegrations')
                .and.resolveTo({ integrations: {}, override_paths: [] }),
              listAdminTemplates: jasmine.createSpy('listAdminTemplates').and.resolveTo({ templates: [] }),
              getAdminAudit: jasmine.createSpy('getAdminAudit').and.resolveTo({ audit: [] }),
              getHealth: jasmine
                .createSpy('getHealth')
                .and.resolveTo({ tenant_strategy: 'shared_database', multi_tenant: false }),
              getTenantIsolationOps: jasmine.createSpy('getTenantIsolationOps').and.resolveTo({
                configured_mode: 'shared_database',
                effective_mode: 'shared_database',
                has_override: false,
                reload_hint: '',
              }),
              listEntities: jasmine.createSpy('listEntities').and.resolveTo({ entities: ['PRODUCT'] }),
              getAdminLayoutMetadata: jasmine.createSpy('getAdminLayoutMetadata').and.resolveTo({
                entity_code: 'PRODUCT',
                has_override: false,
                form: {
                  sections: [{ code: 'main', fields: [{ name: 'sku', row: 0, col: 0, span: 6 }] }],
                },
                grid: {
                  columns: [{ field: 'sku', label: 'Sku', sortable: true, filterable: true }],
                },
              }),
              putAdminLayoutOverride: jasmine
                .createSpy('putAdminLayoutOverride')
                .and.resolveTo({ entity_code: 'PRODUCT', override: {} }),
              deleteAdminLayoutOverride: jasmine
                .createSpy('deleteAdminLayoutOverride')
                .and.resolveTo({ entity_code: 'PRODUCT', deleted: true }),
              getPlatformConfig,
              getBaseUrl: jasmine.createSpy('getBaseUrl').and.returnValue('http://localhost:8000'),
              updateAdminSettings,
              updateAdminOrganizationProfile: jasmine
                .createSpy('updateAdminOrganizationProfile')
                .and.resolveTo({ profile: { display_name: 'EMCAP Demo Corp' }, override_paths: [] }),
              uploadAdminOrganizationLogo: jasmine
                .createSpy('uploadAdminOrganizationLogo')
                .and.resolveTo({
                  logo_url: '/api/v1/documents/doc-1/content',
                  document_id: 'doc-1',
                  filename: 'logo.png',
                  mime_type: 'image/png',
                  virus_scan_status: 'clean',
                  profile: { display_name: 'EMCAP Demo Corp', logo_url: '/api/v1/documents/doc-1/content' },
                }),
              getAdminReportSchedules: jasmine
                .createSpy('getAdminReportSchedules')
                .and.resolveTo({
                  schedules: [
                    {
                      code: 'LOW_STOCK',
                      name: 'Low Stock',
                      entity_code: 'PRODUCT',
                      default_schedule_cron: '0 7 * * *',
                      schedule_cron: '0 7 * * *',
                      has_override: false,
                    },
                  ],
                }),
              updateAdminReportSchedule: jasmine
                .createSpy('updateAdminReportSchedule')
                .and.resolveTo({
                  code: 'LOW_STOCK',
                  name: 'Low Stock',
                  entity_code: 'PRODUCT',
                  default_schedule_cron: '0 7 * * *',
                  schedule_cron: '0 8 * * *',
                  has_override: true,
                }),
              updateAdminIntegrations: jasmine
                .createSpy('updateAdminIntegrations')
                .and.resolveTo({ integrations: {}, override_paths: [] }),
              createAdminTemplate: jasmine
                .createSpy('createAdminTemplate')
                .and.resolveTo({ id: 'tpl-1', code: 'welcome' }),
              updateAdminTemplate: jasmine.createSpy('updateAdminTemplate').and.resolveTo({ id: 'tpl-1' }),
              deleteAdminTemplate: jasmine.createSpy('deleteAdminTemplate').and.resolveTo(undefined),
              testAdminRestIntegration: jasmine
                .createSpy('testAdminRestIntegration')
                .and.resolveTo({ job_id: 'job-1' }),
            },
          },
        },
        {
          provide: ShellContextService,
          useValue: { load: jasmine.createSpy('load').and.resolveTo(undefined) },
        },
        {
          provide: ThemeService,
          useValue: { applyTenantPrimary },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
  });

  it('loads document platform settings from GET /config/platform', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getPlatformConfig).toHaveBeenCalled();
    expect(fixture.componentInstance.documentSettings).toEqual({
      storageBackend: 'filesystem',
      maxUploadSizeMb: 25,
      virusScanEnabled: true,
      retentionDays: 365,
    });
    expect(fixture.componentInstance.virusScanLabel()).toBe('Enabled');
  });

  it('loads branding fields and renders live preview panel', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.tenantPrimaryColor).toBe('#112233');
    expect(fixture.componentInstance.brandingPrimaryEditable()).toBeTrue();
    expect(fixture.componentInstance.brandingPreviewPrimary()).toBe('#112233');
    expect(fixture.componentInstance.brandingContrastAdequate()).toBeTrue();
  });

  it('persists tenant primary on save and applies theme', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.tenantPrimaryColor = '#223344';
    await fixture.componentInstance.saveSettings();

    const payload = updateAdminSettings.calls.mostRecent().args[0] as Record<string, unknown>;
    const tenants = payload['tenants'] as Record<string, Record<string, string>>;
    expect(tenants.default.primary_color).toBe('#223344');
    expect(applyTenantPrimary).toHaveBeenCalledWith('#223344');
  });

  it('marks DB override paths with custom badge on module toggles', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const aiItem = fixture.componentInstance.moduleItems().find((item) => item.key === 'ai');
    expect(aiItem?.custom).toBeTrue();
  });

  it('shows reload hint and module summary after save', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance.saveSettings();

    expect(fixture.componentInstance.reloadHint).toContain('Restart the API');
    expect(fixture.componentInstance.moduleEffectiveSummary).toContain('AI module');
  });

  it('builds integration registry health from configured endpoints', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.restBaseUrl = 'https://api.example.com';
    const registry = fixture.componentInstance.integrationRegistry();
    const rest = registry.find((entry) => entry.id === 'rest');
    expect(rest?.status).toBe('configured');
  });

  it('shows module effective summary on initial load', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.moduleEffectiveSummary).toContain('AI module');
  });

  it('loads security platform settings from GET /config/platform', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.securitySettings.abacPolicyCount).toBe(2);
    expect(fixture.componentInstance.securitySettings.rateLimitPerMinute).toBe(120);
    expect(fixture.componentInstance.securityHeadersLabel()).toContain('Enabled');
  });

  it('loads report schedules from admin API', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.reportSchedules.length).toBe(1);
    expect(fixture.componentInstance.reportSchedules[0].code).toBe('LOW_STOCK');
  });

  it('persists document settings on platform save', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.documentSettings = {
      ...fixture.componentInstance.documentSettings,
      maxUploadSizeMb: 32,
      retentionDays: 180,
    };
    await fixture.componentInstance.saveSettings();

    const payload = updateAdminSettings.calls.mostRecent().args[0] as Record<string, unknown>;
    const documents = payload['documents'] as Record<string, unknown>;
    expect(documents['max_upload_size_mb']).toBe(32);
    expect(documents['retention_days']).toBe(180);
  });

  it('builds SMS/push channel bar from notification toggles', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.settings = {
      ...fixture.componentInstance.settings,
      notifications: { email: true, sms: false, push: true },
    };
    const bar = fixture.componentInstance.templateChannelBar();
    expect(bar.find((chip) => chip.channel === 'sms')?.enabled).toBeFalse();
    expect(bar.find((chip) => chip.channel === 'push')?.enabled).toBeTrue();
  });

  it('disables payment credentials when payments module is off', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.settings = {
      modules: { payments: { enabled: false } },
      payments: { enabled: true },
    };
    expect(fixture.componentInstance.paymentCredentialsEnabled()).toBeFalse();
  });

  it('maps isolation mode codes to i18n labels', () => {
    expect(fixture.componentInstance.isolationModeLabel('shared_database')).toContain('Shared');
    expect(fixture.componentInstance.isolationModeLabel('unknown_mode')).toBe('unknown_mode');
  });

  it('handles toggle groups and template editor actions', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.onModuleChange({ key: 'ai', checked: false });
    cmp.onWorkflowChange({ key: 'sla', checked: true });
    cmp.applyBranding();
    cmp.startCreateTemplate();
    expect(cmp.creatingTemplate).toBeTrue();
    cmp.templateCode = 'welcome';
    cmp.templateSubject = 'Hello';
    cmp.templateBody = 'Body';
    await cmp.saveTemplate();
    expect(TestBed.inject(EmcapApiService).client.createAdminTemplate).toHaveBeenCalled();
  });

  it('saves report schedule overrides', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    const row = cmp.reportSchedules[0];
    row.schedule_cron = '0 9 * * *';
    await cmp.saveReportSchedule(row);
    expect(TestBed.inject(EmcapApiService).client.updateAdminReportSchedule).toHaveBeenCalled();
  });

  it('runs REST integration smoke test', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.componentInstance.testRestIntegration();

    expect(fixture.componentInstance.integrationTestStatus).toContain('job-1');
  });

  it('exercises remaining platform toggle handlers and payment fields', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.onAuthChange({ key: 'mfa', checked: true });
    cmp.onNotificationChange({ key: 'sms', checked: false });
    cmp.onGridChange({ key: 'grouping', checked: true });
    cmp.onRulesChange({ key: 'formula', checked: true });
    cmp.onAiChange({ key: 'chat', checked: false });
    cmp.onAuditChange({ key: 'retention', checked: true });
    cmp.selectPaymentProvider('stripe');
    expect(cmp.paymentProviderSelected('stripe')).toBeTrue();
    cmp.paymentPublishableKey = 'pk_test';
    cmp.applyPaymentCredentials();
    cmp.applyIntegrationFields();
    expect(cmp.integrationRegistry().length).toBeGreaterThan(0);
    expect(cmp.channelBarStateLabel(true)).toBeTruthy();
    expect(cmp.smsChannelEnabled()).toBeFalse();
  });

  it('deletes selected template', async () => {
    const deleteTemplate = TestBed.inject(EmcapApiService).client.deleteAdminTemplate as jasmine.Spy;
    TestBed.inject(EmcapApiService).client.listAdminTemplates = jasmine
      .createSpy('listAdminTemplates')
      .and.resolveTo({
        templates: [{ id: 'tpl-1', code: 'welcome', channel: 'email', subject: 'Hi', body: 'Body' }],
      });

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.templates = [{ id: 'tpl-1', code: 'welcome', channel: 'email', subject: 'Hi', body: 'Body' }];
    cmp.selectTemplate(cmp.templates[0]);
    await cmp.deleteTemplate();
    expect(deleteTemplate).toHaveBeenCalledWith('tpl-1');
  });

  it('handles payment provider selection and onPaymentChange toggle', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.settings = {
      modules: { payments: { enabled: true } },
      payments: { enabled: true, provider: 'stripe', stripe: { publishable_key: 'pk' } },
    };
    cmp.onPaymentChange({ key: 'enabled', checked: false });
    expect(cmp.paymentCredentialsEnabled()).toBeFalse();
    cmp.selectPaymentProvider('paypal');
    expect(cmp.paymentProvider).toBe('stripe');

    cmp.settings = {
      modules: { payments: { enabled: true } },
      payments: { enabled: true },
    };
    cmp.selectPaymentProvider('paypal');
    expect(cmp.paymentProvider).toBe('paypal');
    cmp.paymentSecretDraft = 'sk_test';
    cmp.applyPaymentCredentials();
    const payments = cmp.settings['payments'] as Record<string, unknown>;
    const stripe = payments['stripe'] as Record<string, unknown>;
    expect(stripe['secret_key']).toBe('sk_test');
  });

  it('covers integration registry partial kafka and webhook configured states', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.kafkaBootstrap = 'localhost:9092';
    expect(cmp.integrationRegistry().find((e) => e.id === 'kafka')?.status).toBe('partial');
    cmp.kafkaTopicPrefix = 'emcap';
    expect(cmp.integrationRegistry().find((e) => e.id === 'kafka')?.status).toBe('configured');
    cmp.webhookSecretConfigured = true;
    expect(cmp.integrationStatusLabel('configured')).toBeTruthy();
    expect(cmp.integrationStatusLabel('partial')).toBeTruthy();
    expect(cmp.integrationStatusLabel('not_configured')).toBeTruthy();
  });

  it('updates existing template and handles save failures', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.templates = [{ id: 'tpl-2', code: 'alert', channel: 'email', subject: 'S', body: 'B' }];
    cmp.selectTemplate(cmp.templates[0]);
    cmp.templateSubject = 'Updated';
    await cmp.saveTemplate();
    expect(TestBed.inject(EmcapApiService).client.updateAdminTemplate).toHaveBeenCalled();

    TestBed.inject(EmcapApiService).client.updateAdminSettings = jasmine
      .createSpy('updateAdminSettings')
      .and.rejectWith(new Error('save failed'));
    await cmp.saveSettings();
    expect(cmp.loadError).toContain('save failed');
  });

  it('handles isolation ops failure and applyIsolationMode', async () => {
    TestBed.inject(EmcapApiService).client.getTenantIsolationOps = jasmine
      .createSpy('getTenantIsolationOps')
      .and.rejectWith(new Error('ops unavailable'));
    TestBed.inject(EmcapApiService).client.putTenantIsolationOps = jasmine
      .createSpy('putTenantIsolationOps')
      .and.resolveTo({ reload_hint: 'Restart API' });

    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.isolationOpsAvailable).toBeFalse();

    await fixture.componentInstance.applyIsolationMode();
    expect(fixture.componentInstance.isolationOpsStatus).toContain('Restart API');
  });

  it('shows branding contrast warning for low-contrast primary', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.tenantPrimaryColor = '#ffff00';
    expect(cmp.brandingContrastAdequate()).toBeFalse();
    expect(cmp.brandingContrastHint()).toContain('contrast');
    cmp.insertTemplateVariable('{{name}}');
    expect(cmp.templateBody).toContain('{{name}}');
  });

  it('handles reload errors and report schedule save failure', async () => {
    TestBed.inject(EmcapApiService).client.getAdminSettings = jasmine
      .createSpy('getAdminSettings')
      .and.rejectWith(new Error('reload failed'));

    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toContain('reload failed');

    TestBed.inject(EmcapApiService).client.updateAdminReportSchedule = jasmine
      .createSpy('updateAdminReportSchedule')
      .and.rejectWith(new Error('cron invalid'));
    fixture.componentInstance.settings = { modules: { ai: { enabled: false } } };
    fixture.componentInstance.reportSchedules = [
      {
        code: 'LOW_STOCK',
        name: 'Low Stock',
        entity_code: 'PRODUCT',
        default_schedule_cron: '0 7 * * *',
        schedule_cron: '0 7 * * *',
        has_override: false,
      },
    ];
    await fixture.componentInstance.saveReportSchedule(fixture.componentInstance.reportSchedules[0]);
    expect(fixture.componentInstance.reportScheduleStatus).toContain('cron invalid');
  });

  it('rejects invalid cron client-side before calling API', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    const updateSpy = TestBed.inject(EmcapApiService).client
      .updateAdminReportSchedule as jasmine.Spy;
    updateSpy.calls.reset();
    await cmp.saveReportSchedule({
      code: 'LOW_STOCK',
      name: 'Low Stock',
      entity_code: 'PRODUCT',
      default_schedule_cron: '0 7 * * *',
      schedule_cron: 'bad-cron',
      has_override: false,
    });
    expect(updateSpy).not.toHaveBeenCalled();
    expect(cmp.reportScheduleStatus).toContain('valid cron');
  });

  it('skips deleteTemplate when nothing selected and tests REST failure', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.selectedTemplateId = null;
    await cmp.deleteTemplate();
    expect(TestBed.inject(EmcapApiService).client.deleteAdminTemplate).not.toHaveBeenCalled();

    TestBed.inject(EmcapApiService).client.testAdminRestIntegration = jasmine
      .createSpy('testAdminRestIntegration')
      .and.rejectWith(new Error('rest down'));
    await cmp.testRestIntegration();
    expect(cmp.integrationTestStatus).toContain('rest down');
  });

  it('clears payment secret when draft empty and exercises remaining toggles', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.settings = {
      modules: { payments: { enabled: true } },
      payments: { enabled: true, provider: 'stripe', stripe: { publishable_key: 'pk', secret_key: 'sk' } },
    };
    cmp.paymentSecretDraft = '';
    cmp.applyPaymentCredentials();
    const payments = cmp.settings['payments'] as Record<string, unknown>;
    const stripe = payments['stripe'] as Record<string, unknown>;
    expect(stripe['secret_key']).toBeUndefined();

    cmp.onPaymentChange({ key: 'enabled', checked: true });
    cmp.onWorkflowChange({ key: 'enabled', checked: true });
    cmp.onGridChange({ key: 'export_csv', checked: true });
    cmp.onRulesChange({ key: 'formula_enabled', checked: false });
    cmp.onAiChange({ key: 'enabled', checked: true });
    cmp.onAuditChange({ key: 'enabled', checked: false });
    cmp.onAuthChange({ key: 'oauth', checked: true });
    cmp.onNotificationChange({ key: 'email', checked: true });
    expect(cmp.pushChannelEnabled()).toBeFalse();
    expect(cmp.paymentsModuleEnabled()).toBeTrue();
    expect(cmp.brandingReadOnly()).toBeFalse();
    expect(cmp.channelBarStateLabel(false)).toBeTruthy();
  });

  it('applies integration fields and clears webhook secret when draft empty', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.restBaseUrl = 'https://api.example.com';
    cmp.kafkaBootstrap = 'localhost:9092';
    cmp.kafkaTopicPrefix = 'emcap';
    cmp.soapEndpoint = 'https://soap.example.com';
    cmp.webhookSecretDraft = '';
    cmp.applyIntegrationFields();
    const webhook = cmp.integrations['webhook'] as Record<string, unknown>;
    expect(webhook['signing_secret']).toBeUndefined();
    expect((cmp.integrations['rest'] as Record<string, unknown>)['base_url']).toBe('https://api.example.com');
  });

  it('handles saveSettings failure and creates new templates', async () => {
    const updateAdminSettings = TestBed.inject(EmcapApiService).client.updateAdminSettings as jasmine.Spy;
    updateAdminSettings.and.rejectWith(new Error('save boom'));

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    await cmp.saveSettings();
    expect(cmp.loadError).toContain('save boom');

    const createAdminTemplate = jasmine.createSpy('createAdminTemplate').and.resolveTo({ id: 'tpl-new' });
    TestBed.inject(EmcapApiService).client.createAdminTemplate = createAdminTemplate;
    updateAdminSettings.and.resolveTo({ settings: cmp.settings, override_paths: [] });
    TestBed.inject(EmcapApiService).client.updateAdminIntegrations = jasmine
      .createSpy('updateAdminIntegrations')
      .and.resolveTo({ integrations: cmp.integrations, override_paths: [] });

    cmp.creatingTemplate = true;
    cmp.templateCode = 'welcome';
    cmp.templateChannel = 'email';
    cmp.templateSubject = 'Hi';
    cmp.templateBody = 'Body';
    await cmp.saveTemplate();
    expect(createAdminTemplate).toHaveBeenCalled();
  });

  it('saves report schedule for unknown code without list mutation', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    await cmp.saveReportSchedule({
      code: 'UNKNOWN',
      name: 'Unknown',
      entity_code: 'PRODUCT',
      default_schedule_cron: null,
      schedule_cron: '0 8 * * *',
      has_override: false,
    });
    expect(cmp.reportScheduleStatus).toBeTruthy();
  });

  it('covers integration labels, template helpers, and disabled payment provider', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.integrationStatusLabel('configured')).toBeTruthy();
    expect(cmp.integrationStatusLabel('partial')).toBeTruthy();
    expect(cmp.integrationStatusLabel('not_configured')).toBeTruthy();

    cmp.templateBody = 'Hello ';
    cmp.insertTemplateVariable('{{name}}');
    expect(cmp.templateBody).toContain('{{name}}');

    const providerBefore = cmp.paymentProvider;
    cmp.settings = { ...cmp.settings, modules: { payments: { enabled: false } } };
    cmp.selectPaymentProvider('stripe');
    expect(cmp.paymentProvider).toBe(providerBefore);

    cmp.applyBranding();
    expect(cmp.brandingContrastRatioLabel()).toBeTruthy();
    cmp.onGridChange({ key: 'export', checked: true });
    cmp.onWorkflowChange({ key: 'sla', checked: false });
    expect(cmp.virusScanLabel()).toBeTruthy();
    expect(cmp.securityHeadersLabel()).toBeTruthy();
  });

  it('persists settings successfully and applies tenant primary', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    await cmp.saveSettings();
    expect(cmp.status).toBeTruthy();
    expect(applyTenantPrimary).toHaveBeenCalled();
    fixture.detectChanges();

    const statusEl = fixture.nativeElement.querySelector('.status') as HTMLElement;
    expect(statusEl).toBeTruthy();
    expect(statusEl.getAttribute('role')).toBe('status');
    expect(statusEl.getAttribute('aria-live')).toBe('polite');
    expect(statusEl.getAttribute('aria-label')).toBe(cmp.i18n.t('a11y.screenReader.saved'));
  });

  it('exposes deployment version label for observability section', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.deploymentVersionLabel).toContain('0.1.0');
    expect(cmp.deploymentVersionLabel).toContain('1');
  });

  it('shows module effective none, branding read-only, and disabled security labels', async () => {
    TestBed.inject(EmcapApiService).client.getAdminSettings = jasmine
      .createSpy('getAdminSettings')
      .and.resolveTo({
        settings: { modules: {} },
        editable_paths: [],
        override_paths: [],
      });

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.documentSettings = { ...cmp.documentSettings, virusScanEnabled: false };
    cmp.securitySettings = { ...cmp.securitySettings, securityHeadersEnabled: false };
    expect(cmp.moduleEffectiveSummary).toBeTruthy();
    expect(cmp.brandingReadOnly()).toBeTrue();
    expect(cmp.virusScanLabel()).toBeTruthy();
    expect(cmp.securityHeadersLabel()).toBeTruthy();
    expect(cmp.isolationModeLabel('unknown-mode')).toBe('unknown-mode');
  });

  it('surfaces non-Error save failures and syncs configured payment secret', async () => {
    TestBed.inject(EmcapApiService).client.getAdminSettings = jasmine
      .createSpy('getAdminSettings')
      .and.resolveTo({
        settings: {
          modules: { payments: { enabled: true } },
          payments: {
            provider: 'paypal',
            stripe: { publishable_key: 'pk', secret_key: { configured: true } },
          },
        },
        editable_paths: [],
        override_paths: [],
      });

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.paymentSecretConfigured).toBeTrue();
    expect(cmp.paymentProvider).toBe('paypal');

    const updateAdminSettings = TestBed.inject(EmcapApiService).client.updateAdminSettings as jasmine.Spy;
    updateAdminSettings.and.rejectWith('save down');
    TestBed.inject(EmcapApiService).client.updateAdminIntegrations = jasmine
      .createSpy('updateAdminIntegrations')
      .and.resolveTo({ integrations: cmp.integrations, override_paths: [] });
    await cmp.saveSettings();
    expect(cmp.loadError).toBeTruthy();

    TestBed.inject(EmcapApiService).client.updateAdminTemplate = jasmine
      .createSpy('updateAdminTemplate')
      .and.rejectWith('template down');
    cmp.creatingTemplate = false;
    cmp.selectedTemplateId = 'tpl-1';
    cmp.templates = [
      { id: 'tpl-1', code: 'welcome', channel: 'email', subject: 'Hi', body: 'Body' },
    ];
    await cmp.saveTemplate();
    expect(cmp.loadError).toBeTruthy();

    TestBed.inject(EmcapApiService).client.putTenantIsolationOps = jasmine
      .createSpy('putTenantIsolationOps')
      .and.rejectWith('isolation down');
    await cmp.applyIsolationMode();
    expect(cmp.isolationOpsStatus).toBeTruthy();
  });

  it('localizes payment provider and storage backend labels', () => {
    const cmp = fixture.componentInstance;
    expect(cmp.paymentProviderLabel('stripe')).toBe('Stripe');
    expect(cmp.paymentProviderLabel('unknown')).toBe('unknown');
    expect(cmp.documentStorageBackendLabel('filesystem')).toBe('Filesystem');
    expect(cmp.documentStorageBackendLabel('s3')).toContain('S3');
    expect(cmp.documentStorageBackendLabel('unknown')).toBe('unknown');
  });

  it('loads organization profile and saves via dedicated endpoint', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    expect(cmp.organizationProfile.displayName).toBe('EMCAP Demo Corp');
    expect(cmp.organizationDisplayEditable()).toBeTrue();

    cmp.organizationProfile.displayName = 'Acme Widgets';
    cmp.organizationProfile.logoUrl = 'https://cdn.example/logo.png';
    expect(cmp.organizationLogoPreviewUrl()).toBe('https://cdn.example/logo.png');

    const updateOrg = TestBed.inject(EmcapApiService).client
      .updateAdminOrganizationProfile as jasmine.Spy;
    await cmp.saveSettings();
    expect(updateOrg).toHaveBeenCalled();
    const payload = updateOrg.calls.mostRecent().args[0] as Record<string, unknown>;
    expect(payload['display_name']).toBe('Acme Widgets');
  });

  it('rejects non-http logo preview URLs and falls back to tenant branding logo', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    cmp.tenantLogoUrl = '';
    cmp.organizationProfile.logoUrl = 'file:///tmp/logo.png';
    expect(cmp.organizationLogoPreviewUrl()).toBe('');
    cmp.tenantLogoUrl = 'https://fallback/logo.png';
    expect(cmp.organizationLogoPreviewUrl()).toBe('https://fallback/logo.png');
  });

  it('tracks organization override paths', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    expect(cmp.isOrganizationCustom('organization_profile.display_name')).toBeFalse();
    cmp.organizationOverridePaths = ['organization_profile.email'];
    expect(cmp.isOrganizationCustom('organization_profile.email')).toBeTrue();
  });

  it('organizationDisplayEditable reflects editable_paths membership', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    expect(cmp.organizationDisplayEditable()).toBeTrue();
    cmp.editablePaths = [];
    expect(cmp.organizationDisplayEditable()).toBeFalse();
  });

  it('organizationLogoAlt interpolates company name from org.logo.alt catalog key', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    cmp.organizationProfile.displayName = 'Acme Widgets';
    expect(cmp.organizationLogoAlt()).toContain('Acme Widgets');
    cmp.organizationProfile.displayName = '';
    expect(cmp.organizationLogoAlt()).toBeTruthy();
  });

  it('persists invoice and report template fields on organization save', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    cmp.organizationProfile.invoice = { header: 'Invoice {{display_name}}', footer: 'Thanks' };
    cmp.organizationProfile.report = { header: 'Report {{date}}', footer: 'Confidential' };

    const updateOrg = TestBed.inject(EmcapApiService).client
      .updateAdminOrganizationProfile as jasmine.Spy;
    await cmp.saveSettings();

    const payload = updateOrg.calls.mostRecent().args[0] as Record<string, unknown>;
    const invoice = payload['invoice'] as Record<string, string>;
    const report = payload['report'] as Record<string, string>;
    expect(invoice['header']).toBe('Invoice {{display_name}}');
    expect(invoice['footer']).toBe('Thanks');
    expect(report['header']).toBe('Report {{date}}');
    expect(report['footer']).toBe('Confidential');
  });

  it('renders organization panel with org.* starter-catalog field labels', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const tabLabels = (fixture.nativeElement as HTMLElement).querySelectorAll('.mdc-tab__text-label');
    const identityTab = Array.from(tabLabels).find((el) => el.textContent?.includes('Identity'));
    expect(identityTab).toBeTruthy();
    (identityTab as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Company display name');
    expect(html.textContent).toContain('Invoice header');
    expect(html.textContent).toContain('Report footer');
  });

  it('hides logo preview when URL is not http(s)', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    cmp.organizationProfile.logoUrl = 'ftp://bad/logo.png';
    cmp.tenantLogoUrl = '';
    expect(cmp.organizationLogoPreviewUrl()).toBe('');
  });

  it('shows logo preview for https organization logo URL', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    cmp.organizationProfile.logoUrl = 'https://cdn.example/logo.png';
    expect(cmp.organizationLogoPreviewUrl()).toBe('https://cdn.example/logo.png');

    const tabLabels = (fixture.nativeElement as HTMLElement).querySelectorAll('.mdc-tab__text-label');
    const identityTab = Array.from(tabLabels).find((el) => el.textContent?.includes('Identity'));
    (identityTab as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const img = (fixture.nativeElement as HTMLElement).querySelector('.settings-org-logo-preview img');
    expect(img).not.toBeNull();
    expect((img as HTMLImageElement).src).toContain('cdn.example/logo.png');
    expect(cmp.organizationLogoAlt()).toContain('logo');
  });

  describe('Organization profile panel', () => {
    it('accepts http:// logo URLs for preview', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      const cmp = fixture.componentInstance;
      cmp.organizationProfile.logoUrl = 'http://cdn.example/logo.png';
      cmp.tenantLogoUrl = 'https://fallback/logo.png';
      expect(cmp.organizationLogoPreviewUrl()).toBe('http://cdn.example/logo.png');
    });

    it('prefers organization logo over tenant branding when both are valid', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      const cmp = fixture.componentInstance;
      cmp.organizationProfile.logoUrl = 'https://org.example/logo.png';
      cmp.tenantLogoUrl = 'https://tenant.example/logo.png';
      expect(cmp.organizationLogoPreviewUrl()).toBe('https://org.example/logo.png');
    });

    it('returns empty preview when both logo URLs are blank or non-http(s)', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      const cmp = fixture.componentInstance;
      cmp.organizationProfile.logoUrl = '   ';
      cmp.tenantLogoUrl = 'data:image/png;base64,abc';
      expect(cmp.organizationLogoPreviewUrl()).toBe('');
    });

    it('persists contact fields and email signature on organization save', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      const cmp = fixture.componentInstance;
      cmp.organizationProfile.email = 'billing@acme.example';
      cmp.organizationProfile.phone = '+1-555-0100';
      cmp.organizationProfile.emailSignature = '{{display_name}}\n{{email}}';

      const updateOrg = TestBed.inject(EmcapApiService).client
        .updateAdminOrganizationProfile as jasmine.Spy;
      await cmp.saveSettings();

      const payload = updateOrg.calls.mostRecent().args[0] as Record<string, unknown>;
      expect(payload['email']).toBe('billing@acme.example');
      expect(payload['phone']).toBe('+1-555-0100');
      expect(payload['email_signature']).toBe('{{display_name}}\n{{email}}');
    });

    it('makes display name readonly when not in editable_paths', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      const cmp = fixture.componentInstance;
      cmp.editablePaths = cmp.editablePaths.filter((p) => p !== 'organization_profile.display_name');
      expect(cmp.organizationDisplayEditable()).toBeFalse();

      const tabLabels = (fixture.nativeElement as HTMLElement).querySelectorAll('.mdc-tab__text-label');
      const identityTab = Array.from(tabLabels).find((el) => el.textContent?.includes('Identity'));
      (identityTab as HTMLElement).click();
      fixture.detectChanges();
      await fixture.whenStable();

      const displayInput = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('input'),
      ).find((el) => (el as HTMLInputElement).value === 'EMCAP Demo Corp') as HTMLInputElement | undefined;
      expect(displayInput?.readOnly).toBeTrue();
    });

    it('uploads organization logo from file picker and updates preview URL', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      const cmp = fixture.componentInstance;
      const uploadLogo = TestBed.inject(EmcapApiService).client
        .uploadAdminOrganizationLogo as jasmine.Spy;

      const pngBytes = new Uint8Array([137, 80, 78, 71]);
      const file = new File([pngBytes], 'logo.png', { type: 'image/png' });
      await cmp.onOrganizationLogoFileSelected({ target: { files: [file], value: '' } } as unknown as Event);

      expect(uploadLogo).toHaveBeenCalledWith('logo.png', jasmine.any(String));
      expect(cmp.organizationProfile.logoUrl).toBe('/api/v1/documents/doc-1/content');
      expect(cmp.organizationLogoPreviewUrl()).toBe(
        'http://localhost:8000/api/v1/documents/doc-1/content',
      );
    });
  });
});
