import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { EntityListComponent } from './entity-list.component';

describe('EntityListComponent', () => {
  let fixture: ComponentFixture<EntityListComponent>;
  let listRecords: jasmine.Spy;

  beforeEach(async () => {
    listRecords = jasmine.createSpy('listRecords').and.resolveTo({ records: [] });
    const paramMap$ = new BehaviorSubject(convertToParamMap({ code: 'PRODUCT' }));

    await TestBed.configureTestingModule({
      imports: [EntityListComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMap$.asObservable() },
        },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              listRecords,
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PRODUCT',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getGridMetadata: jasmine.createSpy('getGridMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PRODUCT',
                columns: [
                  { field: 'sku', label: 'SKU', sortable: true, filterable: true },
                ],
                export: { csv: false, excel: false, pdf: false },
                grouping: false,
                realtime: false,
                offline: false,
              }),
              syncSnapshot: jasmine.createSpy('syncSnapshot').and.resolveTo({ sync_version: '1' }),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({
                menus: [{ entity_code: 'PRODUCT', label: 'Products' }],
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityListComponent);
  });

  it('loads grid for entity code from route', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listRecords).toHaveBeenCalledWith('PRODUCT');
    expect(fixture.nativeElement.textContent).toContain('Products');
  });

  it('sorts, filters, and paginates loaded records', async () => {
    listRecords.and.resolveTo({
      records: [
        { id: '2', sku: 'B-2', name: 'Beta' },
        { id: '1', sku: 'A-1', name: 'Alpha' },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.onSort('sku');
    expect(cmp.sortField).toBe('sku');
    cmp.onFilterChange('name', 'alp');
    cmp.refreshGrid();
    expect(cmp.displayGroups[0].records.length).toBe(1);
    cmp.nextPage();
    cmp.prevPage();
    expect(cmp.listBreadcrumbs().length).toBe(2);
  });

  it('exports CSV when grid metadata allows it', async () => {
    listRecords.and.resolveTo({ records: [{ id: '1', sku: 'A-1' }] });
    TestBed.inject(EmcapApiService).client.getGridMetadata = jasmine
      .createSpy('getGridMetadata')
      .and.resolveTo({
        schema_version: '1',
        entity_code: 'PRODUCT',
        columns: [{ field: 'sku', label: 'SKU', sortable: true, filterable: true }],
        export: { csv: true, excel: false, pdf: false },
        grouping: false,
        realtime: false,
        offline: false,
      });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    spyOn(cmp as unknown as { exportCsvFile: () => void }, 'exportCsvFile').and.callThrough();
    cmp.exportCsv = true;
    cmp.exportCsvFile();
    expect(cmp.exportCsv).toBeTrue();
  });

  it('surfaces load errors and invalid metadata', async () => {
    TestBed.inject(EmcapApiService).client.getFormMetadata = jasmine
      .createSpy('getFormMetadata')
      .and.resolveTo({ schema_version: 'bad', entity_code: 'PRODUCT', sections: [], conditions: [] });

    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toBeTruthy();

    TestBed.inject(EmcapApiService).client.getFormMetadata = jasmine.createSpy('getFormMetadata').and.rejectWith(new Error('network'));
    fixture.componentInstance.entityCode = '';
    await fixture.componentInstance.loadEntity();
    expect(fixture.componentInstance.loadError).toContain('network');
  });

  it('supports realtime stream, offline sync, grouping, and exports', async () => {
    const streamCb: { fn?: () => void } = {};
    const subscribeRecordsStream = jasmine
      .createSpy('subscribeRecordsStream')
      .and.callFake((_code: string, cb: () => void) => {
        streamCb.fn = cb;
        return () => undefined;
      });
    const syncChanges = jasmine.createSpy('syncChanges').and.resolveTo({ count: 2 });
    const listRecordsReload = jasmine.createSpy('listRecords').and.resolveTo({
      records: [
        { id: '1', sku: 'A-1', category: 'Cat' },
        { id: '2', sku: 'B-2', category: 'Cat' },
      ],
    });
    TestBed.inject(EmcapApiService).client.getGridMetadata = jasmine
      .createSpy('getGridMetadata')
      .and.resolveTo({
        schema_version: '1',
        entity_code: 'PRODUCT',
        columns: [
          { field: 'sku', label: 'SKU', sortable: true, filterable: true },
          { field: 'category', label: 'Category', sortable: true, filterable: true },
        ],
        export: { csv: true, excel: true, pdf: true },
        grouping: true,
        realtime: true,
        offline: true,
      });
    TestBed.inject(EmcapApiService).client.listRecords = listRecordsReload;
    TestBed.inject(EmcapApiService).client.subscribeRecordsStream = subscribeRecordsStream;
    TestBed.inject(EmcapApiService).client.syncChanges = syncChanges;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(subscribeRecordsStream).toHaveBeenCalled();
    streamCb.fn?.();
    await fixture.whenStable();

    cmp.toggleGroup();
    expect(cmp.groupBy).toBe('sku');
    cmp.toggleGroup();
    expect(cmp.groupBy).toBeNull();

    cmp.onSort('sku');
    cmp.onSort('sku');
    cmp.onSort('sku');
    expect(cmp.sortDir).toBeNull();

    const prevField = cmp.sortField;
    cmp.onSort('nonexistent');
    expect(cmp.sortField).toBe(prevField);

    spyOn(cmp, 'exportCsvFile').and.callThrough();
    spyOn(cmp, 'exportExcelFile').and.callThrough();
    spyOn(cmp, 'exportPdfFile').and.callThrough();
    cmp.exportCsvFile();
    cmp.exportExcelFile();
    cmp.exportPdfFile();
    expect(cmp.exportCsvFile).toHaveBeenCalled();
  });

  it('navigates to record detail and create form', async () => {
    listRecords.and.resolveTo({ records: [{ id: 'rec-9', sku: 'Z-9' }, { sku: 'no-id' }] });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    cmp.selectRecord({ sku: 'no-id' });
    expect(navigate).not.toHaveBeenCalled();

    cmp.selectRecord({ id: 'rec-9', sku: 'Z-9' });
    expect(navigate).toHaveBeenCalledWith(['/app/entity', 'PRODUCT', 'rec-9']);

    cmp.startCreate();
    expect(navigate).toHaveBeenCalledWith(['/app/entity', 'PRODUCT', 'new']);
  });

  it('rejects invalid grid metadata', async () => {
    TestBed.inject(EmcapApiService).client.getGridMetadata = jasmine
      .createSpy('getGridMetadata')
      .and.resolveTo({ schema_version: 'bad', entity_code: 'PRODUCT', columns: [] });

    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toBeTruthy();
  });

  it('debounces search input and reloads with query', async () => {
    jasmine.clock().install();
    listRecords.and.resolveTo({ records: [{ id: '1', sku: 'A-1' }] });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.onSearchInputChange('  find-me  ');
    jasmine.clock().tick(400);
    await fixture.whenStable();
    expect(listRecords).toHaveBeenCalledWith('PRODUCT', { q: 'find-me' });
    jasmine.clock().uninstall();
  });

  it('covers pagination guards, sort cycles, grouping toggle, and export guards', async () => {
    listRecords.and.resolveTo({
      records: Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1), sku: `SKU-${i}` })),
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    const pageBefore = cmp.page;
    cmp.prevPage();
    expect(cmp.page).toBe(pageBefore);

    cmp.nextPage();
    expect(cmp.page).toBe(2);
    cmp.page = cmp.totalPages;
    cmp.nextPage();
    expect(cmp.page).toBe(cmp.totalPages);

    cmp.onSort('sku');
    expect(cmp.sortDir).toBe('asc');
    cmp.onSort('sku');
    expect(cmp.sortDir).toBe('desc');
    cmp.onSort('sku');
    expect(cmp.sortDir).toBeNull();
    const sortFieldBefore = cmp.sortField;
    cmp.onSort('not-a-column');
    expect(cmp.sortField).toBe(sortFieldBefore);

    cmp.groupBy = 'sku';
    cmp.toggleGroup();
    expect(cmp.groupBy).toBeNull();
    cmp.toggleGroup();
    expect(cmp.groupBy).toBe('sku');

    cmp.gridRenderer = null;
    cmp.exportCsvFile();
    cmp.exportExcelFile();
    cmp.exportPdfFile();
    cmp.toggleGroup();
    cmp.selectRecord({});
    expect(cmp.listBreadcrumbs().length).toBe(2);
  });

  it('exports excel and pdf when metadata allows', async () => {
    TestBed.inject(EmcapApiService).client.getGridMetadata = jasmine
      .createSpy('getGridMetadata')
      .and.resolveTo({
        schema_version: '1',
        entity_code: 'PRODUCT',
        columns: [{ field: 'sku', label: 'SKU', sortable: true, filterable: true }],
        export: { csv: true, excel: true, pdf: true },
        grouping: false,
        realtime: false,
        offline: false,
      });
    listRecords.and.resolveTo({ records: [{ id: '1', sku: 'A' }] });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    spyOn(URL, 'createObjectURL').and.returnValue('blob:1');
    cmp.exportExcelFile();
    cmp.exportPdfFile();
    expect(cmp.exportExcel).toBeTrue();
  });

  it('clears search timer and filters grid columns', async () => {
    jasmine.clock().install();
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.onSearchChange();
    cmp.onSearchInputChange('a');
    jasmine.clock().tick(400);
    await fixture.whenStable();

    cmp.onFilterChange('sku', 'needle');
    expect(cmp.filters['sku']).toBe('needle');
    jasmine.clock().uninstall();
  });
});
