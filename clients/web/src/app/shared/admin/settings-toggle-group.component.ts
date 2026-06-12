import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';

export interface SettingsToggleItem {
  key: string;
  label: string;
  checked: boolean;
}

@Component({
  selector: 'app-settings-toggle-group',
  standalone: true,
  imports: [MatCheckboxModule],
  templateUrl: './settings-toggle-group.component.html',
  styleUrl: './settings-toggle-group.component.scss',
})
export class SettingsToggleGroupComponent {
  @Input() items: SettingsToggleItem[] = [];
  @Output() itemChange = new EventEmitter<{ key: string; checked: boolean }>();

  onChange(item: SettingsToggleItem, event: MatCheckboxChange): void {
    this.itemChange.emit({ key: item.key, checked: event.checked });
  }
}
