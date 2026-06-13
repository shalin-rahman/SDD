import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { I18nService } from '../services/i18n.service';
import { virusScanBadgeClass } from '../utils/document-preview.util';

export interface RecordNote {
  body: string;
}

export interface RecordDocument {
  id: string;
  filename: string;
  version: string;
  virus_scan_status: string;
}

export interface RecordAuditEntry {
  action: string;
  payloadJson: string;
}

@Component({
  selector: 'app-record-tabs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './record-tabs.component.html',
  styleUrl: './record-tabs.component.scss',
})
export class RecordTabsComponent {
  readonly i18n = inject(I18nService);

  @Input() notes: RecordNote[] = [];
  @Input() documents: RecordDocument[] = [];
  @Input() auditEntries: RecordAuditEntry[] = [];
  @Input() uploadFilename = 'spec.txt';
  @Input() uploadContent = 'uploaded from web';

  @Output() previewDocument = new EventEmitter<RecordDocument>();
  @Output() uploadDocument = new EventEmitter<void>();
  @Output() uploadFilenameChange = new EventEmitter<string>();
  @Output() uploadContentChange = new EventEmitter<string>();

  versionLabel(version: string): string {
    return `${this.i18n.t('document.preview.version')} ${version}`;
  }

  virusBadgeClass(status: string): string {
    return virusScanBadgeClass(status);
  }
}
