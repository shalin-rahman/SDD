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
    getFormMetadata = jasmine.createSpy('getFormMetadata').and.resolveTo({
      schema_version: '1',
      entity_code: 'PRODUCT',
      sections: [{ code: 'main', label: 'Main', fields: [] }],
      conditions: [],
    });
    const paramMap$ = new BehaviorSubject(
      convertToParamMap({ code: 'PRODUCT', recordId: 'new' }),
    );

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
    const listRecords = jasmine.createSpy('listRecords').and.resolveTo({
      records: [
        { id: 'line-1', movement_id: 'mov-1', qty: 5 },
        { id: 'line-2', movement_id: 'other', qty: 1 },
      ],
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
});
