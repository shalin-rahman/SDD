import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import type { FormFieldMetadata } from '../../metadata/contract';

@Component({
  selector: 'app-currency-field',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './currency-field.component.html',
  styleUrl: './currency-field.component.scss',
})
export class CurrencyFieldComponent {
  @Input({ required: true }) field!: FormFieldMetadata;
  @Input() value: unknown;
  @Input() required = false;
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<number | null>();

  get currencyCode(): string {
    return this.field.currency_code ?? 'USD';
  }

  onInput(raw: string): void {
    if (raw.trim() === '') {
      this.valueChange.emit(null);
      return;
    }
    const parsed = Number(raw);
    this.valueChange.emit(Number.isNaN(parsed) ? null : parsed);
  }
}
