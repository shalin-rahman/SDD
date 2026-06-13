export type DocumentPreviewMode = 'image' | 'pdf' | 'text' | 'download';

export interface DocumentVersionOption {
  id: string;
  version: string;
}

export interface DocumentPreviewView {
  mode: DocumentPreviewMode;
  blobUrl?: string;
  textContent?: string;
  mimeType: string;
  downloadBytes?: Uint8Array;
}

export interface DocumentPayload {
  id?: unknown;
  filename?: unknown;
  version?: unknown;
  virus_scan_status?: unknown;
  ocr_text?: unknown;
  content_base64?: unknown;
  content?: unknown;
  versions?: unknown;
}

const EXTENSION_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  xml: 'text/xml',
  html: 'text/html',
  htm: 'text/html',
};

export function mimeTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_MIME[ext] ?? 'application/octet-stream';
}

export function isTextMimeType(mimeType: string): boolean {
  return mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/xml';
}

export function parseDocumentVersions(payload: DocumentPayload, fallbackId: string): DocumentVersionOption[] {
  const raw = payload.versions;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((entry, index) => {
      const row = entry as Record<string, unknown>;
      return {
        id: String(row.id ?? fallbackId),
        version: String(row.version ?? index + 1),
      };
    });
  }
  return [{ id: fallbackId, version: String(payload.version ?? 1) }];
}

function decodeBase64(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/\s/g, '');
    if (!normalized || normalized.length % 4 === 1) return null;
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function decodeHex(value: string): Uint8Array | null {
  const normalized = value.replace(/\s/g, '');
  if (!normalized || normalized.length % 2 !== 0) return null;
  if (!/^[0-9a-fA-F]+$/.test(normalized)) return null;
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

export function decodeDocumentContent(payload: DocumentPayload): Uint8Array | null {
  const rawContent = payload.content_base64 ?? payload.content;
  if (typeof rawContent !== 'string' || !rawContent.trim()) return null;

  const base64 = decodeBase64(rawContent);
  if (base64 && base64.length > 0) return base64;

  return decodeHex(rawContent);
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
}

function hasMeaningfulBinary(bytes: Uint8Array | null, minLength: number): bytes is Uint8Array {
  return bytes !== null && bytes.length >= minLength;
}

export function buildDocumentPreviewView(payload: DocumentPayload): DocumentPreviewView {
  const filename = String(payload.filename ?? 'document');
  const mimeType = mimeTypeFromFilename(filename);
  const bytes = decodeDocumentContent(payload);
  const ocrText = String(payload.ocr_text ?? '');

  if (mimeType.startsWith('image/') && hasMeaningfulBinary(bytes, 64)) {
    const blob = new Blob([bytes], { type: mimeType });
    return {
      mode: 'image',
      blobUrl: URL.createObjectURL(blob),
      mimeType,
      downloadBytes: bytes,
    };
  }

  if (mimeType === 'application/pdf' && hasMeaningfulBinary(bytes, 100)) {
    const blob = new Blob([bytes], { type: mimeType });
    return {
      mode: 'pdf',
      blobUrl: URL.createObjectURL(blob),
      mimeType,
      downloadBytes: bytes,
    };
  }

  if (isTextMimeType(mimeType) || ocrText) {
    const textContent = ocrText || (bytes ? decodeUtf8(bytes) : '');
    return {
      mode: 'text',
      textContent,
      mimeType,
      downloadBytes: bytes ?? undefined,
    };
  }

  return {
    mode: 'download',
    mimeType,
    downloadBytes: bytes ?? undefined,
    textContent: ocrText || undefined,
  };
}

export function virusScanBadgeClass(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (!normalized) return 'virus-badge--unknown';
  if (normalized === 'clean' || normalized === 'passed' || normalized === 'ok') return 'virus-badge--clean';
  if (normalized === 'pending' || normalized === 'scanning' || normalized === 'queued') return 'virus-badge--pending';
  if (normalized.includes('infect') || normalized === 'failed' || normalized === 'blocked') return 'virus-badge--blocked';
  return 'virus-badge--unknown';
}

export function triggerDocumentDownload(filename: string, bytes: Uint8Array | undefined, fallbackText?: string): void {
  let blob: Blob;
  if (bytes && bytes.length > 0) {
    blob = new Blob([bytes], { type: mimeTypeFromFilename(filename) });
  } else if (fallbackText) {
    blob = new Blob([fallbackText], { type: 'text/plain;charset=utf-8' });
  } else {
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'document';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function revokePreviewBlobUrl(view: DocumentPreviewView | null): void {
  if (view?.blobUrl) {
    URL.revokeObjectURL(view.blobUrl);
  }
}
