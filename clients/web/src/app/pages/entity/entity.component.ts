import { MatButtonModule } from '@angular/material/button';
import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { DynamicFormRenderer } from '../../metadata/dynamic-form.renderer';
import { DynamicGridRenderer, SortDirection } from '../../metadata/dynamic-grid.renderer';
import type { FormFieldMetadata, FormMetadata, GridMetadata } from '../../metadata/contract';
import { validateFormMetadata, validateGridMetadata } from '../../metadata/contract';
import { EmcapApiService } from '../../services/emcap-api.service';
import { DetailPlaceholderComponent } from '../../shared/layout/detail-placeholder.component';
import { EmptyStateComponent } from '../../shared/layout/empty-state.component';
import { LoadingPanelComponent } from '../../shared/layout/loading-panel.component';
import { MasterDetailLayoutComponent } from '../../shared/layout/master-detail-layout.component';
import { PageHeaderComponent } from '../../shared/layout/page-header.component';
import { DynamicDataGridComponent } from '../../shared/data/dynamic-data-grid.component';
import { RecordDetailHeaderComponent } from '../../shared/entity/record-detail-header.component';
import { RecordTabsComponent } from '../../shared/entity/record-tabs.component';
import type { RecordAuditEntry, RecordDocument, RecordNote } from '../../shared/entity/record-tabs.component';
import { DocumentPreviewPanelComponent } from '../../shared/documents/document-preview-panel.component';
import { DynamicFormViewComponent } from '../../shared/forms/dynamic-form-view.component';
import { LayoutService } from '../../shared/services/layout.service';
import { I18nService } from '../../shared/services/i18n.service';
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../../shared/constants/layout.constants';
import { buildRecordHeadlineView } from '../../shared/utils/record-headline.util';
import {
  canDeleteRecord as recordAllowsDelete,
  canRestoreRecord as recordAllowsRestore,
} from '../../shared/utils/record-lifecycle.util';
import { downloadCsv, printPdfTable } from '../../shared/utils/export.util';
import { recordId } from '../../shared/utils/record.util';

