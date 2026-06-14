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
