import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { EntityListComponent } from './entity-list.component';

describe('EntityListComponent', () => {
  let fixture: ComponentFixture<EntityListComponent>;
  let listRecords: jasmine.Spy;

  beforeEach(async () => {
    listRecords = jasmine.createSpy('listRecords').and.resolveTo({ records: [] });
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
              listRecords,
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: 1,
                entity_code: 'PRODUCT',
                sections: [{ code: 'main', fields: [] }],
              }),
              getGridMetadata: jasmine.createSpy('getGridMetadata').and.resolveTo({
                schema_version: 1,
                entity_code: 'PRODUCT',
                columns: [{ field: 'sku', label: 'SKU' }],
                export: { csv: false, excel: false, pdf: false },
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

  it('loads grid for entity code from route', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listRecords).toHaveBeenCalledWith('PRODUCT');
    expect(fixture.nativeElement.textContent).toContain('Products');
  });
});
