import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-record-detail-header',
  standalone: true,
  imports: [MatButtonModule, MatChipsModule, MatIconModule],
  templateUrl: './record-detail-header.component.html',
  styleUrl: './record-detail-header.component.scss',
})
export class RecordDetailHeaderComponent {
  @Input() headline = '';
  @Input() subtitle = '';
  @Input() statusLabel = '';
  @Input() statusActive = false;
  @Input() creatingNew = false;
  @Input() canDelete = false;
  @Input() canWorkflow = false;
  @Input() canSave = false;
  @Input() canRestore = false;
  @Input() deleteLabel = 'Delete';
  @Input() restoreLabel = 'Restore';
  @Input() workflowLabel = 'Start workflow';
  @Input() cancelLabel = 'Cancel';
  @Input() saveLabel = 'Save';

  @Output() delete = new EventEmitter<void>();
  @Output() workflow = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() restore = new EventEmitter<void>();
}
