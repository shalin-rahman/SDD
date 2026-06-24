import { MatButtonModule } from '@angular/material/button';
import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { DynamicGridRenderer, SortDirection } from '../../metadata/dynamic-grid.renderer';
import type { FormMetadata, GridMetadata } from '../../metadata/contract';
import { validateFormMetadata, validateGridMetadata } from '../../metadata/contract';
import { EmcapApiService } from '../../services/emcap-api.service';
import { EmptyStateComponent } from '../../shared/layout/empty-state.component';
import { LoadingPanelComponent } from '../../shared/layout/loading-panel.component';
import { PageHeaderComponent, type PageBreadcrumb } from '../../shared/layout/page-header.component';
import { DynamicDataGridComponent } from '../../shared/data/dynamic-data-grid.component';
import { I18nService } from '../../shared/services/i18n.service';
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../../shared/constants/layout.constants';
import { downloadCsv, printPdfTable } from '../../shared/utils/export.util';
import {
  parseOrganizationProfile,
  resolveDocumentHeaderFooter,
  type OrganizationProfileView,
} from '../../shared/utils/organization-profile.util';
import { recordId } from '../../shared/utils/record.util';
import { loadEntityMenuTitle } from './entity-page.util';

@Component({
  selector: 'app-entity-list',
  standalone: true,
  imports: [
    MatButtonModule,
    PageHeaderComponent,
    DynamicDataGridComponent,
    LoadingPanelComponent,
    EmptyStateComponent,
  ],
  templateUrl: './entity-list.component.html',
  styleUrl: './entity-list.component.scss',
})
export class EntityListComponent implements OnInit, OnDestroy {
  private readonly api = inject(EmcapApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);
  private readonly destroy$ = new Subject<void>();

  entityCode = '';
  title = '';
  loadError = '';
  loadingEntity = false;
  loadingList = false;
  gridRenderer: DynamicGridRenderer | null = null;
  private formMeta: FormMetadata | null = null;
  gridMeta: GridMetadata | null = null;
  snapshotSince = '1970-01-01T00:00:00+00:00';
  allRecords: Record<string, unknown>[] = [];
  totalRecords = 0;
  searchInput = '';
  searchQuery = '';
  page = 1;
  sortField: string | null = null;
  sortDir: SortDirection = null;
  groupBy: string | null = null;
  filters: Record<string, string> = {};
  statusLine = '';
  pageLabel = 'Page 1';
  totalPages = 1;
  exportCsv = false;
  exportExcel = false;
  exportPdf = false;
  bulkActions = false;
  selectedRecordIds: string[] = [];
  bulkError = '';
  private organizationProfile: OrganizationProfileView = parseOrganizationProfile({});
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private streamCleanup: (() => void) | null = null;

  columnFields: string[] = [];
  displayGroups: Array<{ key: string; records: Record<string, unknown>[] }> = [];

  listBreadcrumbs(): PageBreadcrumb[] {
    return [
      { label: this.i18n.t('shell.breadcrumb.records') },
      { label: this.title || this.entityCode },
    ];
  }

