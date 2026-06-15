import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { ShellContextService } from '../../shared/services/shell-context.service';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let getPlatformConfig: jasmine.Spy;

  beforeEach(async () => {
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
                editable_paths: ['tenants.default.primary_color', 'tenants.default.logo_url'],
                override_paths: ['modules.ai.enabled'],
              }),
              getAdminIntegrations: jasmine
                .createSpy('getAdminIntegrations')
                .and.resolveTo({ integrations: {}, override_paths: [] }),
              listAdminTemplates: jasmine.createSpy('listAdminTemplates').and.resolveTo({ templates: [] }),
              getAdminAudit: jasmine.createSpy('getAdminAudit').and.resolveTo({ audit: [] }),
              getHealth: jasmine
                .createSpy('getHealth')
                .and.resolveTo({ tenant_strategy: 'shared_database', multi_tenant: false }),
              getPlatformConfig,
              updateAdminSettings: jasmine.createSpy('updateAdminSettings').and.resolveTo({
                settings: { modules: { ai: { enabled: true } } },
                override_paths: ['modules.ai.enabled'],
              }),
              updateAdminIntegrations: jasmine
                .createSpy('updateAdminIntegrations')
                .and.resolveTo({ integrations: {}, override_paths: [] }),
            },
          },
        },
        {
          provide: ShellContextService,
          useValue: { load: jasmine.createSpy('load').and.resolveTo(undefined) },
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
});
