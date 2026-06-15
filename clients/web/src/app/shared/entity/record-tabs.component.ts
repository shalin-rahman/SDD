import { CommonModule } from '@angular/common';

import { Component, EventEmitter, inject, Input, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { MatTabsModule } from '@angular/material/tabs';



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



export interface RecordWorkflowInstance {

  id: string;

  workflow_code: string;

  current_state: string;

  assignee: string;

}



@Component({

  selector: 'app-record-tabs',

  standalone: true,

  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatTabsModule],

  templateUrl: './record-tabs.component.html',

  styleUrl: './record-tabs.component.scss',

})

export class RecordTabsComponent {

  readonly i18n = inject(I18nService);



  @Input() notes: RecordNote[] = [];

  @Input() documents: RecordDocument[] = [];

  @Input() auditEntries: RecordAuditEntry[] = [];

  @Input() workflowInstances: RecordWorkflowInstance[] = [];

  @Input() showWorkflowTab = false;

  @Input() selectedTabIndex = 0;

  @Input() uploadFilename = 'spec.txt';

  @Input() uploadContent = 'uploaded from web';



  @Output() previewDocument = new EventEmitter<RecordDocument>();

  @Output() uploadDocument = new EventEmitter<void>();

  @Output() uploadFilenameChange = new EventEmitter<string>();

  @Output() uploadContentChange = new EventEmitter<string>();

  @Output() selectedTabIndexChange = new EventEmitter<number>();



  versionLabel(version: string): string {

    return `${this.i18n.t('document.preview.version')} ${version}`;

  }



  virusBadgeClass(status: string): string {

    return virusScanBadgeClass(status);

  }



  notesTabLabel(): string {

    return `${this.i18n.t('record.notes')} (${this.notes.length})`;

  }



  documentsTabLabel(): string {

    return `${this.i18n.t('record.documents')} (${this.documents.length})`;

  }



  auditTabLabel(): string {

    return `${this.i18n.t('record.audit')} (${this.auditEntries.length})`;

  }



  workflowTabLabel(): string {

    return `${this.i18n.t('record.workflow')} (${this.workflowInstances.length})`;

  }



  onTabChange(index: number): void {

    this.selectedTabIndexChange.emit(index);

  }

}

