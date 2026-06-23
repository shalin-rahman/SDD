import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { EntityRecordComponent } from './entity-record.component';

describe('EntityRecordComponent', () => {
  let fixture: ComponentFixture<EntityRecordComponent>;
  let getFormMetadata: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.resetTestingModule();
    getFormMetadata = jasmine.createSpy('getFormMetadata').and.resolveTo({
      schema_version: '1',
      entity_code: 'PRODUCT',
      sections: [{ code: 'main', label: 'Main', fields: [] }],
      conditions: [],
    });
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'PRODUCT', recordId: 'new' }),
    );
    const queryParamMap$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([
          { path: 'app/entity/:code', component: EntityRecordComponent },
          { path: 'app/entity/:code/:recordId', component: EntityRecordComponent },
        ]),
        I18nService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
            queryParamMap: queryParamMap$.asObservable(),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({
                menus: [{ entity_code: 'PRODUCT', label: 'Products' }],
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
  });

  it('opens create form when recordId is new', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getFormMetadata).toHaveBeenCalledWith('PRODUCT');
    expect(fixture.componentInstance.creatingNew).toBeTrue();
    expect(fixture.nativeElement.querySelector('app-dynamic-form-view')).toBeTruthy();
  });

  it('loads existing record when recordId is set', async () => {
    const getRecord = jasmine.createSpy('getRecord').and.resolveTo({
      id: 'rec-1',
      sku: 'SKU-1',
      name: 'Widget',
      active: true,
      record_version: 1,
    });
    const getGridMetadata = jasmine.createSpy('getGridMetadata').and.resolveTo({
      schema_version: '1',
      entity_code: 'PRODUCT',
      columns: [],
      export: { excel: true },
      grouping: false,
      realtime: false,
      offline: false,
    });
    const paramMap$ = new BehaviorSubject(convertToParamMap({ code: 'PRODUCT', recordId: 'rec-1' }));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([
          { path: 'app/entity/:code', component: EntityRecordComponent },
          { path: 'app/entity/:code/:recordId', component: EntityRecordComponent },
        ]),
        I18nService,
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMap$.asObservable() },
        },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata,
              getGridMetadata,
              getRecord,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({
                menus: [{ entity_code: 'PRODUCT', label: 'Products' }],
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getRecord).toHaveBeenCalledWith('PRODUCT', 'rec-1');
    expect(fixture.componentInstance.creatingNew).toBeFalse();
    expect(fixture.componentInstance.formValues['sku']).toBe('SKU-1');
  });

  it('exposes record headline helpers and lifecycle flags', async () => {
    getFormMetadata.and.resolveTo({
      schema_version: '1',
      entity_code: 'PRODUCT',
      sections: [
        {
          code: 'main',
          label: 'Main',
          fields: [
            { name: 'sku', label: 'SKU', field_type: 'text', required: true, row: 0, col: 0, span: 6 },
            { name: 'name', label: 'Name', field_type: 'text', required: false, row: 0, col: 6, span: 6 },
          ],
        },
      ],
      conditions: [],
      display: { headline: ['name', 'sku'], status_field: 'active' },
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.formValues = { sku: 'SKU-1', name: 'Widget', active: true, id: 'rec-1' };
    cmp.rebuildForm(cmp.formValues);
    expect(cmp.recordBreadcrumbs().length).toBe(2);
    expect(cmp.canSaveRecord()).toBeTrue();
    expect(cmp.showSystemFields()).toBeFalse();
  });

  it('creates a record from the new form', async () => {
    const createRecord = jasmine.createSpy('createRecord').and.resolveTo({ id: 'rec-new' });
    getFormMetadata.and.resolveTo({
      schema_version: '1',
      entity_code: 'PRODUCT',
      sections: [
        {
          code: 'main',
          label: 'Main',
          fields: [
            {
              name: 'sku',
              label: 'SKU',
              field_type: 'text',
              required: true,
              row: 0,
              col: 0,
              span: 6,
              validation: [{ rule: 'required', message: 'SKU required' }],
            },
          ],
        },
      ],
      conditions: [],
    });
    TestBed.inject(EmcapApiService).client.createRecord = createRecord;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.formValues = { sku: 'NEW-1' };
    cmp.rebuildForm(cmp.formValues);
    await cmp.submitForm();

    expect(createRecord).toHaveBeenCalledWith('PRODUCT', { sku: 'NEW-1' });
  });

  it('loads workflow tab data and supports document preview', async () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ code: 'PRODUCT', recordId: 'rec-1' }));
    const listWorkflowInstances = jasmine.createSpy('listWorkflowInstances').and.resolveTo({
      instances: [{ id: 'wf-1', workflow_code: 'STOCK_ADJUSTMENT', current_state: 'draft', assignee: 'admin' }],
    });
    const uploadDocument = jasmine.createSpy('uploadDocument').and.resolveTo({ id: 'doc-1' });
    const listNotes = jasmine.createSpy('listNotes').and.resolveTo({ notes: [{ body: 'Note' }] });
    const listDocuments = jasmine.createSpy('listDocuments').and.resolveTo({
      documents: [{ id: 'doc-1', filename: 'spec.txt', version: 1, virus_scan_status: 'clean' }],
    });
    const listAudit = jasmine.createSpy('listAudit').and.resolveTo({
      audit: [{ record_id: 'rec-1', action: 'update', payload: { sku: 'A' } }],
    });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([
          { path: 'app/entity/:code', component: EntityRecordComponent },
          { path: 'app/entity/:code/:recordId', component: EntityRecordComponent },
        ]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PRODUCT',
                sections: [
                  {
                    code: 'main',
                    label: 'Main',
                    fields: [
                      { name: 'sku', label: 'SKU', field_type: 'text', required: true, row: 0, col: 0, span: 6 },
                    ],
                  },
                ],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'rec-1',
                sku: 'SKU-1',
                active: true,
                record_version: 1,
              }),
              getPlatformConfig: jasmine
                .createSpy('getPlatformConfig')
                .and.resolveTo({ modules: { workflow: { enabled: true } } }),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listWorkflowInstances,
              listNotes,
              listDocuments,
              listAudit,
              uploadDocument,
              startWorkflow: jasmine.createSpy('startWorkflow').and.resolveTo({}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.showWorkflowTab()).toBeTrue();
    expect(cmp.notes.length).toBe(1);
    expect(cmp.documents.length).toBe(1);
    cmp.previewDocument(cmp.documents[0]);
    expect(cmp.previewingDocument?.filename).toBe('spec.txt');
    cmp.closeDocumentPreview();
    expect(cmp.previewingDocument).toBeNull();
    cmp.uploadDocument();
    expect(uploadDocument).toHaveBeenCalled();
  });

  it('updates an existing record on save', async () => {
    const updateRecord = jasmine.createSpy('updateRecord').and.resolveTo({ id: 'rec-1', sku: 'SKU-2' });
    const paramMap$ = new BehaviorSubject(convertToParamMap({ code: 'PRODUCT', recordId: 'rec-1' }));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([
          { path: 'app/entity/:code', component: EntityRecordComponent },
          { path: 'app/entity/:code/:recordId', component: EntityRecordComponent },
        ]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PRODUCT',
                sections: [
                  {
                    code: 'main',
                    label: 'Main',
                    fields: [
                      { name: 'sku', label: 'SKU', field_type: 'text', required: true, row: 0, col: 0, span: 6 },
                    ],
                  },
                ],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'rec-1',
                sku: 'SKU-1',
                record_version: 3,
              }),
              updateRecord,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.formValues = { ...cmp.formValues, sku: 'SKU-2', record_version: 3 };
    await cmp.submitForm();
    expect(updateRecord).toHaveBeenCalledWith('PRODUCT', 'rec-1', { sku: 'SKU-2' }, 3);
  });

  it('covers delete, restore, cancel, validation, and workflow branches', async () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ code: 'PRODUCT', recordId: 'rec-1' }));
    const deleteRecord = jasmine.createSpy('deleteRecord').and.resolveTo({});
    const restoreRecord = jasmine.createSpy('restoreRecord').and.resolveTo({ id: 'rec-1', sku: 'SKU-1' });
    const startWorkflow = jasmine.createSpy('startWorkflow').and.resolveTo({});
    const listWorkflowInstances = jasmine
      .createSpy('listWorkflowInstances')
      .and.resolveTo({ instances: [{ id: 'wf-1', workflow_code: 'STOCK_ADJUSTMENT', current_state: 'draft', assignee: 'a' }] });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([
          { path: 'app/entity/:code', component: EntityRecordComponent },
          { path: 'app/entity/:code/:recordId', component: EntityRecordComponent },
        ]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PRODUCT',
                sections: [
                  {
                    code: 'main',
                    label: 'Main',
                    fields: [
                      {
                        name: 'sku',
                        label: 'SKU',
                        field_type: 'text',
                        required: true,
                        row: 0,
                        col: 0,
                        span: 6,
                        validation: [{ rule: 'required', message: 'Required' }],
                      },
                    ],
                  },
                ],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'rec-1',
                sku: 'SKU-1',
                active: true,
                deleted_at: null,
                record_version: 1,
              }),
              deleteRecord,
              restoreRecord,
              startWorkflow,
              listWorkflowInstances,
              getPlatformConfig: jasmine
                .createSpy('getPlatformConfig')
                .and.resolveTo({ modules: { workflow: { enabled: true } } }),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.formRenderer).toBeTruthy();

    spyOn(window, 'confirm').and.returnValue(false);
    cmp.deleteRecord();
    expect(deleteRecord).not.toHaveBeenCalled();

    (window.confirm as jasmine.Spy).and.returnValue(true);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    cmp.deleteRecord();
    await fixture.whenStable();
    expect(deleteRecord).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/app/entity', 'PRODUCT']);

    cmp.restoreRecord();
    expect(restoreRecord).toHaveBeenCalled();
    await fixture.whenStable();

    cmp.startWorkflow();
    expect(startWorkflow).toHaveBeenCalled();
    await fixture.whenStable();

    cmp.rebuildForm({ ...cmp.formValues, sku: '' });
    await cmp.submitForm();
    expect(cmp.formError).toMatch(/required/i);

    cmp.onFormFieldChange('sku', 'X');
    expect(cmp.formValues['sku']).toBe('X');

    cmp.cancelEdit();
    expect(cmp.editingId).toBeNull();
  });

  it('rejects invalid metadata and surfaces load failures', async () => {
    getFormMetadata.and.resolveTo({
      schema_version: 'bad',
      entity_code: 'PRODUCT',
      sections: [],
      conditions: [],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toBeTruthy();

    getFormMetadata.and.rejectWith('boom');
    await fixture.componentInstance.loadEntity();
    expect(fixture.componentInstance.loadError).toBeTruthy();
  });

  it('creates record with initial note and navigates to new id', async () => {
    const createRecord = jasmine.createSpy('createRecord').and.resolveTo({ id: 'rec-note' });
    const addNote = jasmine.createSpy('addNote').and.resolveTo({});
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    getFormMetadata.and.resolveTo({
      schema_version: '1',
      entity_code: 'PRODUCT',
      sections: [
        {
          code: 'main',
          label: 'Main',
          fields: [
            { name: 'sku', label: 'SKU', field_type: 'text', required: true, row: 0, col: 0, span: 6 },
          ],
        },
      ],
      conditions: [],
    });
    TestBed.inject(EmcapApiService).client.createRecord = createRecord;
    TestBed.inject(EmcapApiService).client.addNote = addNote;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.noteInput = 'First note';
    cmp.formValues = { sku: 'N-1' };
    cmp.rebuildForm(cmp.formValues);
    await cmp.submitForm();

    expect(addNote).toHaveBeenCalledWith('PRODUCT', 'rec-note', 'First note');
    expect(navigate).toHaveBeenCalledWith(['/app/entity', 'PRODUCT', 'rec-note']);
  });

  it('posts STOCK_MOVEMENT draft and loads movement lines', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'STOCK_MOVEMENT', recordId: 'mov-1' }),
    );
    const updateRecord = jasmine.createSpy('updateRecord').and.resolveTo({ id: 'mov-1', status: 'posted' });
    const listRecords = jasmine.createSpy('listRecords').and.callFake((entityCode: string) => {
      if (entityCode === 'STOCK_MOVEMENT_LINE') {
        return Promise.resolve({
          records: [
            { id: 'line-1', movement_id: 'mov-1', product_id: 'prod-1', quantity: 5, unit_cost: 10 },
            { id: 'line-2', movement_id: 'other', quantity: 1, unit_cost: 1 },
          ],
        });
      }
      if (entityCode === 'PRODUCT') {
        return Promise.resolve({
          records: [{ id: 'prod-1', sku: 'SKU-1', name: 'Widget' }],
        });
      }
      return Promise.resolve({ records: [] });
    });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'STOCK_MOVEMENT',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'mov-1',
                status: 'draft',
                record_version: 2,
              }),
              updateRecord,
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.canPostMovement()).toBeTrue();
    expect(cmp.movementLines.length).toBe(1);

    spyOn(window, 'confirm').and.returnValue(false);
    await cmp.postMovement();
    expect(updateRecord).not.toHaveBeenCalled();

    (window.confirm as jasmine.Spy).and.returnValue(true);
    await cmp.postMovement();
    expect(updateRecord).toHaveBeenCalledWith('STOCK_MOVEMENT', 'mov-1', { status: 'posted' }, 2);
  });

  it('covers postMovement guards, cancelEdit branches, and upload guards', async () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ code: 'PRODUCT', recordId: 'new' }));
    const uploadDocument = jasmine.createSpy('uploadDocument');

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              uploadDocument,
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.creatingNew).toBeTrue();
    expect(cmp.canPostMovement()).toBeFalse();
    await cmp.postMovement();

    cmp.selectedRecordId = null;
    cmp.uploadDocument();
    expect(uploadDocument).not.toHaveBeenCalled();

    cmp.cancelEdit();
    expect(navigate).toHaveBeenCalledWith(['/app/entity', 'PRODUCT']);
  });

  it('clears visible fields when formRenderer is missing on field change', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.formRenderer = null;
    cmp.onFormFieldChange('sku', 'X');
    expect(cmp.visibleFields).toEqual([]);
  });

  it('handles detail load errors and movement line failures', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'STOCK_MOVEMENT', recordId: 'mov-2' }),
    );
    const listNotes = jasmine.createSpy('listNotes').and.rejectWith(new Error('notes down'));
    const listRecords = jasmine.createSpy('listRecords').and.rejectWith(new Error('lines down'));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'STOCK_MOVEMENT',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({ id: 'mov-2', status: 'posted' }),
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes,
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenStable();

    expect(fixture.componentInstance.detailError).toContain('notes down');
    expect(fixture.componentInstance.movementLinesError).toContain('lines down');
  });

  it('covers submitForm errors, postMovement failure, and cancel edit on existing record', async () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ code: 'PRODUCT', recordId: 'rec-1' }));
    const updateRecord = jasmine.createSpy('updateRecord').and.rejectWith(new Error('conflict'));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PRODUCT',
                sections: [
                  {
                    code: 'main',
                    label: 'Main',
                    fields: [
                      { name: 'sku', label: 'SKU', field_type: 'text', required: true, row: 0, col: 0, span: 6 },
                    ],
                  },
                ],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'rec-1',
                sku: 'SKU-1',
                record_version: 1,
              }),
              updateRecord,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.rejectWith(new Error('cfg')),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.formValues = { ...cmp.formValues, sku: 'SKU-2' };
    await cmp.submitForm();
    expect(cmp.formError).toContain('conflict');

    cmp.entityCode = 'STOCK_MOVEMENT';
    cmp.creatingNew = false;
    cmp.selectedRecordId = 'mov-9';
    cmp.formValues = { status: 'draft', record_version: 'bad' };
    spyOn(window, 'confirm').and.returnValue(true);
    updateRecord.and.rejectWith('post failed');
    await cmp.postMovement();
    expect(cmp.postMovementError).toBeTruthy();

    cmp.entityCode = 'PRODUCT';
    cmp.editingId = 'rec-1';
    cmp.cancelEdit();
    await fixture.whenStable();
    expect(cmp.editingId).toBeNull();
  });

  it('guards restore, delete, startWorkflow, and workflow instance load failure', async () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ code: 'PRODUCT', recordId: 'rec-1' }));
    const listWorkflowInstances = jasmine.createSpy('listWorkflowInstances').and.rejectWith(new Error('wf'));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PRODUCT',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({ id: 'rec-1', active: true }),
              getPlatformConfig: jasmine
                .createSpy('getPlatformConfig')
                .and.resolveTo({ modules: { workflow: { enabled: true } } }),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
              listWorkflowInstances,
              startWorkflow: jasmine.createSpy('startWorkflow').and.resolveTo({}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    const prevId = cmp.selectedRecordId;
    cmp.selectedRecordId = null;
    cmp.restoreRecord();
    cmp.deleteRecord();
    cmp.startWorkflow();
    cmp.selectedRecordId = prevId;
    expect(cmp.showSystemFields()).toBeTrue();
    expect(cmp.workflowInstances).toEqual([]);
  });

  it('submitForm returns early when renderer is missing', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.formRenderer = null;
    await cmp.submitForm();
    expect(cmp.formError).toBe('');
  });

  it('skips hidden and read-only fields on submit and handles create without id', async () => {
    getFormMetadata.and.resolveTo({
      schema_version: '1',
      entity_code: 'PRODUCT',
      sections: [
        {
          code: 'main',
          label: 'Main',
          fields: [
            {
              name: 'sku',
              label: 'SKU',
              field_type: 'text',
              required: true,
              read_only: true,
              row: 0,
              col: 0,
              span: 6,
            },
            {
              name: 'note',
              label: 'Note',
              field_type: 'text',
              required: false,
              row: 0,
              col: 6,
              span: 6,
            },
          ],
        },
      ],
      conditions: [
        { field: 'show', operator: 'equals', value: true, action: 'show', targets: ['note'] },
      ],
    });
    const createRecord = jasmine.createSpy('createRecord').and.resolveTo({});
    TestBed.inject(EmcapApiService).client.createRecord = createRecord;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.rebuildForm({ show: false, note: 'hidden' });
    cmp.editingId = null;
    await cmp.submitForm();
    expect(createRecord).toHaveBeenCalledWith('PRODUCT', {});
  });

  it('adds note on create and guards postMovement confirm', async () => {
    const addNote = jasmine.createSpy('addNote').and.resolveTo({});
    const createRecord = jasmine.createSpy('createRecord').and.resolveTo({ id: 'rec-note' });
    TestBed.inject(EmcapApiService).client.createRecord = createRecord;
    TestBed.inject(EmcapApiService).client.addNote = addNote;
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.noteInput = '  first note  ';
    cmp.formValues = { ...cmp.formValues, sku: 'NEW-SKU' };
    cmp.editingId = null;
    await cmp.submitForm();
    expect(addNote).toHaveBeenCalledWith('PRODUCT', 'rec-note', 'first note');

    cmp.entityCode = 'STOCK_MOVEMENT';
    cmp.selectedRecordId = 'mov-1';
    cmp.formValues = { status: 'draft', record_version: 1 };
    spyOn(window, 'confirm').and.returnValue(false);
    await cmp.postMovement();
    expect(cmp.postingMovement).toBeFalse();
  });

  it('surfaces non-Error load failures', async () => {
    TestBed.inject(EmcapApiService).client.getFormMetadata = jasmine
      .createSpy('getFormMetadata')
      .and.rejectWith('metadata down');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toBeTruthy();
  });

  it('cancelEdit navigates back when creating or not editing', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    cmp.cancelEdit();
    expect(navigate).toHaveBeenCalledWith(['/app/entity', 'PRODUCT']);

    cmp.creatingNew = false;
    cmp.selectedRecordId = 'rec-1';
    cmp.editingId = null;
    cmp.cancelEdit();
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it('surfaces non-Error save and detail load failures', async () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ code: 'PRODUCT', recordId: 'rec-1' }));
    const updateRecord = jasmine.createSpy('updateRecord').and.rejectWith('save down');
    const listNotes = jasmine.createSpy('listNotes').and.rejectWith('detail down');

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PRODUCT',
                sections: [
                  {
                    code: 'main',
                    label: 'Main',
                    fields: [
                      { name: 'sku', label: 'SKU', field_type: 'text', required: true, row: 0, col: 0, span: 6 },
                    ],
                  },
                ],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'rec-1',
                sku: 'SKU-1',
                record_version: 1,
              }),
              updateRecord,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes,
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.formValues = { ...cmp.formValues, sku: 'SKU-2', record_version: 1 };
    await cmp.submitForm();
    expect(cmp.formError).toBe('Save failed');

    await cmp.loadRecordDetail('rec-1');
    expect(cmp.detailError).toBe('Failed to load record');
  });

  it('guards upload, field change without renderer, and post movement failure', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'STOCK_MOVEMENT', recordId: 'mov-2' }),
    );
    const updateRecord = jasmine.createSpy('updateRecord').and.rejectWith(new Error('post down'));
    const listRecords = jasmine.createSpy('listRecords').and.resolveTo({ records: [] });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'STOCK_MOVEMENT',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'mov-2',
                status: 'draft',
                record_version: 'n/a',
              }),
              updateRecord,
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
              uploadDocument: jasmine.createSpy('uploadDocument'),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    const prevId = cmp.selectedRecordId;
    cmp.selectedRecordId = null;
    cmp.uploadDocument();
    expect(TestBed.inject(EmcapApiService).client.uploadDocument).not.toHaveBeenCalled();
    cmp.selectedRecordId = prevId;

    cmp.formRenderer = null;
    cmp.onFormFieldChange('status', 'posted');
    expect(cmp.visibleFields).toEqual([]);

    cmp.entityCode = 'STOCK_MOVEMENT';
    cmp.creatingNew = false;
    cmp.selectedRecordId = 'mov-2';
    cmp.formValues = { status: 'draft', record_version: 1 };
    spyOn(window, 'confirm').and.returnValue(true);
    await cmp.postMovement();
    await fixture.whenStable();
    expect(cmp.postMovementError).toContain('post down');
  });

  it('renders movement line grid with product labels, costs, and totals', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'STOCK_MOVEMENT', recordId: 'mov-1' }),
    );
    const listRecords = jasmine.createSpy('listRecords').and.callFake((entityCode: string) => {
      if (entityCode === 'STOCK_MOVEMENT_LINE') {
        return Promise.resolve({
          records: [
            {
              id: 'line-1',
              movement_id: 'mov-1',
              product_id: 'prod-1',
              quantity: 2,
              unit_cost: 5,
            },
          ],
        });
      }
      return Promise.resolve({
        records: [{ id: 'prod-1', sku: 'SKU-1', name: 'Demo widget' }],
      });
    });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable(), queryParamMap: new BehaviorSubject(convertToParamMap({})).asObservable(), snapshot: { queryParamMap: convertToParamMap({}) } } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'STOCK_MOVEMENT',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'mov-1',
                status: 'draft',
                record_version: 1,
              }),
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Demo widget');
    expect(text).toContain('Line total');
    expect(text).toContain('Totals');
    expect(fixture.componentInstance.movementLinesCostTotalLabel()).toContain('10.00');
  });

  it('shows restore action for soft-deleted records in the header', async () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ code: 'PRODUCT', recordId: 'rec-del' }));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
            queryParamMap: new BehaviorSubject(convertToParamMap({})).asObservable(),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PRODUCT',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'rec-del',
                sku: 'SKU-D',
                deleted_at: '2026-06-01T12:00:00Z',
                record_version: 1,
              }),
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.canRestoreRecord()).toBeTrue();
    const restoreBtn = fixture.nativeElement.querySelector('button mat-icon');
    expect(fixture.nativeElement.textContent).toContain('Restore');
    expect(restoreBtn?.textContent?.trim()).toBe('restore');
  });

  it('navigates to add movement line with movement_id query param', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'STOCK_MOVEMENT', recordId: 'mov-1' }),
    );

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
            queryParamMap: new BehaviorSubject(convertToParamMap({})).asObservable(),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'STOCK_MOVEMENT',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'mov-1',
                status: 'draft',
                record_version: 1,
              }),
              listRecords: jasmine.createSpy('listRecords').and.resolveTo({ records: [] }),
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.addMovementLine();
    expect(navigate).toHaveBeenCalledWith(['/app/entity', 'STOCK_MOVEMENT_LINE', 'new'], {
      queryParams: { movement_id: 'mov-1' },
    });
  });

  it('prefills movement_id when creating STOCK_MOVEMENT_LINE from parent movement', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'STOCK_MOVEMENT_LINE', recordId: 'new' }),
    );
    const queryParamMap$ = new BehaviorSubject(convertToParamMap({ movement_id: 'mov-parent' }));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
            queryParamMap: queryParamMap$.asObservable(),
            snapshot: { queryParamMap: convertToParamMap({ movement_id: 'mov-parent' }) },
          },
        },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'STOCK_MOVEMENT_LINE',
                sections: [
                  {
                    code: 'main',
                    label: 'Main',
                    fields: [
                      {
                        name: 'movement_id',
                        label: 'Movement',
                        field_type: 'lookup',
                        required: true,
                        row: 0,
                        col: 0,
                        span: 6,
                      },
                    ],
                  },
                ],
                conditions: [],
              }),
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.formValues['movement_id']).toBe('mov-parent');
  });

  it('loads PO order lines, payment summary, vendor payments, and receives goods', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'PURCHASE_ORDER', recordId: 'po-1' }),
    );
    const updateRecord = jasmine.createSpy('updateRecord').and.resolveTo({ id: 'po-1', status: 'received' });
    const listRecords = jasmine.createSpy('listRecords').and.callFake((entityCode: string) => {
      if (entityCode === 'PURCHASE_ORDER_LINE') {
        return Promise.resolve({
          records: [
            { id: 'pol-1', po_id: 'po-1', product_id: 'prod-1', quantity: 2, unit_price: 50 },
            { id: 'pol-2', po_id: 'other', quantity: 1, unit_price: 1 },
          ],
        });
      }
      if (entityCode === 'VENDOR_PAYMENT') {
        return Promise.resolve({
          records: [
            { id: 'vp-1', po_id: 'po-1', payment_number: 'VP-1', amount: 25, status: 'posted' },
          ],
        });
      }
      if (entityCode === 'PRODUCT') {
        return Promise.resolve({ records: [{ id: 'prod-1', name: 'Part A' }] });
      }
      return Promise.resolve({ records: [] });
    });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PURCHASE_ORDER',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'po-1',
                status: 'draft',
                total_amount: 100,
                amount_paid: 25,
                balance_due: 75,
                record_version: 3,
              }),
              updateRecord,
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.orderLines.length).toBe(1);
    expect(cmp.vendorPayments.length).toBe(1);
    expect(cmp.canReceivePurchaseOrder()).toBeTrue();
    expect(cmp.canRecordVendorPayment()).toBeTrue();
    expect(cmp.paymentSummaryLabels().balance).toContain('75');

    spyOn(window, 'confirm').and.returnValue(false);
    await cmp.receivePurchaseOrder();
    expect(updateRecord).not.toHaveBeenCalled();

    (window.confirm as jasmine.Spy).and.returnValue(true);
    await cmp.receivePurchaseOrder();
    expect(updateRecord).toHaveBeenCalledWith('PURCHASE_ORDER', 'po-1', { status: 'received' }, 3);
  });

  it('covers PO/SO line guards, invoice payment CTA, and create prefills', async () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.canAddOrderLine()).toBeFalse();
    expect(cmp.canReceivePurchaseOrder()).toBeFalse();
    expect(cmp.showPaymentSummary()).toBeFalse();

    cmp.entityCode = 'PURCHASE_ORDER';
    cmp.selectedRecordId = 'po-1';
    cmp.creatingNew = false;
    cmp.formValues = { status: 'draft' };
    cmp.orderLines = [{ id: 'l1' }];
    expect(cmp.canAddOrderLine()).toBeTrue();
    cmp.addOrderLine();
    expect(navigate).toHaveBeenCalledWith(['/app/entity', 'PURCHASE_ORDER_LINE', 'new'], {
      queryParams: { po_id: 'po-1' },
    });

    cmp.entityCode = 'SALES_ORDER';
    cmp.formValues = { status: 'draft' };
    cmp.addOrderLine();
    expect(navigate).toHaveBeenCalledWith(['/app/entity', 'SALES_ORDER_LINE', 'new'], {
      queryParams: { sales_order_id: 'po-1' },
    });

    cmp.entityCode = 'INVOICE';
    cmp.formValues = { status: 'sent', amount: 200, amount_paid: 50, balance_due: 150 };
    expect(cmp.showPaymentSummary()).toBeTrue();
    expect(cmp.canRecordCustomerPayment()).toBeTrue();
    cmp.recordCustomerPayment();
    expect(navigate).toHaveBeenCalledWith(['/app/entity', 'CUSTOMER_PAYMENT', 'new'], {
      queryParams: { invoice_id: 'po-1' },
    });

    cmp.creatingNew = true;
    cmp.entityCode = 'VENDOR_PAYMENT';
    const route = TestBed.inject(ActivatedRoute);
    Object.assign(route.snapshot, { queryParamMap: convertToParamMap({ po_id: 'po-99' }) });
    cmp['applyCreatePrefill']();
    expect(cmp.formValues['po_id']).toBe('po-99');
  });

  it('handles order line and payment load failures on PO', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'PURCHASE_ORDER', recordId: 'po-err' }),
    );
    const listRecords = jasmine.createSpy('listRecords').and.callFake((entityCode: string) => {
      if (entityCode === 'PURCHASE_ORDER_LINE') {
        return Promise.reject(new Error('lines down'));
      }
      if (entityCode === 'VENDOR_PAYMENT') {
        return Promise.reject(new Error('payments down'));
      }
      return Promise.resolve({ records: [] });
    });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PURCHASE_ORDER',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'po-err',
                status: 'submitted',
                record_version: 1,
              }),
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.orderLinesError).toContain('lines down');
    expect(cmp.vendorPaymentsError).toContain('payments down');
    expect(cmp.orderLinesFooter()).toBeNull();
  });

  it('renders PO payment summary, order lines, and vendor payments in the DOM', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'PURCHASE_ORDER', recordId: 'po-dom' }),
    );
    const listRecords = jasmine.createSpy('listRecords').and.callFake((entityCode: string) => {
      if (entityCode === 'PURCHASE_ORDER_LINE') {
        return Promise.resolve({
          records: [{ id: 'pol-1', po_id: 'po-dom', product_id: 'prod-1', quantity: 1, unit_price: 80 }],
        });
      }
      if (entityCode === 'VENDOR_PAYMENT') {
        return Promise.resolve({
          records: [
            {
              id: 'vp-1',
              po_id: 'po-dom',
              payment_number: 'VP-DOM',
              amount: 20,
              payment_date: '2026-02-01',
              status: 'posted',
            },
          ],
        });
      }
      if (entityCode === 'PRODUCT') {
        return Promise.resolve({ records: [{ id: 'prod-1', name: 'Bolt' }] });
      }
      return Promise.resolve({ records: [] });
    });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PURCHASE_ORDER',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'po-dom',
                status: 'draft',
                total_amount: 80,
                amount_paid: 20,
                balance_due: 60,
                record_version: 1,
              }),
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({
                organization_profile: { currency: 'USD', locale: 'en-US' },
              }),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Payment summary');
    expect(text).toContain('Vendor payments');
    expect(text).toContain('VP-DOM');
    expect(text).toContain('Bolt');
    expect(fixture.nativeElement.querySelectorAll('app-child-lines-section').length).toBeGreaterThanOrEqual(2);
  });

  it('loads SO order lines and renders child-lines section', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'SALES_ORDER', recordId: 'so-1' }),
    );
    const listRecords = jasmine.createSpy('listRecords').and.callFake((entityCode: string) => {
      if (entityCode === 'SALES_ORDER_LINE') {
        return Promise.resolve({
          records: [{ id: 'sol-1', sales_order_id: 'so-1', product_id: 'prod-2', quantity: 3, unit_price: 15 }],
        });
      }
      if (entityCode === 'PRODUCT') {
        return Promise.resolve({ records: [{ id: 'prod-2', name: 'Cable' }] });
      }
      return Promise.resolve({ records: [] });
    });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'SALES_ORDER',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'so-1',
                status: 'draft',
                record_version: 1,
              }),
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Order lines');
    expect(text).toContain('Cable');
    expect(fixture.componentInstance.orderLinesFooter()?.cells[2]).toContain('45.00');
  });

  it('loads INVOICE customer payments, summary, and customer payment section', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'INVOICE', recordId: 'inv-1' }),
    );
    const listRecords = jasmine.createSpy('listRecords').and.callFake((entityCode: string) => {
      if (entityCode === 'CUSTOMER_PAYMENT') {
        return Promise.resolve({
          records: [
            {
              id: 'cp-1',
              invoice_id: 'inv-1',
              payment_number: 'CP-100',
              amount: 150,
              payment_date: '2026-04-10',
              status: 'posted',
            },
          ],
        });
      }
      return Promise.resolve({ records: [] });
    });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'INVOICE',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'inv-1',
                status: 'partial',
                amount: 500,
                amount_paid: 150,
                balance_due: 350,
                record_version: 1,
              }),
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({
                organization_profile: { currency: 'USD' },
              }),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    expect(cmp.customerPayments.length).toBe(1);
    expect(cmp.showCustomerPaymentsSection()).toBeTrue();
    expect(cmp.paymentSummaryLabels().balance).toContain('350');

    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Customer payments');
    expect(text).toContain('CP-100');
    expect(text).toContain('Record receipt');
  });

  it('prints INVOICE with organization header and footer templates', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'INVOICE', recordId: 'inv-print' }),
    );
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'INVOICE',
                sections: [
                  {
                    code: 'main',
                    label: 'Main',
                    fields: [{ name: 'invoice_number', label: 'Invoice #', field_type: 'text', required: true, row: 1, col: 1, span: 1 }],
                  },
                ],
                conditions: [],
                display: { headline: { code_field: 'invoice_number' } },
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'inv-print',
                invoice_number: 'INV-9001',
                status: 'sent',
                amount: 100,
                record_version: 1,
              }),
              listRecords: jasmine.createSpy('listRecords').and.resolveTo({ records: [] }),
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({
                organization_profile: {
                  display_name: 'Acme Widgets',
                  invoice: { header: '{{display_name}}', footer: 'Thank you' },
                },
              }),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    const doc = { write: jasmine.createSpy('write'), close: jasmine.createSpy('close') };
    spyOn(window, 'open').and.returnValue({ document: doc, print: jasmine.createSpy('print') } as unknown as Window);

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    expect(cmp.canPrintInvoice()).toBeTrue();
    cmp.printInvoice();
    const html = doc.write.calls.mostRecent().args[0] as string;
    expect(html).toContain('Acme Widgets');
    expect(html).toContain('Thank you');
    expect(html).toContain('INV-9001');
  });

  it('guards vendor and customer payment navigation and receive PO', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    cmp.recordVendorPayment();
    cmp.recordCustomerPayment();
    expect(navigate).not.toHaveBeenCalled();

    cmp.entityCode = 'PURCHASE_ORDER';
    cmp.selectedRecordId = 'po-1';
    cmp.creatingNew = false;
    cmp.formValues = { status: 'cancelled', balance_due: 50 };
    expect(cmp.canRecordVendorPayment()).toBeFalse();
    cmp.recordVendorPayment();
    expect(navigate).not.toHaveBeenCalled();

    cmp.formValues = { status: 'paid', balance_due: 0 };
    expect(cmp.canRecordCustomerPayment()).toBeFalse();

    cmp.entityCode = 'INVOICE';
    cmp.formValues = { status: 'void', balance_due: 10 };
    expect(cmp.canRecordCustomerPayment()).toBeFalse();
    cmp.formValues = { status: 'paid', balance_due: 0 };
    expect(cmp.canRecordCustomerPayment()).toBeFalse();

    cmp.entityCode = 'PURCHASE_ORDER';
    cmp.formValues = { status: 'received' };
    cmp.orderLines = [];
    await cmp.receivePurchaseOrder();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('prefills PO line, SO line, and customer payment create forms from query params', async () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ code: 'PURCHASE_ORDER_LINE', recordId: 'new' }));
    const queryParamMap$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
            queryParamMap: queryParamMap$.asObservable(),
            snapshot: { queryParamMap: convertToParamMap({ po_id: 'po-prefill' }) },
          },
        },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PURCHASE_ORDER_LINE',
                sections: [
                  {
                    code: 'main',
                    label: 'Main',
                    fields: [{ name: 'po_id', label: 'PO', field_type: 'lookup', required: true, row: 0, col: 0, span: 6 }],
                  },
                ],
                conditions: [],
              }),
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.formValues['po_id']).toBe('po-prefill');

    const cmp = fixture.componentInstance;
    Object.assign(TestBed.inject(ActivatedRoute).snapshot, {
      queryParamMap: convertToParamMap({ sales_order_id: 'so-88' }),
    });
    cmp.entityCode = 'SALES_ORDER_LINE';
    cmp.creatingNew = true;
    cmp['applyCreatePrefill']();
    expect(cmp.formValues['sales_order_id']).toBe('so-88');

    Object.assign(TestBed.inject(ActivatedRoute).snapshot, {
      queryParamMap: convertToParamMap({ invoice_id: 'inv-55' }),
    });
    cmp.entityCode = 'CUSTOMER_PAYMENT';
    cmp['applyCreatePrefill']();
    expect(cmp.formValues['invoice_id']).toBe('inv-55');
  });

  it('surfaces non-Error receive PO failure and SO line add guard', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'PURCHASE_ORDER', recordId: 'po-fail' }),
    );
    const updateRecord = jasmine.createSpy('updateRecord').and.rejectWith('receive down');

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'PURCHASE_ORDER',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'po-fail',
                status: 'draft',
                record_version: 1,
              }),
              updateRecord,
              listRecords: jasmine.createSpy('listRecords').and.resolveTo({
                records: [{ id: 'pol-1', po_id: 'po-fail', product_id: 'p1', quantity: 1, unit_price: 1 }],
              }),
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    spyOn(window, 'confirm').and.returnValue(true);
    await cmp.receivePurchaseOrder();
    expect(cmp.receivePoError).toBeTruthy();

    cmp.entityCode = 'SALES_ORDER';
    cmp.selectedRecordId = 'so-1';
    cmp.creatingNew = false;
    cmp.formValues = { status: 'confirmed' };
    cmp.orderLines = [];
    expect(cmp.canAddOrderLine()).toBeFalse();
    expect(cmp.orderLinesFooter()).toBeNull();
  });

  it('handles customer payment load failure on INVOICE', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'INVOICE', recordId: 'inv-err' }),
    );
    const listRecords = jasmine.createSpy('listRecords').and.callFake((entityCode: string) => {
      if (entityCode === 'CUSTOMER_PAYMENT') {
        return Promise.reject(new Error('customer payments down'));
      }
      return Promise.resolve({ records: [] });
    });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'INVOICE',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'inv-err',
                status: 'sent',
                amount: 100,
                balance_due: 100,
                record_version: 1,
              }),
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.customerPaymentsError).toContain('customer payments down');
  });

  it('loads journal entry lines, posts draft entry, and navigates to add line', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'JOURNAL_ENTRY', recordId: 'je-1' }),
    );
    const updateRecord = jasmine.createSpy('updateRecord').and.resolveTo({ id: 'je-1', status: 'posted' });
    const listRecords = jasmine.createSpy('listRecords').and.callFake((entityCode: string) => {
      if (entityCode === 'JOURNAL_ENTRY_LINE') {
        return Promise.resolve({
          records: [
            { id: 'jel-1', journal_entry_id: 'je-1', account_id: 'acct-1', debit: 100, credit: 0 },
            { id: 'jel-2', journal_entry_id: 'je-1', account_id: 'acct-2', debit: 0, credit: 100 },
            { id: 'jel-3', journal_entry_id: 'other', debit: 1, credit: 0 },
          ],
        });
      }
      if (entityCode === 'ACCOUNT') {
        return Promise.resolve({
          records: [
            { id: 'acct-1', code: '1000', name: 'Cash' },
            { id: 'acct-2', code: '2000', name: 'Payables' },
          ],
        });
      }
      return Promise.resolve({ records: [] });
    });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([
          { path: 'app/entity/:code/:recordId', component: EntityRecordComponent },
        ]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'JOURNAL_ENTRY',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'je-1',
                reference: 'JE-001',
                status: 'draft',
                record_version: 4,
              }),
              updateRecord,
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.journalLines.length).toBe(2);
    expect(cmp.canPostJournal()).toBeTrue();
    expect(cmp.canVoidJournal()).toBeFalse();
    expect(cmp.canAddJournalLine()).toBeTrue();
    expect(cmp.journalLineColumns()[0].cell(cmp.journalLines[0])).toBe('Cash');

    cmp.addJournalLine();
    expect(navigate).toHaveBeenCalledWith(['/app/entity', 'JOURNAL_ENTRY_LINE', 'new'], {
      queryParams: { journal_entry_id: 'je-1' },
    });

    spyOn(window, 'confirm').and.returnValue(false);
    await cmp.postJournal();
    expect(updateRecord).not.toHaveBeenCalled();

    (window.confirm as jasmine.Spy).and.returnValue(true);
    await cmp.postJournal();
    expect(updateRecord).toHaveBeenCalledWith('JOURNAL_ENTRY', 'je-1', { status: 'posted' }, 4);
  });

  it('voids posted journal entry and guards post/void when not applicable', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'JOURNAL_ENTRY', recordId: 'je-posted' }),
    );
    const updateRecord = jasmine.createSpy('updateRecord').and.resolveTo({ id: 'je-posted', status: 'void' });
    const listRecords = jasmine.createSpy('listRecords').and.callFake((entityCode: string) => {
      if (entityCode === 'JOURNAL_ENTRY_LINE') {
        return Promise.resolve({
          records: [
            { id: 'jel-1', journal_entry_id: 'je-posted', account_id: 'acct-1', debit: 50, credit: 0 },
            { id: 'jel-2', journal_entry_id: 'je-posted', account_id: 'acct-2', debit: 0, credit: 50 },
          ],
        });
      }
      if (entityCode === 'ACCOUNT') {
        return Promise.resolve({ records: [{ id: 'acct-1', name: 'Cash' }] });
      }
      return Promise.resolve({ records: [] });
    });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'JOURNAL_ENTRY',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'je-posted',
                status: 'posted',
                record_version: 2,
              }),
              updateRecord,
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.canPostJournal()).toBeFalse();
    expect(cmp.canVoidJournal()).toBeTrue();
    expect(cmp.canAddJournalLine()).toBeFalse();
    expect(cmp.journalLinesFooter()).not.toBeNull();

    spyOn(window, 'confirm').and.returnValue(false);
    await cmp.voidJournal();
    expect(updateRecord).not.toHaveBeenCalled();

    (window.confirm as jasmine.Spy).and.returnValue(true);
    await cmp.voidJournal();
    expect(updateRecord).toHaveBeenCalledWith('JOURNAL_ENTRY', 'je-posted', { status: 'void' }, 2);

    cmp.entityCode = 'PRODUCT';
    expect(cmp.showJournalLinesSection()).toBeFalse();
    await cmp.postJournal();
    await cmp.voidJournal();
    cmp.addJournalLine();
  });

  it('handles journal line load failure and post/void API errors', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'JOURNAL_ENTRY', recordId: 'je-err' }),
    );
    const updateRecord = jasmine
      .createSpy('updateRecord')
      .and.rejectWith(new Error('post down'));
    const listRecords = jasmine.createSpy('listRecords').and.rejectWith(new Error('lines down'));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'JOURNAL_ENTRY',
                sections: [{ code: 'main', label: 'Main', fields: [] }],
                conditions: [],
              }),
              getRecord: jasmine.createSpy('getRecord').and.resolveTo({
                id: 'je-err',
                status: 'draft',
                record_version: 1,
              }),
              updateRecord,
              listRecords,
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
              listNotes: jasmine.createSpy('listNotes').and.resolveTo({ notes: [] }),
              listDocuments: jasmine.createSpy('listDocuments').and.resolveTo({ documents: [] }),
              listAudit: jasmine.createSpy('listAudit').and.resolveTo({ audit: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.journalLinesError).toContain('lines down');
    expect(cmp.journalLinesFooter()).toBeNull();

    spyOn(window, 'confirm').and.returnValue(true);
    await cmp.postJournal();
    expect(cmp.postJournalError).toContain('post down');

    cmp.formValues = { ...cmp.formValues, status: 'posted' };
    updateRecord.and.rejectWith(new Error('void down'));
    await cmp.voidJournal();
    expect(cmp.voidJournalError).toContain('void down');
  });

  it('prefills journal_entry_id when creating JOURNAL_ENTRY_LINE from parent entry', async () => {
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'JOURNAL_ENTRY_LINE', recordId: 'new' }),
    );
    const queryParamMap$ = new BehaviorSubject(convertToParamMap({ journal_entry_id: 'je-parent' }));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EntityRecordComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
            queryParamMap: queryParamMap$.asObservable(),
            snapshot: { queryParamMap: convertToParamMap({ journal_entry_id: 'je-parent' }) },
          },
        },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getFormMetadata: jasmine.createSpy('getFormMetadata').and.resolveTo({
                schema_version: '1',
                entity_code: 'JOURNAL_ENTRY_LINE',
                sections: [
                  {
                    code: 'main',
                    label: 'Main',
                    fields: [
                      {
                        name: 'journal_entry_id',
                        label: 'Journal entry',
                        field_type: 'lookup',
                        required: true,
                        row: 0,
                        col: 0,
                        span: 6,
                      },
                    ],
                  },
                ],
                conditions: [],
              }),
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({}),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRecordComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.formValues['journal_entry_id']).toBe('je-parent');
  });
});
