import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { tenantId, tenantLabel } from '../utils/tenant.util';

@Component({
  selector: 'app-tenant-select',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './tenant-select.component.html',
  styleUrl: './tenant-select.component.scss',
})
export class TenantSelectComponent {
  @Input() tenants: Record<string, unknown>[] = [];
  @Input() selectedTenant = 'default';
  @Output() tenantChange = new EventEmitter<string>();

  readonly tenantId = tenantId;
  readonly tenantLabel = tenantLabel;

  onChange(value: string): void {
    this.tenantChange.emit(value);
  }
}