@Component({
  selector: 'app-entity',
  standalone: true,
  imports: [
    MatButtonModule,
    PageHeaderComponent,
    MasterDetailLayoutComponent,
    DynamicDataGridComponent,
    DynamicFormViewComponent,
    RecordDetailHeaderComponent,
    RecordTabsComponent,
    DocumentPreviewPanelComponent,
    DetailPlaceholderComponent,
    LoadingPanelComponent,
    EmptyStateComponent,
  ],
  templateUrl: './entity.component.html',
  styleUrl: './entity.component.scss',
})
export class EntityComponent implements OnInit, OnDestroy {
  private readonly api = inject(EmcapApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly layout = inject(LayoutService);
  readonly i18n = inject(I18nService);
  private readonly destroy$ = new Subject<void>();

  entityCode = '';
  title = '';
  loadError = '';
  loadingEntity = false;
  formRenderer: DynamicFormRenderer | null = null;
  gridRenderer: DynamicGridRenderer | null = null;
  private formMeta: FormMetadata | null = null;
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
  notes: RecordNote[] = [];
  documents: RecordDocument[] = [];
  auditEntries: RecordAuditEntry[] = [];
  detailError = '';
  workflowStarted = false;
  uploadFilename = 'spec.txt';
  uploadContent = 'uploaded from web';
  previewingDocument: RecordDocument | null = null;
  creatingNew = false;
  mobileDetailOpen = false;
  isMobile = false;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private streamCleanup: (() => void) | null = null;

  columnFields: string[] = [];
  visibleFields: FormFieldMetadata[] = [];
  displayGroups: Array<{ key: string; records: Record<string, unknown>[] }> = [];

  constructor() {
    effect(() => {
      this.i18n.locale();
      this.applyRenderers();
    });
  }

  ngOnInit(): void {
    this.layout.isMobile$.pipe(takeUntil(this.destroy$)).subscribe((mobile) => {
      this.isMobile = mobile;
      if (!mobile) {
        this.mobileDetailOpen = false;
      }
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
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
    this.destroy$.next();
    this.destroy$.complete();
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

  private applyRenderers(): void {
    if (!this.formMeta || !this.gridMeta) {
      return;
    }
    const locale = this.i18n.locale();
    this.formRenderer = new DynamicFormRenderer(this.formMeta, locale);
    this.gridRenderer = new DynamicGridRenderer(this.gridMeta, locale);
    this.columnFields = this.gridRenderer.columnFields();
    if (Object.keys(this.formValues).length > 0) {
      this.rebuildForm(this.formValues);
    }
    if (this.allRecords.length > 0) {
      this.refreshGrid();
    }
  }

  async loadEntity(): Promise<void> {
    this.loadError = '';
    this.loadingEntity = true;
    this.formRenderer = null;
    this.gridRenderer = null;
    this.selectedRecordId = null;
    this.editingId = null;
    this.creatingNew = false;
    this.mobileDetailOpen = false;
    try {
      const [loadedFormMeta, loadedGridMeta, recordsPayload, snapshot] = await Promise.all([
        this.api.client.getFormMetadata(this.entityCode),
        this.api.client.getGridMetadata(this.entityCode),
        this.api.client.listRecords(this.entityCode),
        this.api.client.syncSnapshot(this.entityCode),
      ]);
      if (!validateFormMetadata(loadedFormMeta) || !validateGridMetadata(loadedGridMeta)) {
        this.loadError = this.i18n.t('entity.invalidMetadata');
        return;
      }
      this.formMeta = loadedFormMeta;
      this.gridMeta = loadedGridMeta;
      this.snapshotSince = String(snapshot.sync_version ?? this.snapshotSince);
      this.allRecords = recordsPayload.records;
      this.exportCsv = loadedGridMeta.export.csv;
      this.exportExcel = loadedGridMeta.export.excel;
      this.exportPdf = loadedGridMeta.export.pdf;
      this.applyRenderers();
      this.rebuildForm();
      this.refreshGrid();
      if (loadedGridMeta.realtime) {
        this.streamCleanup = this.api.client.subscribeRecordsStream(this.entityCode, () => {
          void this.reloadAll();
        });
      }
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : this.i18n.t('entity.loadFailed');
    } finally {
      this.loadingEntity = false;
    }
  }

  rebuildForm(values: Record<string, unknown> = {}): void {
    if (!this.formRenderer) return;
    this.formValues = { ...values };
    const visibleNames = this.formRenderer.visibleFieldNames(this.formValues);
    const systemNames = new Set(['id', 'created_at', 'updated_at', 'created_by']);
    const names = this.creatingNew
      ? visibleNames.filter((name) => !systemNames.has(name))
      : visibleNames;
    this.visibleFields = names
      .map((name) => this.formRenderer!.getField(name))
      .filter((f): f is FormFieldMetadata => f !== undefined);
    this.formError = '';
  }

  private mainFieldNames(): string[] {
    const main = this.formMeta?.sections.find((section) => section.code === 'main');
    return main?.fields.map((field) => field.name) ?? [];
  }

  private headlineView(): ReturnType<typeof buildRecordHeadlineView> {
    return buildRecordHeadlineView(
      this.formValues,
      this.creatingNew,
      this.selectedRecordId,
      this.i18n.t.bind(this.i18n),
      this.mainFieldNames(),
      this.formMeta?.display?.status_field,
      this.formMeta?.display?.headline,
      this.i18n.locale(),
    );
  }

  recordHeadline(): string {
    return this.headlineView().headline;
  }

  recordSubtitle(): string {
    return this.headlineView().subtitle;
  }

  statusChipLabel(): string {
    return this.headlineView().statusLabel;
  }

  statusChipActive(): boolean {
    return this.headlineView().statusActive;
  }

  canDeleteRecord(): boolean {
    return recordAllowsDelete(this.selectedRecordId, this.formValues, this.creatingNew);
  }

  canRestoreRecord(): boolean {
    return recordAllowsRestore(this.selectedRecordId, this.formValues);
  }

  restoreRecord(): void {
    if (!this.selectedRecordId) return;
    const id = this.selectedRecordId;
    void this.api.client.restoreRecord(this.entityCode, id).then(async (loaded) => {
      this.rebuildForm(loaded);
      await this.reloadAll();
    });
  }

  canStartWorkflow(): boolean {
    return Boolean(this.selectedRecordId && !this.creatingNew && this.entityCode === 'PRODUCT');
  }

  canSaveRecord(): boolean {
    return Boolean(this.editingId || this.creatingNew);
  }

  showSystemFields(): boolean {
    return Boolean(!this.creatingNew && this.selectedRecordId);
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

  refreshGrid(): void {
    if (!this.gridRenderer) return;
    let rows = this.gridRenderer.filterRecords(this.allRecords, this.filters);
    rows = this.gridRenderer.sortRecords(rows, this.sortField, this.sortDir);
    const total = rows.length;
    this.totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
    const paginated = this.gridRenderer.paginate(rows, this.page, DEFAULT_PAGE_SIZE);
    this.displayGroups = this.gridRenderer.groupRecords(paginated, this.groupBy);
    this.pageLabel = `${this.i18n.t('grid.page')} ${this.page} / ${this.totalPages} (${total} ${this.i18n.t('grid.records')})`;
    if (this.gridMeta?.offline) {
      void this.api.client.syncChanges(this.entityCode, this.snapshotSince).then((changes) => {
        this.statusLine = `${this.i18n.t('grid.offlinePrefix')} · ${changes.count} ${this.i18n.t('grid.changes')} · ${this.i18n.t('grid.snapshot')} ${this.snapshotSince}`;
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

  onSearchInputChange(value: string): void {
    this.searchInput = value;
    this.onSearchChange();
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.searchQuery = this.searchInput.trim();
      this.page = 1;
      void this.reloadAll();
    }, SEARCH_DEBOUNCE_MS);
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

  selectRecord(record: Record<string, unknown>): void {
    const id = recordId(record);
    if (!id) return;
    this.selectedRecordId = id;
    this.creatingNew = false;
    this.workflowStarted = false;
    if (this.isMobile) {
      this.mobileDetailOpen = true;
    }
    void this.loadRecordDetail(id);
    void this.api.client.getRecord(this.entityCode, id).then((loaded) => {
      this.editingId = id;
      this.rebuildForm(loaded);
    });
    this.refreshGrid();
  }

  startCreate(): void {
    this.selectedRecordId = null;
    this.editingId = null;
    this.creatingNew = true;
    this.workflowStarted = false;
    this.notes = [];
    this.documents = [];
    this.auditEntries = [];
    this.detailError = '';
    this.rebuildForm();
    if (this.isMobile) {
      this.mobileDetailOpen = true;
    }
  }

  closeMobileDetail(): void {
    this.mobileDetailOpen = false;
  }

  async loadRecordDetail(recordIdValue: string): Promise<void> {
    this.detailError = '';
    this.notes = [];
    this.documents = [];
    this.auditEntries = [];
    try {
      const [notesPayload, documentsPayload, auditPayload] = await Promise.all([
        this.api.client.listNotes(this.entityCode, recordIdValue),
        this.api.client.listDocuments(this.entityCode, recordIdValue),
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
        .filter((e) => String(e.record_id) === recordIdValue)
        .map((e) => ({
          action: String(e.action ?? ''),
          payloadJson: JSON.stringify(e.payload ?? {}),
        }));
    } catch (err) {
      this.detailError = err instanceof Error ? err.message : 'Failed to load record';
    }
  }

  deleteRecord(): void {
    if (!this.selectedRecordId) return;
    const id = this.selectedRecordId;
    if (!window.confirm(`Delete record ${id}?`)) return;
    void this.api.client.deleteRecord(this.entityCode, id).then(async (deleted) => {
      this.editingId = id;
      this.rebuildForm(deleted);
      await this.reloadAll();
    });
  }

  startWorkflow(): void {
    if (!this.selectedRecordId) return;
    void this.api.client.startWorkflow('STOCK_ADJUSTMENT', this.selectedRecordId).then(() => {
      this.workflowStarted = true;
    });
  }

  previewDocument(doc: RecordDocument): void {
    this.previewingDocument = doc;
  }

  closeDocumentPreview(): void {
    this.previewingDocument = null;
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
    this.creatingNew = false;
    this.mobileDetailOpen = false;
    this.rebuildForm();
    this.refreshGrid();
    this.notes = [];
    this.documents = [];
    this.auditEntries = [];
  }

  async submitForm(): Promise<void> {
    if (!this.formRenderer) return;
    const payload: Record<string, unknown> = {};
    for (const field of this.formRenderer.fields()) {
      if (field.read_only) {
        continue;
      }
      if (!this.formRenderer.isVisible(field.name, this.formValues)) {
        continue;
      }
      payload[field.name] = this.formValues[field.name];
    }
    const errors = this.formRenderer.validate(this.formValues);
    if (Object.keys(errors).length > 0) {
      this.formError = Object.values(errors).join('; ');
      return;
    }
    try {
      if (this.editingId) {
        const version = this.formValues['record_version'];
        const ifMatch = typeof version === 'number' ? version : Number(version);
        await this.api.client.updateRecord(
          this.entityCode,
          this.editingId,
          payload,
          Number.isFinite(ifMatch) ? ifMatch : undefined,
        );
        this.editingId = null;
        this.creatingNew = false;
      } else {
        const created = await this.api.client.createRecord(this.entityCode, payload);
        if (this.noteInput.trim()) {
          await this.api.client.addNote(this.entityCode, String(created.id), this.noteInput.trim());
        }
        this.noteInput = '';
        this.creatingNew = false;
        this.mobileDetailOpen = false;
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
