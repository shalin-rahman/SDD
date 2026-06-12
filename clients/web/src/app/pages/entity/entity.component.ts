import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { DynamicFormRenderer } from '../../metadata/dynamic-form.renderer';
import { DynamicGridRenderer, SortDirection } from '../../metadata/dynamic-grid.renderer';
import type { FormFieldMetadata, GridMetadata } from '../../metadata/contract';
import { validateFormMetadata, validateGridMetadata } from '../../metadata/contract';
import { EmcapApiService } from '../../services/emcap-api.service';

const PAGE_SIZE = 10;

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadCsv(columns: string[], rows: Record<string, unknown>[], filename: string): void {
  const escape = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [columns.map(escape).join(',')];
  for (const row of rows) {
    lines.push(columns.map((col) => escape(row[col])).join(','));
  }
  downloadBlob(lines.join('\n'), filename, 'text/csv');
}

function printPdfTable(columns: string[], rows: Record<string, unknown>[], title: string): void {
  const win = window.open('', '_blank');
  if (!win) return;
  const headers = columns.map((c) => `<th>${c}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${String(row[c] ?? '')}</td>`).join('')}</tr>`)
    .join('');
  win.document.write(
    `<html><head><title>${title}</title></head><body><h1>${title}</h1><table border="1"><tr>${headers}</tr>${body}</table></body></html>`,
  );
  win.document.close();
  win.print();
}

@Component({
  selector: 'app-entity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>{{ title }}</h2>
    <p *ngIf="loadError" class="error">{{ loadError }}</p>
    <ng-container *ngIf="gridRenderer">
      <div class="entity-toolbar">
        <input
          placeholder="Search records"
          [(ngModel)]="searchInput"
          (ngModelChange)="onSearchChange()"
        />
        <button type="button" (click)="prevPage()" [disabled]="page <= 1">Prev</button>
        <span>{{ pageLabel }}</span>
        <button type="button" (click)="nextPage()" [disabled]="page >= totalPages">Next</button>
        <button type="button" (click)="toggleGroup()">{{ groupBy ? 'Ungroup' : 'Group' }}</button>
      </div>
      <div *ngIf="exportCsv || exportExcel || exportPdf" class="export-bar">
        <button *ngIf="exportCsv" type="button" (click)="exportCsvFile()">Export CSV</button>
        <button *ngIf="exportExcel" type="button" (click)="exportExcelFile()">Export Excel</button>
        <button *ngIf="exportPdf" type="button" (click)="exportPdfFile()">Export PDF</button>
      </div>
      <p *ngIf="statusLine">{{ statusLine }}</p>
      <table class="grid-table">
        <tr>
          <th
            *ngFor="let field of columnFields"
            [style.cursor]="gridRenderer.isSortable(field) ? 'pointer' : 'default'"
            (click)="onSort(field)"
          >
            {{ gridRenderer.columnLabel(field) }}
          </th>
        </tr>
        <tr>
          <th *ngFor="let field of columnFields">
            <input
              *ngIf="gridRenderer.isFilterable(field)"
              placeholder="Filter"
              [ngModel]="filters[field]"
              (ngModelChange)="onFilterChange(field, $event)"
            />
          </th>
        </tr>
        <ng-container *ngFor="let group of displayGroups">
          <tr *ngIf="groupBy && group.key">
            <td [attr.colspan]="columnFields.length">{{ groupBy }}: {{ group.key }}</td>
          </tr>
          <tr
            *ngFor="let record of group.records"
            [class.row-selected]="selectedRecordId === recordId(record)"
            [style.cursor]="recordId(record) ? 'pointer' : 'default'"
            (click)="selectRecord(record)"
          >
            <td *ngFor="let field of columnFields">{{ record[field] }}</td>
          </tr>
        </ng-container>
      </table>
      <section *ngIf="selectedRecordId" class="record-detail">
        <h3>Record {{ selectedRecordId }}</h3>
        <button type="button" (click)="startEdit()">Edit</button>
        <button type="button" (click)="deleteRecord()">Delete</button>
        <button *ngIf="entityCode === 'PRODUCT'" type="button" (click)="startWorkflow()">
          Start STOCK_ADJUSTMENT
        </button>
        <p *ngIf="workflowStarted">Workflow started.</p>
        <p *ngIf="detailError" class="error">{{ detailError }}</p>
        <h4>Notes ({{ notes.length }})</h4>
        <ul>
          <li *ngFor="let note of notes">{{ note.body }}</li>
        </ul>
        <h4>Documents ({{ documents.length }})</h4>
        <ul>
          <li *ngFor="let doc of documents">
            {{ doc.filename }} v{{ doc.version }} · {{ doc.virus_scan_status }}
            <button type="button" (click)="previewDocument(doc)">Preview</button>
          </li>
        </ul>
        <h4>Audit ({{ auditEntries.length }})</h4>
        <ul>
          <li *ngFor="let entry of auditEntries">{{ entry.action }} — {{ entry.payloadJson }}</li>
        </ul>
        <form class="record-form" (ngSubmit)="uploadDocument()">
          <input [(ngModel)]="uploadFilename" name="uploadFilename" />
          <textarea [(ngModel)]="uploadContent" name="uploadContent"></textarea>
          <button type="submit">Upload document</button>
        </form>
      </section>
      <form *ngIf="formRenderer" class="record-form entity-form" (ngSubmit)="submitForm()">
        <label *ngFor="let field of visibleFields" [ngStyle]="formRenderer.layoutStyle(field)">
          {{ formRenderer.label(field.name) }}
          <input
            *ngIf="field.field_type !== 'checkbox'"
            [type]="inputType(field)"
            [name]="field.name"
            [required]="formRenderer.isRequired(field.name)"
            [ngModel]="formValues[field.name]"
            (ngModelChange)="onFormFieldChange(field.name, $event)"
          />
          <input
            *ngIf="field.field_type === 'checkbox'"
            type="checkbox"
            [name]="field.name"
            [ngModel]="formValues[field.name]"
            (ngModelChange)="onFormFieldChange(field.name, $event)"
          />
        </label>
        <textarea
          *ngIf="!editingId"
          placeholder="Note (optional)"
          [(ngModel)]="noteInput"
          name="noteInput"
        ></textarea>
        <button type="submit">{{ editingId ? 'Save changes' : 'Create record' }}</button>
        <button *ngIf="editingId" type="button" (click)="cancelEdit()">Cancel edit</button>
        <p *ngIf="formError" class="error">{{ formError }}</p>
      </form>
    </ng-container>
  `,
  styles: [
    `
      .entity-toolbar {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
      }
      .entity-form {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 0.5rem;
        max-width: none;
      }
    `,
  ],
})
export class EntityComponent implements OnInit, OnDestroy {
  private readonly api = inject(EmcapApiService);
  private readonly route = inject(ActivatedRoute);

