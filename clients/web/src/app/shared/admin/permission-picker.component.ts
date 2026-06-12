import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';

import {
  groupPermissions,
  hasSelectedPermission,
  togglePermission,
  toggleWildcard,
} from '../utils/permission.util';

@Component({
  selector: 'app-permission-picker',
  standalone: true,
  imports: [FormsModule, MatCheckboxModule, MatExpansionModule],
  templateUrl: './permission-picker.component.html',
  styleUrl: './permission-picker.component.scss',
})
export class PermissionPickerComponent {
  private readonly permissionsSignal = signal<string[]>([]);
  private readonly selectedSignal = signal<string[]>([]);

  @Input({ required: true })
  set permissions(value: string[]) {
    this.permissionsSignal.set(value);
  }

  @Input({ required: true })
  set selected(value: string[]) {
    this.selectedSignal.set(value);
  }

  @Output() selectedChange = new EventEmitter<string[]>();

  readonly groups = computed(() => groupPermissions(this.permissionsSignal()));

  isChecked(permission: string): boolean {
    return hasSelectedPermission(this.selectedSignal(), permission);
  }

  onToggle(permission: string, checked: boolean): void {
    const next = togglePermission(this.selectedSignal(), permission, checked);
    this.selectedSignal.set(next);
    this.selectedChange.emit(next);
  }

  onWildcard(module: string, checked: boolean): void {
    const wildcard = `${module}.*`;
    const next = toggleWildcard(this.selectedSignal(), wildcard, checked);
    this.selectedSignal.set(next);
    this.selectedChange.emit(next);
  }

  wildcardChecked(module: string): boolean {
    return this.selectedSignal().includes(`${module}.*`);
  }
}
