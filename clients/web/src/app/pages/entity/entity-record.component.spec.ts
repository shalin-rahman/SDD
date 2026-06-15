import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { EntityRecordComponent } from './entity-record.component';

describe('EntityRecordComponent', () => {
  let fixture: ComponentFixture<EntityRecordComponent>;
  let getFormMetadata: jasmine.Spy;

  beforeEach(async () => {
    getFormMetadata = jasmine.createSpy('getFormMetadata').and.resolveTo({
      schema_version: '1',
      entity_code: 'PRODUCT',
      sections: [{ code: 'main', label: 'Main', fields: [] }],
      conditions: [],
    });
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'PRODUCT', recordId: 'new' }),
    );

    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
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
              getFormMetadata,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({
                menus: [{ entity_code: 'PRODUCT', label: 'Products' }],
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
  });

  it('opens create form when recordId is new', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getFormMetadata).toHaveBeenCalledWith('PRODUCT');
    expect(fixture.componentInstance.creatingNew).toBeTrue();
    expect(fixture.nativeElement.querySelector('app-dynamic-form-view')).toBeTruthy();
  });
});
