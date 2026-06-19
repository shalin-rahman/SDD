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
import { PageHeaderComponent, type PageBreadcrumb } from '../../shared/layout/page-header.component';
import { SectionCardComponent } from '../../shared/layout/section-card.component';
import {
  ChildLinesSectionComponent,
  type ChildLineColumn,
  type ChildLinesFooter,
} from '../../shared/entity/child-lines-section.component';
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
import { securedVisibleFieldNames } from '../../shared/utils/field-security.util';
import {
  filterMovementLines,
  formatMovementLineExtension,
  formatMovementLineQuantity,
  formatMovementLineUnitCost,
  formatMovementLinesTotal,
  resolveProductLabel,
  sumMovementLineExtensions,
  sumMovementLineQuantities,
} from '../../shared/utils/movement-line.util';
import {
  buildProductLabelMap,
  filterOrderLines,
  formatOrderLineExtension,
  formatOrderLineQuantity,
  formatOrderLineUnitPrice,
  formatOrderLinesTotal,
  orderLineProductLabel,
  PO_LINE_PARENT_FIELD,
  SO_LINE_PARENT_FIELD,
  sumOrderLineExtensions,
  sumOrderLineQuantities,
} from '../../shared/utils/order-line.util';
import {
  buildPaymentSummaryLabels,
  filterCustomerPayments,
  filterVendorPayments,
  formatPaymentCell,
  formatPaymentDate,
  hasOutstandingBalance,
  paymentNumberLabel,
  paymentStatusLabel,
} from '../../shared/utils/payment.util';
import {
  canAddPurchaseOrderLine,
  canReceivePurchaseOrder as poCanReceive,
} from '../../shared/utils/purchase_order_util';
import { parseOrganizationProfile } from '../../shared/utils/organization-profile.util';
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
    SectionCardComponent,
    ChildLinesSectionComponent,
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
  movementLines: Record<string, unknown>[] = [];
  movementLinesError = '';
  movementProductLabels: Record<string, string> = {};
  postingMovement = false;
  postMovementError = '';
  orderLines: Record<string, unknown>[] = [];
  orderLinesError = '';
  orderProductLabels: Record<string, string> = {};
  vendorPayments: Record<string, unknown>[] = [];
  vendorPaymentsError = '';
  customerPayments: Record<string, unknown>[] = [];
  customerPaymentsError = '';
  receivingPo = false;
  receivePoError = '';
  organizationCurrency = 'USD';

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
    this.route.queryParamMap?.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.creatingNew && this.formRenderer) {
        this.applyCreatePrefill();
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
      this.organizationCurrency = parseOrganizationProfile({}, platformConfig).currency || 'USD';
      if (!validateFormMetadata(loadedFormMeta)) {
        this.loadError = this.i18n.t('entity.invalidMetadata');
        return;
      }
      this.formMeta = loadedFormMeta;
      this.applyFormRenderer();
      if (this.creatingNew) {
        this.rebuildForm();
        this.applyCreatePrefill();
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
      await Promise.all([this.loadMovementLines(id), this.loadOrderLines(id), this.loadPayments(id)]);
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : this.i18n.t('entity.loadFailed');
    }
  }

  rebuildForm(values: Record<string, unknown> = {}): void {
    if (!this.formRenderer) return;
    this.formValues = { ...values };
    const visibleNames = this.formRenderer.visibleFieldNames(this.formValues);
    const systemNames = new Set(['id', 'created_at', 'updated_at', 'created_by']);
    const filtered = this.creatingNew
      ? visibleNames.filter((name) => !systemNames.has(name))
      : securedVisibleFieldNames(visibleNames, this.formValues, false);
    this.visibleFields = filtered
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

  recordBreadcrumbs(): PageBreadcrumb[] {
    const detailLabel = this.creatingNew
      ? this.i18n.t('entity.newRecord')
      : this.recordHeadline() || this.recordIdParam;
    return [
      { label: this.title || this.entityCode, routerLink: `/app/entity/${this.entityCode}` },
      { label: detailLabel },
    ];
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
    if (!this.formRenderer) {
      this.visibleFields = [];
      return;
    }
    const visibleNames = this.formRenderer.visibleFieldNames(this.formValues);
    const names = this.creatingNew
      ? visibleNames
      : securedVisibleFieldNames(visibleNames, this.formValues, false);
    this.visibleFields = names
      .map((n) => this.formRenderer!.getField(n))
      .filter((f): f is FormFieldMetadata => f !== undefined);
  }

  canPostMovement(): boolean {
    return (
      this.entityCode === 'STOCK_MOVEMENT' &&
      !this.creatingNew &&
      Boolean(this.selectedRecordId) &&
      this.formValues['status'] === 'draft'
    );
  }

  canAddMovementLine(): boolean {
    return this.canPostMovement();
  }

  showMovementLinesSection(): boolean {
    return (
      this.entityCode === 'STOCK_MOVEMENT' && Boolean(this.selectedRecordId) && !this.creatingNew
    );
  }

  movementLineProductLabel(line: Record<string, unknown>): string {
    return resolveProductLabel(String(line['product_id'] ?? ''), this.movementProductLabels);
  }

  movementLineQtyLabel(line: Record<string, unknown>): string {
    return formatMovementLineQuantity(line);
  }

  movementLineCostLabel(line: Record<string, unknown>): string {
    return formatMovementLineUnitCost(line);
  }

  movementLineTotalLabel(line: Record<string, unknown>): string {
    return formatMovementLineExtension(line);
  }

  movementLinesQtyTotalLabel(): string {
    const total = sumMovementLineQuantities(this.movementLines);
    return total === 0 ? '—' : String(total);
  }

  movementLinesCostTotalLabel(): string {
    return formatMovementLinesTotal(sumMovementLineExtensions(this.movementLines));
  }

  movementLineColumns(): ChildLineColumn[] {
    return [
      {
        header: this.i18n.t('entity.movementLineProduct'),
        cell: (line) => this.movementLineProductLabel(line),
      },
      {
        header: this.i18n.t('entity.movementLineQty'),
        align: 'right',
        cell: (line) => this.movementLineQtyLabel(line),
      },
      {
        header: this.i18n.t('entity.movementLineCost'),
        align: 'right',
        cell: (line) => this.movementLineCostLabel(line),
      },
      {
        header: this.i18n.t('entity.movementLineTotal'),
        align: 'right',
        cell: (line) => this.movementLineTotalLabel(line),
      },
    ];
  }

  movementLinesFooter(): ChildLinesFooter | null {
    if (!this.movementLines.length) {
      return null;
    }
    return {
      label: this.i18n.t('entity.movementLinesSummary'),
      cells: [
        this.movementLinesQtyTotalLabel(),
        '',
        this.movementLinesCostTotalLabel(),
      ],
    };
  }

  showOrderLinesSection(): boolean {
    return (
      (this.entityCode === 'PURCHASE_ORDER' || this.entityCode === 'SALES_ORDER') &&
      Boolean(this.selectedRecordId) &&
      !this.creatingNew
    );
  }

  canAddOrderLine(): boolean {
    if (!this.showOrderLinesSection()) {
      return false;
    }
    if (this.entityCode === 'PURCHASE_ORDER') {
      return canAddPurchaseOrderLine(this.entityCode, this.formValues, {
        recordId: this.selectedRecordId,
        creatingNew: this.creatingNew,
      });
    }
    if (this.entityCode === 'SALES_ORDER') {
      return String(this.formValues['status'] ?? '') === 'draft';
    }
    return false;
  }

  orderLineColumns(): ChildLineColumn[] {
    return [
      {
        header: this.i18n.t('entity.movementLineProduct'),
        cell: (line) => orderLineProductLabel(line, this.orderProductLabels),
      },
      {
        header: this.i18n.t('entity.movementLineQty'),
        align: 'right',
        cell: (line) => formatOrderLineQuantity(line),
      },
      {
        header: this.i18n.t('procurement.po.lineUnitPrice'),
        align: 'right',
        cell: (line) => formatOrderLineUnitPrice(line),
      },
      {
        header: this.i18n.t('entity.movementLineTotal'),
        align: 'right',
        cell: (line) => formatOrderLineExtension(line),
      },
    ];
  }

  orderLinesFooter(): ChildLinesFooter | null {
    if (!this.orderLines.length) {
      return null;
    }
    const qtyTotal = sumOrderLineQuantities(this.orderLines);
    return {
      label: this.i18n.t('entity.movementLinesSummary'),
      cells: [
        qtyTotal === 0 ? '—' : String(qtyTotal),
        '',
        formatOrderLinesTotal(sumOrderLineExtensions(this.orderLines)),
      ],
    };
  }

  orderLinesTitle(): string {
    if (this.entityCode === 'SALES_ORDER') {
      return this.i18n.t('sales.so.lines');
    }
    return this.i18n.t('procurement.po.lines');
  }

  addOrderLine(): void {
    if (!this.canAddOrderLine() || !this.selectedRecordId) {
      return;
    }
    if (this.entityCode === 'PURCHASE_ORDER') {
      void this.router.navigate(['/app/entity', 'PURCHASE_ORDER_LINE', 'new'], {
        queryParams: { po_id: this.selectedRecordId },
      });
      return;
    }
    if (this.entityCode === 'SALES_ORDER') {
      void this.router.navigate(['/app/entity', 'SALES_ORDER_LINE', 'new'], {
        queryParams: { sales_order_id: this.selectedRecordId },
      });
    }
  }

  canReceivePurchaseOrder(): boolean {
    return poCanReceive(this.entityCode, this.formValues, {
      recordId: this.selectedRecordId,
      creatingNew: this.creatingNew,
      orderLineCount: this.orderLines.length,
    });
  }

  async receivePurchaseOrder(): Promise<void> {
    if (!this.canReceivePurchaseOrder() || !this.selectedRecordId) {
      return;
    }
    if (!window.confirm(this.i18n.t('procurement.po.receiveConfirm'))) {
      return;
    }
    this.receivePoError = '';
    this.receivingPo = true;
    const id = this.selectedRecordId;
    try {
      const version = this.formValues['record_version'];
      const ifMatch = typeof version === 'number' ? version : Number(version);
      await this.api.client.updateRecord(
        this.entityCode,
        id,
        { status: 'received' },
        Number.isFinite(ifMatch) ? ifMatch : undefined,
      );
      this.editingId = null;
      await this.loadRecord(id, false);
    } catch (err) {
      this.receivePoError =
        err instanceof Error ? err.message : this.i18n.t('procurement.po.receiveFailed');
    } finally {
      this.receivingPo = false;
    }
  }

  showPaymentSummary(): boolean {
    if (this.creatingNew || !this.selectedRecordId) {
      return false;
    }
    return this.entityCode === 'PURCHASE_ORDER' || this.entityCode === 'INVOICE';
  }

  paymentSummaryLabels(): { total: string; paid: string; balance: string } {
    const totalField = this.entityCode === 'INVOICE' ? 'amount' : 'total_amount';
    return buildPaymentSummaryLabels(
      this.formValues,
      totalField,
      this.organizationCurrency,
      this.i18n.locale(),
    );
  }

  canRecordVendorPayment(): boolean {
    return (
      this.entityCode === 'PURCHASE_ORDER' &&
      !this.creatingNew &&
      Boolean(this.selectedRecordId) &&
      hasOutstandingBalance(this.formValues) &&
      this.formValues['status'] !== 'cancelled'
    );
  }

  canRecordCustomerPayment(): boolean {
    return (
      this.entityCode === 'INVOICE' &&
      !this.creatingNew &&
      Boolean(this.selectedRecordId) &&
      hasOutstandingBalance(this.formValues) &&
      this.formValues['status'] !== 'void' &&
      this.formValues['status'] !== 'paid'
    );
  }

  recordVendorPayment(): void {
    if (!this.canRecordVendorPayment() || !this.selectedRecordId) {
      return;
    }
    void this.router.navigate(['/app/entity', 'VENDOR_PAYMENT', 'new'], {
      queryParams: { po_id: this.selectedRecordId },
    });
  }

  recordCustomerPayment(): void {
    if (!this.canRecordCustomerPayment() || !this.selectedRecordId) {
      return;
    }
    void this.router.navigate(['/app/entity', 'CUSTOMER_PAYMENT', 'new'], {
      queryParams: { invoice_id: this.selectedRecordId },
    });
  }

  showVendorPaymentsSection(): boolean {
    return (
      this.entityCode === 'PURCHASE_ORDER' && Boolean(this.selectedRecordId) && !this.creatingNew
    );
  }

  showCustomerPaymentsSection(): boolean {
    return this.entityCode === 'INVOICE' && Boolean(this.selectedRecordId) && !this.creatingNew;
  }

  paymentLineColumns(): ChildLineColumn[] {
    const locale = this.i18n.locale();
    const currency = this.organizationCurrency;
    return [
      {
        header: this.i18n.t('procurement.payment.number'),
        cell: (row) => paymentNumberLabel(row),
      },
      {
        header: this.i18n.t('procurement.payment.amount'),
        align: 'right',
        cell: (row) => formatPaymentCell(row, currency, locale),
      },
      {
        header: this.i18n.t('procurement.payment.date'),
        cell: (row) => formatPaymentDate(row, locale),
      },
      {
        header: this.i18n.t('procurement.payment.status'),
        cell: (row) => paymentStatusLabel(row),
      },
    ];
  }

  vendorPaymentColumns(): ChildLineColumn[] {
    return this.paymentLineColumns();
  }

  customerPaymentColumns(): ChildLineColumn[] {
    return this.paymentLineColumns();
  }

  addMovementLine(): void {
    if (!this.canAddMovementLine() || !this.selectedRecordId) {
      return;
    }
    void this.router.navigate(['/app/entity', 'STOCK_MOVEMENT_LINE', 'new'], {
      queryParams: { movement_id: this.selectedRecordId },
    });
  }

  private applyCreatePrefill(): void {
    if (!this.creatingNew || !this.formRenderer) {
      return;
    }
    const query = this.route.snapshot.queryParamMap;
    const movementId = query?.get('movement_id');
    if (this.entityCode === 'STOCK_MOVEMENT_LINE' && movementId) {
      this.formValues = { ...this.formValues, movement_id: movementId };
      this.rebuildForm(this.formValues);
      return;
    }
    const poId = query?.get('po_id');
    if (this.entityCode === 'PURCHASE_ORDER_LINE' && poId) {
      this.formValues = { ...this.formValues, po_id: poId };
      this.rebuildForm(this.formValues);
      return;
    }
    const salesOrderId = query?.get('sales_order_id');
    if (this.entityCode === 'SALES_ORDER_LINE' && salesOrderId) {
      this.formValues = { ...this.formValues, sales_order_id: salesOrderId };
      this.rebuildForm(this.formValues);
      return;
    }
    if (this.entityCode === 'VENDOR_PAYMENT' && poId) {
      this.formValues = { ...this.formValues, po_id: poId };
      this.rebuildForm(this.formValues);
      return;
    }
    const invoiceId = query?.get('invoice_id');
    if (this.entityCode === 'CUSTOMER_PAYMENT' && invoiceId) {
      this.formValues = { ...this.formValues, invoice_id: invoiceId };
      this.rebuildForm(this.formValues);
    }
  }

  async postMovement(): Promise<void> {
    if (!this.canPostMovement() || !this.selectedRecordId) {
      return;
    }
    if (!window.confirm(this.i18n.t('entity.postMovementConfirm'))) {
      return;
    }
    this.postMovementError = '';
    this.postingMovement = true;
    const id = this.selectedRecordId;
    try {
      const version = this.formValues['record_version'];
      const ifMatch = typeof version === 'number' ? version : Number(version);
      await this.api.client.updateRecord(
        this.entityCode,
        id,
        { status: 'posted' },
        Number.isFinite(ifMatch) ? ifMatch : undefined,
      );
      this.editingId = null;
      await this.loadRecord(id, false);
    } catch (err) {
      this.postMovementError =
        err instanceof Error ? err.message : this.i18n.t('entity.postMovementFailed');
    } finally {
      this.postingMovement = false;
    }
  }

  private async loadOrderLines(recordId: string): Promise<void> {
    if (this.entityCode !== 'PURCHASE_ORDER' && this.entityCode !== 'SALES_ORDER') {
      this.orderLines = [];
      return;
    }
    this.orderLinesError = '';
    this.orderProductLabels = {};
    const parentField =
      this.entityCode === 'PURCHASE_ORDER' ? PO_LINE_PARENT_FIELD : SO_LINE_PARENT_FIELD;
    const childCode =
      this.entityCode === 'PURCHASE_ORDER' ? 'PURCHASE_ORDER_LINE' : 'SALES_ORDER_LINE';
    try {
      const [linesResponse, productsResponse] = await Promise.all([
        this.api.client.listRecords(childCode),
        this.api.client.listRecords('PRODUCT').catch(() => ({ records: [] })),
      ]);
      this.orderLines = filterOrderLines(linesResponse.records ?? [], parentField, recordId);
      this.orderProductLabels = buildProductLabelMap(productsResponse.records ?? []);
    } catch (err) {
      this.orderLines = [];
      this.orderLinesError =
        err instanceof Error ? err.message : this.i18n.t('procurement.po.linesFailed');
    }
  }

  private async loadPayments(recordId: string): Promise<void> {
    this.vendorPayments = [];
    this.vendorPaymentsError = '';
    this.customerPayments = [];
    this.customerPaymentsError = '';
    if (this.entityCode === 'PURCHASE_ORDER') {
      try {
        const response = await this.api.client.listRecords('VENDOR_PAYMENT');
        this.vendorPayments = filterVendorPayments(response.records ?? [], recordId);
      } catch (err) {
        this.vendorPaymentsError =
          err instanceof Error ? err.message : this.i18n.t('procurement.payment.loadFailed');
      }
      return;
    }
    if (this.entityCode === 'INVOICE') {
      try {
        const response = await this.api.client.listRecords('CUSTOMER_PAYMENT');
        this.customerPayments = filterCustomerPayments(response.records ?? [], recordId);
      } catch (err) {
        this.customerPaymentsError =
          err instanceof Error ? err.message : this.i18n.t('sales.invoice.paymentsFailed');
      }
    }
  }

  private async loadMovementLines(recordId: string): Promise<void> {
    if (this.entityCode !== 'STOCK_MOVEMENT') {
      this.movementLines = [];
      return;
    }
    this.movementLinesError = '';
    this.movementProductLabels = {};
    try {
      const [linesResponse, productsResponse] = await Promise.all([
        this.api.client.listRecords('STOCK_MOVEMENT_LINE'),
        this.api.client.listRecords('PRODUCT').catch(() => ({ records: [] })),
      ]);
      const items = linesResponse.records ?? [];
      this.movementLines = filterMovementLines(items, recordId);
      this.movementProductLabels = buildProductLabelMap(productsResponse.records ?? []);
    } catch (err) {
      this.movementLines = [];
      this.movementLinesError =
        err instanceof Error ? err.message : this.i18n.t('entity.movementLinesFailed');
    }
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
      this.detailError = err instanceof Error ? err.message : this.i18n.t('entity.loadRecordFailed');
    }
  }

  deleteRecord(): void {
    if (!this.selectedRecordId) return;
    const id = this.selectedRecordId;
    const confirmMsg = this.i18n.t('entity.deleteConfirm').replace('{id}', id);
    if (!window.confirm(confirmMsg)) return;
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
      this.formError = err instanceof Error ? err.message : this.i18n.t('entity.saveFailed');
    }
  }
}
