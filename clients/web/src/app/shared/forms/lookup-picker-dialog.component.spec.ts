import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EmcapApiService } from '../../services/emcap-api.service';
import { LookupPickerDialogComponent } from './lookup-picker-dialog.component';

describe('LookupPickerDialogComponent', () => {
  let fixture: ComponentFixture<LookupPickerDialogComponent>;
  let listRecords: jasmine.Spy;

  beforeEach(async () => {
    listRecords = jasmine.createSpy('listRecords').and.resolveTo({
      records: [
        { id: 'wh-1', code: 'WH-01', name: 'Main Warehouse' },
        { id: 'wh-2', code: 'WH-02', name: 'Overflow' },
      ],
    });

    await TestBed.configureTestingModule({
      imports: [LookupPickerDialogComponent, NoopAnimationsModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { entityCode: 'WAREHOUSE', selectedId: 'wh-1' },
        },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        {
          provide: EmcapApiService,
          useValue: { client: { listRecords } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LookupPickerDialogComponent);
  });

  it('loads and renders lookup options', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listRecords).toHaveBeenCalledWith('WAREHOUSE', { q: undefined });
    expect(fixture.nativeElement.textContent).toContain('Main Warehouse');
    expect(fixture.nativeElement.textContent).toContain('Overflow');
  });
});
