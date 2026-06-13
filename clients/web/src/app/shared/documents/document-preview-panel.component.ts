import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { EmcapApiService } from '../../services/emcap-api.service';
import { EmptyStateComponent } from '../layout/empty-state.component';
import { LoadingPanelComponent } from '../layout/loading-panel.component';
import type { RecordDocument } from '../entity/record-tabs.component';
import { I18nService } from '../services/i18n.service';
import {
  buildDocumentPreviewView,
  parseDocumentVersions,
  revokePreviewBlobUrl,
  triggerDocumentDownload,
  virusScanBadgeClass,
  type DocumentPreviewView,
  type DocumentVersionOption,
} from '../utils/document-preview.util';

@Component({
  selector: 'app-document-preview-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, LoadingPanelComponent, EmptyStateComponent],
  templateUrl: './document-preview-panel.component.html',
  styleUrl: './document-preview-panel.component.scss',
})
export class DocumentPreviewPanelComponent implements OnChanges, OnDestroy {
  private readonly api = inject(EmcapApiService);
  readonly i18n = inject(I18nService);

  @Input() open = false;
  @Input() document: RecordDocument | null = null;
  @Output() closed = new EventEmitter<void>();

  loading = false;
  loadError = '';
  filename = '';
  virusScanStatus = '';
  versions: DocumentVersionOption[] = [];
  selectedVersionId = '';
  previewView: DocumentPreviewView | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] || changes['document']) {
      this.syncPreview();
    }
  }

  ngOnDestroy(): void {
    this.resetState();
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  onVersionChange(versionId: string): void {
    if (!versionId || versionId === this.selectedVersionId) return;
    void this.loadDocument(versionId);
  }

  download(): void {
    if (!this.previewView) return;
    triggerDocumentDownload(this.filename, this.previewView.downloadBytes, this.previewView.textContent);
  }

  virusBadgeClass(): string {
    return virusScanBadgeClass(this.virusScanStatus || this.document?.virus_scan_status || '');
  }

  virusScanLabel(): string {
    const status = this.virusScanStatus || this.document?.virus_scan_status || '';
    if (!status) return this.i18n.t('document.preview.virusUnknown');
    return status;
  }

  versionLabel(version: string): string {
    return `${this.i18n.t('document.preview.version')} ${version}`;
  }

  retryLoad(): void {
    if (!this.document) return;
    void this.loadDocument(this.document.id);
  }

  private syncPreview(): void {
    if (this.open && this.document) {
      void this.loadDocument(this.document.id);
    } else {
      this.resetState();
    }
  }

  private resetState(): void {
    revokePreviewBlobUrl(this.previewView);
    this.loading = false;
    this.loadError = '';
    this.filename = '';
    this.virusScanStatus = '';
    this.versions = [];
    this.selectedVersionId = '';
    this.previewView = null;
  }

  private async loadDocument(documentId: string): Promise<void> {
    revokePreviewBlobUrl(this.previewView);
    this.previewView = null;
    this.loading = true;
    this.loadError = '';

    try {
      const payload = await this.api.client.getDocument(documentId);
      this.filename = String(payload.filename ?? this.document?.filename ?? documentId);
      this.virusScanStatus = String(payload.virus_scan_status ?? this.document?.virus_scan_status ?? '');
      this.versions = parseDocumentVersions(payload, documentId);
      this.selectedVersionId = documentId;
      this.previewView = buildDocumentPreviewView(payload);
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : this.i18n.t('document.preview.loadFailed');
    } finally {
      this.loading = false;
    }
  }
}
