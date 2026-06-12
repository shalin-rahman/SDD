import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { FormFieldMetadata } from '../../metadata/contract';
import { DynamicFormRenderer } from '../../metadata/dynamic-form.renderer';
import { inputType } from '../utils/record.util';

@Component({
  selector: 'app-dynamic-form-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  @Input() submitLabel = 'Save';

  @Output() fieldChange = new EventEmitter<{ name: string; value: unknown }>();
  @Output() noteInputChange = new EventEmitter<string>();
  @Output() submit = new EventEmitter<void>();

  readonly inputType = inputType;
}
