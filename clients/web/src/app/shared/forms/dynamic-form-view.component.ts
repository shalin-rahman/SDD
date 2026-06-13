import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import type { FormFieldMetadata, FormMetadata } from '../../metadata/contract';
import { DynamicFormRenderer } from '../../metadata/dynamic-form.renderer';
import { CurrencyFieldComponent } from './currency-field.component';
import { LookupFieldComponent } from './lookup-field.component';
import { inputType } from '../utils/record.util';
import { formatRecordFieldValue } from '../utils/field-display.util';

@Component({
  selector: 'app-dynamic-form-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    CurrencyFieldComponent,
    LookupFieldComponent,
  ],
  templateUrl: './dynamic-form-view.component.html',
  styleUrl: './dynamic-form-view.component.scss',
})
export class DynamicFormViewComponent {
  @Input({ required: true }) formRenderer!: DynamicFormRenderer;
  @Input() visibleFields: FormFieldMetadata[] = [];
  @Input() formValues: Record<string, unknown> = {};
  @Input() formError = '';
  @Input() noteInput = '';
  @Input() showNoteField = false;
  @Input() notePlaceholder = 'Note (optional)';
  @Input() submitLabel = 'Save';
  @Input() hideSubmitButton = false;
  @Input() showSystemSection = false;

  @Output() fieldChange = new EventEmitter<{ name: string; value: unknown }>();
  @Output() noteInputChange = new EventEmitter<string>();
  @Output() submit = new EventEmitter<void>();

  readonly inputType = inputType;

  get sections(): FormMetadata['sections'] {
    const all = this.formRenderer.formMetadata().sections;
    if (this.showSystemSection) {
      return all;
    }
    return all.filter((section) => section.code !== 'system');
  }

  sectionLabel(code: string): string {
    return this.formRenderer.sectionLabel(code);
  }

  sectionFields(code: string): FormFieldMetadata[] {
    const names = new Set(this.visibleFields.map((field) => field.name));
    const section = this.formRenderer.formMetadata().sections.find((item) => item.code === code);
    if (!section) {
      return [];
    }
    return section.fields.filter((field) => names.has(field.name));
  }

  displayValue(field: FormFieldMetadata, value: unknown): string {
    return formatRecordFieldValue(field.name, field.field_type, value, field.currency_code);
  }
}
