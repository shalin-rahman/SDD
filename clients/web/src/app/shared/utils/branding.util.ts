export const DEFAULT_EMCAP_PRIMARY = '#005cbb';

export interface TenantBrandingView {
  theme: string;
  domain: string;
  primaryColor: string;
  logoUrl: string;
}

/** Resolve tenant branding from admin settings or platform config payload. */
export function parseTenantBranding(
  settings: Record<string, unknown>,
  platformConfig?: Record<string, unknown>,
): TenantBrandingView {
  const settingsTenants = settings['tenants'] as Record<string, Record<string, string>> | undefined;
  const configTenants = platformConfig?.['tenants'] as
    | Record<string, Record<string, string>>
    | undefined;
  const settingsRow = settingsTenants?.default ?? {};
  const configRow = configTenants?.default ?? {};
  const primaryRaw = settingsRow['primary_color'] || configRow['primary_color'];
  return {
    theme: settingsRow['theme'] ?? configRow['theme'] ?? 'default',
    domain: settingsRow['domain'] ?? configRow['domain'] ?? 'localhost',
    primaryColor: normalizePrimaryColor(primaryRaw) ?? DEFAULT_EMCAP_PRIMARY,
    logoUrl: settingsRow['logo_url'] ?? configRow['logo_url'] ?? '',
  };
}

/** Normalize #RGB / #RRGGBB or bare hex; returns null when invalid. */
export function normalizePrimaryColor(value: string | undefined | null): string | null {
  if (!value?.trim()) {
    return null;
  }
  let hex = value.trim();
  if (!hex.startsWith('#')) {
    hex = `#${hex}`;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  return null;
}

export function isBrandingPathEditable(editablePaths: string[], path: string): boolean {
  return editablePaths.includes(path);
}

export function previewPrimaryColor(draft: string, fallback = DEFAULT_EMCAP_PRIMARY): string {
  return normalizePrimaryColor(draft) ?? normalizePrimaryColor(fallback) ?? DEFAULT_EMCAP_PRIMARY;
}

/** WCAG 2.1 AA minimum contrast for normal text on primary toolbar (white on primary). */
export const WCAG_AA_PRIMARY_CONTRAST_MIN = 4.5;

const ON_PRIMARY_HEX = '#ffffff';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizePrimaryColor(hex);
  if (!normalized) {
    return null;
  }
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function channelLuminance(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance per WCAG 2.1; null when hex is invalid. */
export function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }
  return 0.2126 * channelLuminance(rgb.r) + 0.7152 * channelLuminance(rgb.g) + 0.0722 * channelLuminance(rgb.b);
}

export function contrastRatio(hex1: string, hex2: string): number | null {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  if (l1 === null || l2 === null) {
    return null;
  }
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Contrast of white toolbar text against the tenant primary color. */
export function primaryOnWhiteContrast(primaryHex: string): number | null {
  const resolved = previewPrimaryColor(primaryHex);
  return contrastRatio(resolved, ON_PRIMARY_HEX);
}

export function hasAdequatePrimaryContrast(
  primaryHex: string,
  minRatio = WCAG_AA_PRIMARY_CONTRAST_MIN,
): boolean {
  const ratio = primaryOnWhiteContrast(primaryHex);
  return ratio !== null && ratio >= minRatio;
}

export function formatContrastRatio(ratio: number | null): string {
  if (ratio === null) {
    return '—';
  }
  return ratio.toFixed(1);
}
