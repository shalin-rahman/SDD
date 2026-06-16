import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../services/i18n.service';
import { LayoutEditorPanelComponent } from './layout-editor-panel.component';

describe('LayoutEditorPanelComponent', () => {
  let fixture: ComponentFixture<LayoutEditorPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutEditorPanelComponent, NoopAnimationsModule],
      providers: [
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              listEntities: jasmine.createSpy('listEntities').and.resolveTo({ entities: ['PRODUCT'] }),
              getAdminLayoutMetadata: jasmine.createSpy('getAdminLayoutMetadata').and.resolveTo({
                entity_code: 'PRODUCT',
                has_override: false,
                form: {
                  sections: [
                    {
                      code: 'main',
                      fields: [{ name: 'sku', row: 0, col: 0, span: 6 }],
                    },
                  ],
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
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutEditorPanelComponent);
  });

  it('loads entity layout metadata on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.formFields.length).toBe(1);
    expect(fixture.componentInstance.gridColumns.length).toBe(1);
  });
});