  entityCode = '';
  title = '';
  loadError = '';
  formRenderer: DynamicFormRenderer | null = null;
  gridRenderer: DynamicGridRenderer | null = null;
  gridMeta: GridMetadata | null = null;
  snapshotSince = '1970-01-01T00:00:00+00:00';
  allRecords: Record<string, unknown>[] = [];
  searchInput = '';
  searchQuery = '';
  page = 1;
  sortField: string | null = null;
  sortDir: SortDirection = null;
  groupBy: string | null = null;
  filters: Record<string, string> = {};
  formValues: Record<string, unknown> = {};
  selectedRecordId: string | null = null;
  editingId: string | null = null;
  noteInput = '';
  formError = '';
  statusLine = '';
  pageLabel = 'Page 1';
  totalPages = 1;
  exportCsv = false;
  exportExcel = false;
  exportPdf = false;
  notes: { body: string }[] = [];
  documents: { id: string; filename: string; version: string; virus_scan_status: string }[] = [];
  auditEntries: { action: string; payloadJson: string }[] = [];
  detailError = '';
  workflowStarted = false;
  uploadFilename = 'spec.txt';
  uploadContent = 'uploaded from web';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private streamCleanup: (() => void) | null = null;

  columnFields: string[] = [];
  visibleFields: FormFieldMetadata[] = [];
  displayGroups: Array<{ key: string; records: Record<string, unknown>[] }> = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const code = params.get('code') ?? '';
      if (code !== this.entityCode) {
        this.stopStream();
        this.entityCode = code;
        this.title = code;
        void this.loadMenusTitle(code);
        void this.loadEntity();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopStream();
  }

  private stopStream(): void {
    this.streamCleanup?.();
    this.streamCleanup = null;
  }

  private async loadMenusTitle(code: string): Promise<void> {
    try {
      const { menus } = await this.api.client.getMenus();
      const menu = menus.find((m) => m.entity_code === code);
      if (menu) {
        this.title = menu.label;
      }
    } catch {
      // keep entity code as title
    }
  }

