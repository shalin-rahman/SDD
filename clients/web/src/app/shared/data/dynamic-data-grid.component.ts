import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EmptyStateComponent } from '../layout/empty-state.component';
import { LoadingPanelComponent } from '../layout/loading-panel.component';
import { DynamicGridRenderer } from '../../metadata/dynamic-grid.renderer';
import { I18nService } from '../services/i18n.service';
import { formatGridCellValue } from '../utils/field-display.util';

@Component({
  selector: 'app-dynamic-data-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatMenuModule, EmptyStateComponent, LoadingPanelComponent],
  templateUrl: './dynamic-data-grid.component.html',
  styleUrl: './dynamic-data-grid.component.scss',
})
export class DynamicDataGridComponent {
  readonly i18n = inject(I18nService);

  @ViewChild('dataTable', { read: ElementRef }) private dataTable?: ElementRef<HTMLTableElement>;

  @Input({ required: true }) gridRenderer!: DynamicGridRenderer;
  @Input() loading = false;
  @Input() columnFields: string[] = [];
  @Input() displayGroups: Array<{ key: string; records: Record<string, unknown>[] }> = [];
  @Input() groupBy: string | null = null;
  @Input() filters: Record<string, string> = {};
  @Input() selectedRecordId: string | null = null;
  @Input() searchInput = '';
  @Input() pageLabel = '';
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() statusLine = '';
  @Input() exportCsv = false;
  @Input() exportExcel = false;
  @Input() exportPdf = false;
  @Input() bulkActions = false;
  @Input() selectedRecordIds: string[] = [];

  @Output() searchInputChange = new EventEmitter<string>();
  @Output() prevPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() toggleGroup = new EventEmitter<void>();
  @Output() sort = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<{ field: string; value: string }>();
  @Output() recordSelect = new EventEmitter<Record<string, unknown>>();
  @Output() exportCsvClick = new EventEmitter<void>();
  @Output() exportExcelClick = new EventEmitter<void>();
  @Output() exportPdfClick = new EventEmitter<void>();
  @Output() createRecord = new EventEmitter<void>();
  @Output() selectionToggle = new EventEmitter<{ record: Record<string, unknown>; event: Event }>();
  @Output() selectAllToggle = new EventEmitter<void>();
  @Output() bulkDeleteClick = new EventEmitter<void>();
  @Output() bulkExportClick = new EventEmitter<void>();

  focusedRowIndex = 0;

  get selectedCount(): number {
    return this.selectedRecordIds.length;
  }

  get hasExportOptions(): boolean {
    return this.exportCsv || this.exportExcel || this.exportPdf;
  }

  isSelected(record: Record<string, unknown>): boolean {
    return this.selectedRecordIds.includes(this.recordId(record));
  }

  get allPageSelected(): boolean {
    const pageIds = this.flatRecords.map((record) => this.recordId(record)).filter(Boolean);
    return pageIds.length > 0 && pageIds.every((id) => this.selectedRecordIds.includes(id));
  }

  get isEmpty(): boolean {
    return this.displayGroups.every((group) => group.records.length === 0);
  }

  get flatRecords(): Record<string, unknown>[] {
    return this.displayGroups.flatMap((group) => group.records);
  }

  recordId(record: Record<string, unknown>): string {
    return String(record.id ?? '');
  }

  rowTabIndex(flatIndex: number): number {
    return this.focusedRowIndex === flatIndex ? 0 : -1;
  }

  flatRowIndex(record: Record<string, unknown>): number {
    return this.flatRecords.findIndex((row) => this.recordId(row) === this.recordId(record));
  }

  rowAriaLabel(record: Record<string, unknown>): string {
    const firstField = this.columnFields[0];
    const value = firstField ? this.cellValue(firstField, record) : this.recordId(record);
    return `${this.i18n.t('grid.rowLabel')} ${value}`;
  }

  handleGridKeydown(event: KeyboardEvent): void {
    const records = this.flatRecords;
    if (records.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusedRowIndex = Math.min(this.focusedRowIndex + 1, records.length - 1);
      this.focusCurrentRow();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusedRowIndex = Math.max(this.focusedRowIndex - 1, 0);
      this.focusCurrentRow();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const record = records[this.focusedRowIndex];
      if (record && this.recordId(record)) {
        this.recordSelect.emit(record);
      }
    }
  }

  onRowFocus(flatIndex: number): void {
    this.focusedRowIndex = flatIndex;
  }

  private focusCurrentRow(): void {
    const table = this.dataTable?.nativeElement;
    if (!table) {
      return;
    }
    const row = table.querySelectorAll<HTMLTableRowElement>('tr.data-grid__row')[this.focusedRowIndex];
    row?.focus();
  }

  cellValue(field: string, record: Record<string, unknown>): string {
    return formatGridCellValue(field, record[field], {
      fieldType: this.gridRenderer.columnFieldType(field),
      currencyCode: this.gridRenderer.columnCurrencyCode(field),
    });
  }
}
