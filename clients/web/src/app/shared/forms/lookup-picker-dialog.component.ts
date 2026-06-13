import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { EmcapApiService } from '../../services/emcap-api.service';
import { resolveRecordDisplayLabel } from '../utils/lookup-display.util';

export interface LookupPickerDialogData {
  entityCode: string;
  selectedId?: string;
}

@Component({
  selector: 'app-lookup-picker-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  templateUrl: './lookup-picker-dialog.component.html',
  styleUrl: './lookup-picker-dialog.component.scss',
})
export class LookupPickerDialogComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  private readonly dialogRef = inject(MatDialogRef<LookupPickerDialogComponent>);

  records: Record<string, unknown>[] = [];
  search = '';
  loading = true;
  loadError = '';

  constructor(@Inject(MAT_DIALOG_DATA) readonly data: LookupPickerDialogData) {}

  ngOnInit(): void {
    void this.loadRecords();
  }

  async loadRecords(): Promise<void> {
    this.loading = true;
    this.loadError = '';
    try {
      const response = await this.api.client.listRecords(this.data.entityCode, {
        q: this.search.trim() || undefined,
      });
      this.records = response.records ?? [];
    } catch {
      this.loadError = 'Failed to load records';
      this.records = [];
    } finally {
      this.loading = false;
    }
  }

  recordLabel(record: Record<string, unknown>): string {
    return resolveRecordDisplayLabel(record);
  }

  isSelected(record: Record<string, unknown>): boolean {
    return String(record.id ?? '') === (this.data.selectedId ?? '');
  }

  select(record: Record<string, unknown>): void {
    this.dialogRef.close(record.id);
  }

  clear(): void {
    this.dialogRef.close(null);
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
