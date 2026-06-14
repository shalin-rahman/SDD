import { MatButtonModule } from '@angular/material/button';
import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { DynamicFormRenderer } from '../../metadata/dynamic-form.renderer';
import type { FormFieldMetadata, FormMetadata } from '../../metadata/contract';
import { validateFormMetadata } from '../../metadata/contract';
import { EmcapApiService } from '../../services/emcap-api.service';
import { EmptyStateComponent } from '../../shared/layout/empty-state.component';
import { LoadingPanelComponent } from '../../shared/layout/loading-panel.component';
import { PageHeaderComponent } from '../../shared/layout/page-header.component';
import { RecordDetailHeaderComponent } from '../../shared/entity/record-detail-header.component';
import { RecordTabsComponent } from '../../shared/entity/record-tabs.component';
import type {
  RecordAuditEntry,
  RecordDocument,
  RecordNote,
  RecordWorkflowInstance,
} from '../../shared/entity/record-tabs.component';
import {
  entityStartWorkflowCode,
  isWorkflowEnabled,
} from '../../shared/utils/workflow-enabled.util';
import { DocumentPreviewPanelComponent } from '../../shared/documents/document-preview-panel.component';
import { DynamicFormViewComponent } from '../../shared/forms/dynamic-form-view.component';
import { I18nService } from '../../shared/services/i18n.service';
import { buildRecordHeadlineView } from '../../shared/utils/record-headline.util';
import {
  canDeleteRecord as recordAllowsDelete,
  canRestoreRecord as recordAllowsRestore,
} from '../../shared/utils/record-lifecycle.util';
import { loadEntityMenuTitle } from './entity-page.util';

@Component({
  selector: 'app-entity-record',
  standalone: true,
  imports: [
    MatButtonModule,
    PageHeaderComponent,
    DynamicFormViewComponent,
    RecordDetailHeaderComponent,
    RecordTabsComponent,
    DocumentPreviewPanelComponent,
    LoadingPanelComponent,
    EmptyStateComponent,
  ],
  templateUrl: './entity-record.component.html',
  styleUrl: './entity-record.component.scss',
})
export class EntityRecordComponent implements OnInit, OnDestroy {
  private readonly api = inject(EmcapApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);
  private readonly destroy$ = new Subject<void>();

  entityCode = '';
  recordIdParam = '';
  title = '';
  loadError = '';
  loadingEntity = false;
  formRenderer: DynamicFormRenderer | null = null;
  private formMeta: FormMetadata | null = null;
  formValues: Record<string, unknown> = {};
  selectedRecordId: string | null = null;
  editingId: string | null = null;
  noteInput = '';
  formError = '';
  detailError = '';
  workflowEnabled = false;
  workflowInstances: RecordWorkflowInstance[] = [];
  recordTabIndex = 0;
  uploadFilename = 'spec.txt';
  uploadContent = 'uploaded from web';
  previewingDocument: RecordDocument | null = null;
  creatingNew = false;

  visibleFields: FormFieldMetadata[] = [];
  notes: RecordNote[] = [];
  documents: RecordDocument[] = [];
  auditEntries: RecordAuditEntry[] = [];

