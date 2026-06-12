import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-list-toolbar',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './admin-list-toolbar.component.html',
  styleUrl: './admin-list-toolbar.component.scss',
})
export class AdminListToolbarComponent {
  @Input() newLabel = 'New';
  @Input() showNew = true;
  @Output() create = new EventEmitter<void>();
}