  async loadEntity(): Promise<void> {
    this.loadError = '';
    this.formRenderer = null;
    this.gridRenderer = null;
    this.selectedRecordId = null;
    this.editingId = null;
    try {
      const [loadedFormMeta, loadedGridMeta, recordsPayload, snapshot] = await Promise.all([
        this.api.client.getFormMetadata(this.entityCode),
        this.api.client.getGridMetadata(this.entityCode),
        this.api.client.listRecords(this.entityCode),
        this.api.client.syncSnapshot(this.entityCode),
      ]);
      if (!validateFormMetadata(loadedFormMeta) || !validateGridMetadata(loadedGridMeta)) {
        this.loadError = 'Invalid metadata contract';
        return;
      }
      this.gridMeta = loadedGridMeta;
      this.formRenderer = new DynamicFormRenderer(loadedFormMeta);
      this.gridRenderer = new DynamicGridRenderer(loadedGridMeta);
      this.snapshotSince = String(snapshot.sync_version ?? this.snapshotSince);
      this.allRecords = recordsPayload.records;
      this.exportCsv = loadedGridMeta.export.csv;
      this.exportExcel = loadedGridMeta.export.excel;
      this.exportPdf = loadedGridMeta.export.pdf;
      this.columnFields = this.gridRenderer.columnFields();
      this.rebuildForm();
      this.refreshGrid();
      if (loadedGridMeta.realtime) {
        this.streamCleanup = this.api.client.subscribeRecordsStream(this.entityCode, () => {
          void this.reloadAll();
        });
      }
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : 'Failed to load entity';
    }
  }

  rebuildForm(values: Record<string, unknown> = {}): void {
    if (!this.formRenderer) return;
    this.formValues = { ...values };
    this.visibleFields = this.formRenderer
      .visibleFieldNames(this.formValues)
      .map((name) => this.formRenderer!.getField(name))
      .filter((f): f is FormFieldMetadata => f !== undefined);
    this.formError = '';
  }

  onFormFieldChange(name: string, value: unknown): void {
    this.formValues = { ...this.formValues, [name]: value };
    this.visibleFields = this.formRenderer
      ? this.formRenderer
          .visibleFieldNames(this.formValues)
          .map((n) => this.formRenderer!.getField(n))
          .filter((f): f is FormFieldMetadata => f !== undefined)
      : [];
  }

  inputType(field: FormFieldMetadata): string {
    const type = field.field_type ?? 'text';
    if (type === 'number') return 'number';
    if (type === 'date') return 'date';
    if (type === 'email') return 'email';
    return 'text';
  }

  refreshGrid(): void {
    if (!this.gridRenderer) return;
    let rows = this.gridRenderer.filterRecords(this.allRecords, this.filters);
    rows = this.gridRenderer.sortRecords(rows, this.sortField, this.sortDir);
    const total = rows.length;
    this.totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const paginated = this.gridRenderer.paginate(rows, this.page, PAGE_SIZE);
    this.displayGroups = this.gridRenderer.groupRecords(paginated, this.groupBy);
    this.pageLabel = `Page ${this.page} / ${this.totalPages} (${total} records)`;
    if (this.gridMeta?.offline) {
      void this.api.client.syncChanges(this.entityCode, this.snapshotSince).then((changes) => {
        this.statusLine = `Offline · ${changes.count} change(s) · snapshot ${this.snapshotSince}`;
      });
    }
  }

