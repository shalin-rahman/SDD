import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EmptyStateComponent } from '../layout/empty-state.component';
import { LoadingPanelComponent } from '../layout/loading-panel.component';
import { DynamicGridRenderer } from '../../metadata/dynamic-grid.renderer';
import { I18nService } from '../services/i18n.service';
import { formatGridCellValue } from '../utils/field-display.util';

@Component({
  selector: 'app-dynamic-data-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, EmptyStateComponent, LoadingPanelComponent],
  templateUrl: './dynamic-data-grid.component.html',
  styleUrl: './dynamic-data-grid.component.scss',
})
export class DynamicDataGridComponent {
  readonly i18n = inject(I18nService);

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

  get isEmpty(): boolean {
    return this.displayGroups.every((group) => group.records.length === 0);
  }

  recordId(record: Record<string, unknown>): string {
    return String(record.id ?? '');
  }

  cellValue(field: string, record: Record<string, unknown>): string {
    return formatGridCellValue(field, record[field], {
      fieldType: this.gridRenderer.columnFieldType(field),
      currencyCode: this.gridRenderer.columnCurrencyCode(field),
    });
  }
}
