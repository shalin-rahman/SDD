import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { LookupFieldComponent } from './lookup-field.component';
import type { FormFieldMetadata } from '../../metadata/contract';

describe('LookupFieldComponent', () => {
  let fixture: ComponentFixture<LookupFieldComponent>;
  let getRecord: jasmine.Spy;
  let dialogOpen: jasmine.Spy;

  const field: FormFieldMetadata = {
    name: 'primary_warehouse',
    label: 'Primary Warehouse',
    field_type: 'lookup',
    required: false,
    row: 0,
    col: 0,
    span: 6,
    lookup_entity: 'WAREHOUSE',
  };

  beforeEach(async () => {
    getRecord = jasmine.createSpy('getRecord').and.resolveTo({
      id: 'wh-1',
      name: 'Main Warehouse',
    });

    await TestBed.configureTestingModule({
      imports: [LookupFieldComponent, NoopAnimationsModule],
      providers: [
        {
          provide: EmcapApiService,
          useValue: { client: { getRecord } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LookupFieldComponent);
    dialogOpen = spyOn(
      (fixture.componentInstance as unknown as { dialog: MatDialog }).dialog,
      'open',
    ).and.returnValue({
      afterClosed: () => of('wh-2'),
    } as never);
    fixture.componentRef.setInput('field', field);
    fixture.componentRef.setInput('value', 'wh-1');
  });

  it('resolves selected record label', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getRecord).toHaveBeenCalledWith('WAREHOUSE', 'wh-1');
    expect(fixture.nativeElement.textContent).toContain('Main Warehouse');
  });

  it('opens picker dialog and emits selection', () => {
    const emitted: unknown[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    fixture.componentInstance.openPicker();
    expect(dialogOpen).toHaveBeenCalled();
    expect(emitted).toEqual(['wh-2']);
  });

  it('handles empty values, lookup errors, and disabled clear', async () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.displayLabel).toBe('—');

    getRecord.and.rejectWith(new Error('missing'));
    fixture.componentRef.setInput('value', 'wh-missing');
    await fixture.componentInstance.refreshLabel();
    expect(fixture.componentInstance.displayLabel).toBe('wh-missing');

    dialogOpen.and.returnValue({ afterClosed: () => of(undefined) } as never);
    const emitted: unknown[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));
    fixture.componentInstance.openPicker();
    expect(emitted).toEqual([]);

    fixture.componentRef.setInput('disabled', true);
    fixture.componentInstance.clear();
    expect(emitted).toEqual([]);
  });
});