  async reloadAll(): Promise<void> {
    const payload = await this.api.client.listRecords(
      this.entityCode,
      this.searchQuery ? { q: this.searchQuery } : undefined,
    );
    this.allRecords = payload.records;
    this.refreshGrid();
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.searchQuery = this.searchInput.trim();
      this.page = 1;
      void this.reloadAll();
    }, 300);
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page -= 1;
      this.refreshGrid();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page += 1;
      this.refreshGrid();
    }
  }

  toggleGroup(): void {
    if (!this.gridRenderer) return;
    const fields = this.gridRenderer.columnFields();
    this.groupBy = this.groupBy ? null : (fields[0] ?? null);
    this.refreshGrid();
  }

  onSort(field: string): void {
    if (!this.gridRenderer?.isSortable(field)) return;
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : this.sortDir === 'desc' ? null : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.refreshGrid();
  }

  onFilterChange(field: string, value: string): void {
    this.filters = { ...this.filters, [field]: value };
    this.page = 1;
    this.refreshGrid();
  }

  recordId(record: Record<string, unknown>): string {
    return String(record.id ?? '');
  }

  selectRecord(record: Record<string, unknown>): void {
    const id = this.recordId(record);
    if (!id) return;
    this.selectedRecordId = id;
    this.workflowStarted = false;
    void this.loadRecordDetail(id);
    this.refreshGrid();
  }

  async loadRecordDetail(recordId: string): Promise<void> {
    this.detailError = '';
    this.notes = [];
    this.documents = [];
    this.auditEntries = [];
    try {
      const [notesPayload, documentsPayload, auditPayload] = await Promise.all([
        this.api.client.listNotes(this.entityCode, recordId),
        this.api.client.listDocuments(this.entityCode, recordId),
        this.api.client.listAudit(this.entityCode),
      ]);
      this.notes = notesPayload.notes.map((n) => ({ body: String(n.body ?? '') }));
      this.documents = documentsPayload.documents.map((doc) => ({
        id: String(doc.id ?? ''),
        filename: String(doc.filename ?? doc.id ?? ''),
        version: String(doc.version ?? 1),
        virus_scan_status: String(doc.virus_scan_status ?? ''),
      }));
      this.auditEntries = auditPayload.audit
        .filter((e) => String(e.record_id) === recordId)
        .map((e) => ({
          action: String(e.action ?? ''),
          payloadJson: JSON.stringify(e.payload ?? {}),
        }));
    } catch (err) {
      this.detailError = err instanceof Error ? err.message : 'Failed to load record';
    }
  }

  startEdit(): void {
    if (!this.selectedRecordId) return;
    void this.api.client.getRecord(this.entityCode, this.selectedRecordId).then((record) => {
      this.editingId = this.selectedRecordId;
      this.rebuildForm(record);
    });
  }

  deleteRecord(): void {
    if (!this.selectedRecordId) return;
    const id = this.selectedRecordId;
    if (!window.confirm(`Delete record ${id}?`)) return;
    void this.api.client.deleteRecord(this.entityCode, id).then(async () => {
      this.selectedRecordId = null;
      this.editingId = null;
      this.rebuildForm();
      await this.reloadAll();
    });
  }

  startWorkflow(): void {
    if (!this.selectedRecordId) return;
    void this.api.client.startWorkflow('STOCK_ADJUSTMENT', this.selectedRecordId).then(() => {
      this.workflowStarted = true;
    });
  }

  previewDocument(doc: { id: string }): void {
    void this.api.client.getDocument(doc.id).then((full) => {
      window.alert(`Document ${full.filename}\nOCR: ${String(full.ocr_text ?? '').slice(0, 200)}`);
    });
  }

  uploadDocument(): void {
    if (!this.selectedRecordId) return;
    const id = this.selectedRecordId;
    void this.api.client
      .uploadDocument(this.entityCode, id, this.uploadFilename, this.uploadContent)
      .then(() => this.loadRecordDetail(id));
  }

  cancelEdit(): void {
    this.editingId = null;
    this.selectedRecordId = null;
    this.rebuildForm();
    this.refreshGrid();
    this.notes = [];
    this.documents = [];
    this.auditEntries = [];
  }

  async submitForm(): Promise<void> {
    if (!this.formRenderer) return;
    const payload: Record<string, unknown> = { ...this.formValues };
    const errors = this.formRenderer.validate(payload);
    if (Object.keys(errors).length > 0) {
      this.formError = Object.values(errors).join('; ');
      return;
    }
    try {
      if (this.editingId) {
        await this.api.client.updateRecord(this.entityCode, this.editingId, payload);
        this.editingId = null;
      } else {
        const created = await this.api.client.createRecord(this.entityCode, payload);
        if (this.noteInput.trim()) {
          await this.api.client.addNote(this.entityCode, String(created.id), this.noteInput.trim());
        }
        this.noteInput = '';
      }
      this.formValues = {};
      this.rebuildForm();
      await this.reloadAll();
    } catch (err) {
      this.formError = err instanceof Error ? err.message : 'Save failed';
    }
  }

  exportCsvFile(): void {
    if (!this.gridRenderer) return;
    downloadCsv(this.gridRenderer.columnFields(), this.allRecords, `${this.entityCode}.csv`);
  }

  exportExcelFile(): void {
    if (!this.gridRenderer) return;
    downloadCsv(this.gridRenderer.columnFields(), this.allRecords, `${this.entityCode}.xls`);
  }

  exportPdfFile(): void {
    if (!this.gridRenderer) return;
    printPdfTable(this.gridRenderer.columnFields(), this.allRecords, this.title);
  }
}