  constructor() {
    effect(() => {
      this.i18n.locale();
      this.applyGridRenderer();
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const code = params.get('code') ?? '';
      if (code !== this.entityCode) {
        this.stopStream();
        this.entityCode = code;
        this.title = code;
        void loadEntityMenuTitle(this.api, code).then((label) => {
          this.title = label;
        });
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

  private applyGridRenderer(): void {
    if (!this.formMeta || !this.gridMeta) {
      return;
    }
    this.gridRenderer = new DynamicGridRenderer(this.gridMeta, this.i18n.locale());
    this.columnFields = this.gridRenderer.columnFields();
    if (this.allRecords.length > 0) {
      this.refreshGrid();
    }
  }

  async loadEntity(): Promise<void> {
    this.loadError = '';
    this.loadingEntity = true;
    this.gridRenderer = null;
    try {
      const [loadedFormMeta, loadedGridMeta, recordsPayload, snapshot, platformConfig] =
        await Promise.all([
          this.api.client.getFormMetadata(this.entityCode),
          this.api.client.getGridMetadata(this.entityCode),
          this.api.client.listRecords(this.entityCode, {
            limit: DEFAULT_PAGE_SIZE,
            offset: 0,
          }),
          this.api.client.syncSnapshot(this.entityCode),
          this.api.client.getPlatformConfig().catch(() => ({})),
        ]);
      this.organizationProfile = parseOrganizationProfile({}, platformConfig);
      if (!validateFormMetadata(loadedFormMeta) || !validateGridMetadata(loadedGridMeta)) {
        this.loadError = this.i18n.t('entity.invalidMetadata');
        return;
      }
      this.formMeta = loadedFormMeta;
      this.gridMeta = loadedGridMeta;
      this.snapshotSince = String(snapshot.sync_version ?? this.snapshotSince);
      this.page = 1;
      this.allRecords = recordsPayload.records;
      this.totalRecords = recordsPayload.total ?? recordsPayload.records.length;
      this.exportCsv = loadedGridMeta.export.csv;
      this.exportExcel = loadedGridMeta.export.excel;
      this.exportPdf = loadedGridMeta.export.pdf;
      this.bulkActions = loadedGridMeta.bulk_actions === true;
      this.selectedRecordIds = [];
      this.applyGridRenderer();
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

  refreshGrid(): void {
    if (!this.gridRenderer) return;
    let rows = this.gridRenderer.filterRecords(this.allRecords, this.filters);
    rows = this.gridRenderer.sortRecords(rows, this.sortField, this.sortDir);
    const total = this.totalRecords;
    this.totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
    this.displayGroups = this.gridRenderer.groupRecords(rows, this.groupBy);
    this.pageLabel = `${this.i18n.t('grid.page')} ${this.page} / ${this.totalPages} (${total} ${this.i18n.t('grid.records')})`;
    if (this.gridMeta?.offline) {
      void this.api.client.syncChanges(this.entityCode, this.snapshotSince).then((changes) => {
        this.statusLine = `${this.i18n.t('grid.offlinePrefix')} · ${changes.count} ${this.i18n.t('grid.changes')} · ${this.i18n.t('grid.snapshot')} ${this.snapshotSince}`;
      });
    }
  }

  async reloadAll(): Promise<void> {
    this.loadingList = true;
    try {
      const payload = await this.api.client.listRecords(this.entityCode, {
        ...(this.searchQuery ? { q: this.searchQuery } : {}),
        limit: DEFAULT_PAGE_SIZE,
        offset: (this.page - 1) * DEFAULT_PAGE_SIZE,
      });
      this.allRecords = payload.records;
      this.totalRecords = payload.total ?? payload.records.length;
      this.refreshGrid();
    } finally {
      this.loadingList = false;
    }
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
      void this.reloadAll();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page += 1;
      void this.reloadAll();
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
    void this.router.navigate(['/app/entity', this.entityCode, id]);
  }

  startCreate(): void {
    void this.router.navigate(['/app/entity', this.entityCode, 'new']);
  }

  exportCsvFile(): void {
    void this.exportAllRecords().then((records) => {
      if (!this.gridRenderer) return;
      downloadCsv(this.gridRenderer.columnFields(), records, `${this.entityCode}.csv`);
    });
  }

  exportExcelFile(): void {
    void this.exportAllRecords().then((records) => {
      if (!this.gridRenderer) return;
      downloadCsv(this.gridRenderer.columnFields(), records, `${this.entityCode}.xls`);
    });
  }

  exportPdfFile(): void {
    void this.exportAllRecords().then((records) => {
      if (!this.gridRenderer) return;
      const blocks = resolveDocumentHeaderFooter(
        this.organizationProfile,
        this.organizationProfile.report,
      );
      printPdfTable(
        this.gridRenderer.columnFields(),
        records,
        `${this.entityCode} export`,
        blocks,
      );
    });
  }

  private async exportAllRecords(): Promise<Record<string, unknown>[]> {
    const payload = await this.api.client.listRecords(
      this.entityCode,
      this.searchQuery ? { q: this.searchQuery } : undefined,
    );
    return payload.records;
  }

  toggleRecordSelection(record: Record<string, unknown>): void {
    const id = recordId(record);
    if (!id) return;
    if (this.selectedRecordIds.includes(id)) {
      this.selectedRecordIds = this.selectedRecordIds.filter((value) => value !== id);
      return;
    }
    this.selectedRecordIds = [...this.selectedRecordIds, id];
  }

  toggleSelectAllPage(): void {
    const pageIds = this.displayGroups
      .flatMap((group) => group.records.map((record) => recordId(record)))
      .filter((id): id is string => Boolean(id));
    const allSelected = pageIds.length > 0 && pageIds.every((id) => this.selectedRecordIds.includes(id));
    if (allSelected) {
      this.selectedRecordIds = this.selectedRecordIds.filter((id) => !pageIds.includes(id));
      return;
    }
    this.selectedRecordIds = [...new Set([...this.selectedRecordIds, ...pageIds])];
  }

  selectedRecords(): Record<string, unknown>[] {
    const selected = new Set(this.selectedRecordIds);
    return this.allRecords.filter((record) => selected.has(recordId(record) ?? ''));
  }

  async bulkDeleteSelected(): Promise<void> {
    if (!this.bulkActions || this.selectedRecordIds.length === 0) return;
    this.bulkError = '';
    this.loadingList = true;
    try {
      for (const id of [...this.selectedRecordIds]) {
        await this.api.client.deleteRecord(this.entityCode, id);
      }
      this.selectedRecordIds = [];
      await this.reloadAll();
    } catch (err) {
      this.bulkError = err instanceof Error ? err.message : this.i18n.t('entity.bulkDeleteFailed');
    } finally {
      this.loadingList = false;
    }
  }

  exportSelectedCsv(): void {
    if (!this.gridRenderer) return;
    const rows = this.selectedRecords();
    if (rows.length === 0) return;
    downloadCsv(this.gridRenderer.columnFields(), rows, `${this.entityCode}-selected.csv`);
  }
}
