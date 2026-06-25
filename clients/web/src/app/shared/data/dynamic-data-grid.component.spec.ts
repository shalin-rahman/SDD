import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicGridRenderer } from '../../metadata/dynamic-grid.renderer';
import type { GridMetadata } from '../../metadata/contract';
import { I18nService } from '../services/i18n.service';
import { DynamicDataGridComponent } from './dynamic-data-grid.component';

const GRID_META: GridMetadata = {
  schema_version: '1',
  entity_code: 'PRODUCT',
  columns: [
    { field: 'sku', label: 'SKU', sortable: true, filterable: true },
    { field: 'name', label: 'Name', sortable: true, filterable: true },
  ],
  export: { csv: false, excel: false, pdf: false },
  grouping: false,
  realtime: false,
  offline: false,
};

describe('DynamicDataGridComponent keyboard navigation', () => {
  let fixture: ComponentFixture<DynamicDataGridComponent>;
  let component: DynamicDataGridComponent;
  let recordSelect: jasmine.Spy;

  const records = [
    { id: 'r1', sku: 'A-1', name: 'Alpha' },
    { id: 'r2', sku: 'B-2', name: 'Beta' },
  ];

  beforeEach(async () => {
    recordSelect = jasmine.createSpy('recordSelect');
    await TestBed.configureTestingModule({
      imports: [DynamicDataGridComponent],
      providers: [I18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicDataGridComponent);
    component = fixture.componentInstance;
    component.gridRenderer = new DynamicGridRenderer(GRID_META, 'en');
    component.columnFields = component.gridRenderer.columnFields();
    component.displayGroups = [{ key: '', records }];
    component.recordSelect.subscribe(recordSelect);
    fixture.detectChanges();
  });

  it('moves focus down with ArrowDown', () => {
    component.focusedRowIndex = 0;
    component.handleGridKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.focusedRowIndex).toBe(1);
  });

  it('moves focus up with ArrowUp', () => {
    component.focusedRowIndex = 1;
    component.handleGridKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(component.focusedRowIndex).toBe(0);
  });

  it('emits recordSelect on Enter for focused row', () => {
    component.focusedRowIndex = 1;
    component.handleGridKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(recordSelect).toHaveBeenCalledWith(records[1]);
  });

  it('does not move focus below last row', () => {
    component.focusedRowIndex = 1;
    component.handleGridKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.focusedRowIndex).toBe(1);
  });

  it('tracks bulk selection on the current page', () => {
    component.bulkActions = true;
    component.selectedRecordIds = ['r1'];
    fixture.detectChanges();

    expect(component.isSelected(records[0])).toBeTrue();
    expect(component.allPageSelected).toBeFalse();

    component.selectedRecordIds = ['r1', 'r2'];
    expect(component.allPageSelected).toBeTrue();
    expect(component.selectedCount).toBe(2);
  });

  it('exposes export menu when any export format is enabled', () => {
    expect(component.hasExportOptions).toBeFalse();
    component.exportCsv = true;
    expect(component.hasExportOptions).toBeTrue();
  });
});
