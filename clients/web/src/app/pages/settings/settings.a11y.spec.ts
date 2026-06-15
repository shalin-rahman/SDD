import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { ShellContextService } from '../../shared/services/shell-context.service';
import { ThemeService } from '../../shared/services/theme.service';
import { expectNoA11yViolations, runA11yAudit } from '../../testing/a11y.util';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent a11y (P15-T32)', () => {
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
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
                editable_paths: ['tenants.default.primary_color'],
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
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({
                documents: {
                  storage_backend: 'filesystem',
                  max_upload_size_mb: 25,
                  virus_scan_enabled: true,
                  retention_days: 365,
                },
                security: {
                  abac_policies: [],
                  rate_limit_per_minute: 120,
                  security_headers_enabled: true,
                },
              }),
              updateAdminSettings: jasmine
                .createSpy('updateAdminSettings')
                .and.resolveTo({ settings: {}, editable_paths: [], override_paths: [] }),
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
        {
          provide: ThemeService,
          useValue: { applyTenantPrimary: jasmine.createSpy('applyTenantPrimary') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
  });

  it('has no serious axe violations on settings hub', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const results = await runA11yAudit(fixture.nativeElement);
    expectNoA11yViolations(results);
  });
});