  constructor() {
    effect(() => {
      this.i18n.locale();
      this.applyFormRenderer();
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const code = params.get('code') ?? '';
      const recordId = params.get('recordId') ?? '';
      if (code !== this.entityCode || recordId !== this.recordIdParam) {
        this.entityCode = code;
        this.recordIdParam = recordId;
        this.title = code;
        void loadEntityMenuTitle(this.api, code).then((label) => {
          this.title = label;
        });
        void this.loadEntity();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyFormRenderer(): void {
    if (!this.formMeta) {
      return;
    }
    this.formRenderer = new DynamicFormRenderer(this.formMeta, this.i18n.locale());
    if (Object.keys(this.formValues).length > 0) {
      this.rebuildForm(this.formValues);
    }
  }

  async loadEntity(): Promise<void> {
    this.loadError = '';
    this.loadingEntity = true;
    this.formRenderer = null;
    this.creatingNew = this.recordIdParam === 'new';
    this.selectedRecordId = this.creatingNew ? null : this.recordIdParam;
    this.editingId = null;
    this.workflowInstances = [];
    this.recordTabIndex = 0;
    this.notes = [];
    this.documents = [];
    this.auditEntries = [];
    this.detailError = '';
    try {
      const [loadedFormMeta, platformConfig] = await Promise.all([
        this.api.client.getFormMetadata(this.entityCode),
        this.api.client.getPlatformConfig().catch(() => ({})),
      ]);
      this.workflowEnabled = isWorkflowEnabled(platformConfig);
      if (!validateFormMetadata(loadedFormMeta)) {
        this.loadError = this.i18n.t('entity.invalidMetadata');
        return;
      }
      this.formMeta = loadedFormMeta;
      this.applyFormRenderer();
      if (this.creatingNew) {
        this.rebuildForm();
      } else if (this.selectedRecordId) {
        await this.loadRecord(this.selectedRecordId);
      }
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : this.i18n.t('entity.loadFailed');
    } finally {
      this.loadingEntity = false;
    }
  }

  private async loadRecord(id: string, edit = true): Promise<void> {
    try {
      const loaded = await this.api.client.getRecord(this.entityCode, id);
      if (edit) {
        this.editingId = id;
      }
      this.rebuildForm(loaded);
      await this.loadRecordDetail(id);
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : this.i18n.t('entity.loadFailed');
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
    void this.api.client.restoreRecord(this.entityCode, id).then((loaded) => {
      this.rebuildForm(loaded);
    });
  }

  canStartWorkflow(): boolean {
    return Boolean(
      this.workflowEnabled &&
        this.selectedRecordId &&
        !this.creatingNew &&
        entityStartWorkflowCode(this.entityCode) &&
        this.canDeleteRecord(),
    );
  }

  showWorkflowTab(): boolean {
    return Boolean(this.workflowEnabled && entityStartWorkflowCode(this.entityCode));
  }

  workflowTabIndex(): number {
    return 3;
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

  async loadRecordDetail(recordIdValue: string): Promise<void> {
    this.detailError = '';
    this.notes = [];
    this.documents = [];
    this.auditEntries = [];
    this.workflowInstances = [];
    try {
      const detailRequests: [
        Promise<{ notes: Record<string, unknown>[] }>,
        Promise<{ documents: Record<string, unknown>[] }>,
        Promise<{ audit: Record<string, unknown>[] }>,
        Promise<void>,
      ] = [
        this.api.client.listNotes(this.entityCode, recordIdValue),
        this.api.client.listDocuments(this.entityCode, recordIdValue),
        this.api.client.listAudit(this.entityCode),
        this.showWorkflowTab() ? this.loadWorkflowInstances(recordIdValue) : Promise.resolve(),
      ];
      const [notesPayload, documentsPayload, auditPayload] = await Promise.all(detailRequests);
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
    void this.api.client.deleteRecord(this.entityCode, id).then(() => {
      void this.backToList();
    });
  }

  private async loadWorkflowInstances(recordId: string): Promise<void> {
    try {
      const { instances } = await this.api.client.listWorkflowInstances(recordId);
      this.workflowInstances = instances.map((row) => ({
        id: String(row['id'] ?? ''),
        workflow_code: String(row['workflow_code'] ?? ''),
        current_state: String(row['current_state'] ?? ''),
        assignee: String(row['assignee'] ?? ''),
      }));
    } catch {
      this.workflowInstances = [];
    }
  }

  startWorkflow(): void {
    const recordId = this.selectedRecordId;
    const workflowCode = entityStartWorkflowCode(this.entityCode);
    if (!recordId || !workflowCode) return;
    void this.api.client.startWorkflow(workflowCode, recordId).then(async () => {
      await this.loadWorkflowInstances(recordId);
      if (this.showWorkflowTab()) {
        this.recordTabIndex = this.workflowTabIndex();
      }
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

  backToList(): void {
    void this.router.navigate(['/app/entity', this.entityCode]);
  }

  cancelEdit(): void {
    if (this.creatingNew) {
      this.backToList();
      return;
    }
    if (this.selectedRecordId && this.editingId) {
      this.editingId = null;
      void this.loadRecord(this.selectedRecordId, false);
      return;
    }
    this.backToList();
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
        const newId = String(created.id ?? '');
        if (newId) {
          void this.router.navigate(['/app/entity', this.entityCode, newId]);
          return;
        }
      }
      this.formError = '';
    } catch (err) {
      this.formError = err instanceof Error ? err.message : 'Save failed';
    }
  }
}
