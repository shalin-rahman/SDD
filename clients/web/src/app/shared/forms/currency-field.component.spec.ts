import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CurrencyFieldComponent } from './currency-field.component';
import type { FormFieldMetadata } from '../../metadata/contract';

describe('CurrencyFieldComponent', () => {
  let fixture: ComponentFixture<CurrencyFieldComponent>;
  const field: FormFieldMetadata = {
    name: 'unit_price',
    label: 'Unit Price',
    field_type: 'currency',
    required: false,
    row: 0,
    col: 0,
    span: 6,
    currency_code: 'USD',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyFieldComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyFieldComponent);
    fixture.componentRef.setInput('field', field);
    fixture.detectChanges();
  });

  it('shows currency code label', () => {
    expect(fixture.nativeElement.textContent).toContain('USD');
  });

  it('emits numeric value on input', () => {
    const emitted: Array<number | null> = [];
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));
    fixture.componentInstance.onInput('12.5');
    expect(emitted).toEqual([12.5]);
  });
});
