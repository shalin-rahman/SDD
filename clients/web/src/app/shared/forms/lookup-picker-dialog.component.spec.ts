import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { LookupPickerDialogComponent } from './lookup-picker-dialog.component';
import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../services/i18n.service';

describe('LookupPickerDialogComponent', () => {
  let fixture: ComponentFixture<LookupPickerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LookupPickerDialogComponent],
      providers: [
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              listRecords: jasmine.createSpy('listRecords').and.resolveTo({ records: [] }),
            },
          },
        },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: { entityCode: 'PRODUCT' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LookupPickerDialogComponent);
  });

  it('renders i18n search label and empty state', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.loading).toBeFalse();
    const i18n = TestBed.inject(I18nService);
    expect(fixture.nativeElement.textContent).toContain(i18n.t('field.lookup.search'));
    expect(fixture.nativeElement.textContent).toContain(i18n.t('field.lookup.empty'));
  });

  it('surfaces i18n load error', async () => {
    const api = TestBed.inject(EmcapApiService);
    (api.client.listRecords as jasmine.Spy).and.rejectWith(new Error('offline'));
    fixture.detectChanges();
    await fixture.whenStable();
    const i18n = TestBed.inject(I18nService);
    expect(fixture.componentInstance.loadError).toBe(i18n.t('field.lookup.loadFailed'));
  });
});
