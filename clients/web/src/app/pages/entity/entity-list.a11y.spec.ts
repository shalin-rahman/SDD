import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { expectNoA11yViolations, runA11yAudit } from '../../testing/a11y.util';
import { EntityListComponent } from './entity-list.component';

describe('EntityListComponent a11y (P15-T32)', () => {
  let fixture: ComponentFixture<EntityListComponent>;

  beforeEach(async () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ code: 'PRODUCT' }));

    await TestBed.configureTestingModule({
      imports: [EntityListComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMap$.asObservable() },
        },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              listRecords: jasmine.createSpy('listRecords').and.resolveTo({ records: [] }),
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PRODUCT',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getGridMetadata: jasmine.createSpy('getGridMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PRODUCT',
                columns: [
                  { field: 'sku', label: 'SKU', sortable: true, filterable: true },
                ],
                export: { csv: false, excel: false, pdf: false },
                grouping: false,
                realtime: false,
                offline: false,
              }),
              syncSnapshot: jasmine.createSpy('syncSnapshot').and.resolveTo({ sync_version: '1' }),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({
                menus: [{ entity_code: 'PRODUCT', label: 'Products' }],
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityListComponent);
  });

  it('has no serious axe violations on empty grid state', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const results = await runA11yAudit(fixture.nativeElement);
    expectNoA11yViolations(results);
  });
});
