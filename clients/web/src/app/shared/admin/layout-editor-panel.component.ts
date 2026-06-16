import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../services/i18n.service';

const SYSTEM_GRID_FIELDS = new Set([
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'record_version',
]);

interface FormFieldRow {
  name: string;
  row: number;
  col: number;
  span: number;
}

interface GridColumnRow {
  field: string;
  label: string;
  sortable: boolean;
  filterable: boolean;
  width: number | null;
}

@Component({
  selector: 'app-layout-editor-panel',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
  ],
  templateUrl: './layout-editor-panel.component.html',
  styleUrl: './layout-editor-panel.component.scss',
})
export class LayoutEditorPanelComponent implements OnInit {
  private readonly api = inject(EmcapApiService);
  readonly i18n = inject(I18nService);

  entities: string[] = [];
  selectedEntity = 'PRODUCT';
  loading = false;
  status = '';
  hasOverride = false;
  formFields: FormFieldRow[] = [];
  gridColumns: GridColumnRow[] = [];

  async ngOnInit(): Promise<void> {
    const payload = await this.api.client.listEntities();
    this.entities = payload.entities ?? [];
    if (this.entities.length > 0 && !this.entities.includes(this.selectedEntity)) {
      this.selectedEntity = this.entities[0];
    }
    await this.loadLayout();
  }

  async onEntityChange(entityCode: string): Promise<void> {
    this.selectedEntity = entityCode;
    await this.loadLayout();
  }

  async loadLayout(): Promise<void> {
    if (!this.selectedEntity) {
      return;
    }
    this.loading = true;
    this.status = '';
    try {
      const payload = await this.api.client.getAdminLayoutMetadata(this.selectedEntity);
      this.hasOverride = payload.has_override;
      const main = payload.form.sections.find((section) => section.code === 'main');
      this.formFields = (main?.fields ?? []).map((field) => ({
        name: field.name,
        row: field.row,
        col: field.col,
        span: field.span,
      }));
      this.gridColumns = payload.grid.columns
        .filter((column) => !SYSTEM_GRID_FIELDS.has(column.field))
        .map((column) => ({
          field: column.field,
          label: column.label,
          sortable: column.sortable,
          filterable: column.filterable,
          width: column.width ?? null,
        }));
    } catch (err) {
      this.status = err instanceof Error ? err.message : this.i18n.t('settings.layouts.loadFailed');
    } finally {
      this.loading = false;
    }
  }

  moveColumn(index: number, delta: number): void {
    const target = index + delta;
    if (target < 0 || target >= this.gridColumns.length) {
      return;
    }
    const copy = [...this.gridColumns];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    this.gridColumns = copy;
  }

  async saveLayout(): Promise<void> {
    this.status = '';
    try {
      await this.api.client.putAdminLayoutOverride(this.selectedEntity, {
        form: {
          sections: [
            {
              code: 'main',
              fields: this.formFields.map((field) => ({
                name: field.name,
                row: field.row,
                col: field.col,
                span: field.span,
              })),
            },
          ],
        },
        grid: {
          columns: this.gridColumns.map((column) => ({
            field: column.field,
            sortable: column.sortable,
            filterable: column.filterable,
            ...(column.width != null ? { width: column.width } : {}),
          })),
        },
      });
      this.hasOverride = true;
      this.status = this.i18n.t('settings.layouts.saved');
      await this.loadLayout();
    } catch (err) {
      this.status = err instanceof Error ? err.message : this.i18n.t('settings.layouts.saveFailed');
    }
  }

  async resetLayout(): Promise<void> {
    this.status = '';
    try {
      await this.api.client.deleteAdminLayoutOverride(this.selectedEntity);
      this.hasOverride = false;
      this.status = this.i18n.t('settings.layouts.reset');
      await this.loadLayout();
    } catch (err) {
      this.status = err instanceof Error ? err.message : this.i18n.t('settings.layouts.resetFailed');
    }
  }
}
