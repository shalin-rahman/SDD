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
                  tenants: { default: { primary_color: '#112233', logo_url: 'https://example/logo.png' } },
                },
                editable_paths: ['tenants.default.primary_color', 'tenants.default.logo_url'],
              }),
              getAdminIntegrations: jasmine
                .createSpy('getAdminIntegrations')
                .and.resolveTo({ integrations: {} }),
              listAdminTemplates: jasmine.createSpy('listAdminTemplates').and.resolveTo({ templates: [] }),
              getAdminAudit: jasmine.createSpy('getAdminAudit').and.resolveTo({ audit: [] }),
              getHealth: jasmine
                .createSpy('getHealth')
                .and.resolveTo({ tenant_strategy: 'shared_database', multi_tenant: false }),
              getPlatformConfig,
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
});
