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

  it('saves and resets layout overrides', async () => {
    const putOverride = TestBed.inject(EmcapApiService).client.putAdminLayoutOverride as jasmine.Spy;
    const deleteOverride = TestBed.inject(EmcapApiService).client
      .deleteAdminLayoutOverride as jasmine.Spy;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    await cmp.saveLayout();
    expect(putOverride).toHaveBeenCalled();
    await cmp.resetLayout();
    expect(deleteOverride).toHaveBeenCalled();
  });

  it('handles entity change, column moves, and error paths', async () => {
    const getLayout = TestBed.inject(EmcapApiService).client.getAdminLayoutMetadata as jasmine.Spy;
    const putOverride = TestBed.inject(EmcapApiService).client.putAdminLayoutOverride as jasmine.Spy;
    const deleteOverride = TestBed.inject(EmcapApiService).client
      .deleteAdminLayoutOverride as jasmine.Spy;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.moveColumn(0, -1);
    cmp.moveColumn(0, 5);
    cmp.gridColumns = [
      { field: 'sku', label: 'Sku', sortable: true, filterable: true, width: 120 },
      { field: 'name', label: 'Name', sortable: false, filterable: false, width: null },
    ];
    cmp.moveColumn(0, 1);
    expect(cmp.gridColumns[0].field).toBe('name');

    await cmp.onEntityChange('PRODUCT');
    expect(getLayout).toHaveBeenCalled();

    putOverride.and.rejectWith(new Error('save failed'));
    await cmp.saveLayout();
    expect(cmp.status).toContain('save failed');

    deleteOverride.and.rejectWith('reset failed');
    await cmp.resetLayout();
    expect(cmp.status).toBeTruthy();

    getLayout.and.rejectWith(new Error('load failed'));
    await cmp.loadLayout();
    expect(cmp.status).toContain('load failed');
  });
});
