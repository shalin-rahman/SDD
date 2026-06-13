import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import type { FormFieldMetadata } from '../../metadata/contract';
import { EmcapApiService } from '../../services/emcap-api.service';
import { resolveRecordDisplayLabel } from '../utils/lookup-display.util';
import {
  LookupPickerDialogComponent,
  type LookupPickerDialogData,
} from './lookup-picker-dialog.component';

@Component({
  selector: 'app-lookup-field',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  templateUrl: './lookup-field.component.html',
  styleUrl: './lookup-field.component.scss',
})
export class LookupFieldComponent implements OnChanges {
  private readonly dialog = inject(MatDialog);
  private readonly api = inject(EmcapApiService);

  @Input({ required: true }) field!: FormFieldMetadata;
  @Input() value: unknown;
  @Input() required = false;
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<unknown>();

  displayLabel = '—';
  loadingLabel = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['field']) {
      void this.refreshLabel();
    }
  }

  async refreshLabel(): Promise<void> {
    const id = this.value === undefined || this.value === null || this.value === '' ? '' : String(this.value);
    if (!id || !this.field.lookup_entity) {
      this.displayLabel = '—';
      return;
    }
    this.loadingLabel = true;
    try {
      const record = await this.api.client.getRecord(this.field.lookup_entity, id);
      this.displayLabel = resolveRecordDisplayLabel(record);
    } catch {
      this.displayLabel = id;
    } finally {
      this.loadingLabel = false;
    }
  }

  openPicker(): void {
    if (this.disabled || !this.field.lookup_entity) {
      return;
    }
    const data: LookupPickerDialogData = {
      entityCode: this.field.lookup_entity,
      selectedId: this.value ? String(this.value) : undefined,
    };
    const ref = this.dialog.open(LookupPickerDialogComponent, {
      data,
      width: '480px',
      autoFocus: 'first-tabbable',
    });
    ref.afterClosed().subscribe((selectedId: unknown) => {
      if (selectedId === undefined) {
        return;
      }
      this.valueChange.emit(selectedId);
    });
  }

  clear(): void {
    if (!this.disabled) {
      this.valueChange.emit(null);
    }
  }
}
