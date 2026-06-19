export interface OrganizationAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface DocumentTemplateBlock {
  header: string;
  footer: string;
}

export interface OrganizationProfileView {
  displayName: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  website: string;
  address: OrganizationAddress;
  timezone: string;
  locale: string;
  currency: string;
  fiscalYearStartMonth: number;
  logoUrl: string;
  faviconUrl: string;
  secondaryColor: string;
  invoice: DocumentTemplateBlock;
  report: DocumentTemplateBlock;
  purchaseOrder: DocumentTemplateBlock;
  emailSignature: string;
}

export interface OrganizationProfileTemplateVars {
  displayName?: string;
  legalName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  date?: string;
}

const DEFAULT_ADDRESS: OrganizationAddress = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

const DEFAULT_TEMPLATE: DocumentTemplateBlock = { header: '', footer: '' };

function readAddress(raw: Record<string, unknown> | undefined): OrganizationAddress {
  if (!raw) {
    return { ...DEFAULT_ADDRESS };
  }
  return {
    line1: String(raw['line1'] ?? ''),
    line2: String(raw['line2'] ?? ''),
    city: String(raw['city'] ?? ''),
    state: String(raw['state'] ?? ''),
    postalCode: String(raw['postal_code'] ?? ''),
    country: String(raw['country'] ?? ''),
  };
}

function readTemplateBlock(raw: Record<string, unknown> | undefined): DocumentTemplateBlock {
  if (!raw) {
    return { ...DEFAULT_TEMPLATE };
  }
  return {
    header: String(raw['header'] ?? ''),
    footer: String(raw['footer'] ?? ''),
  };
}

/** Parse organization profile from admin settings or platform config payload. */
export function parseOrganizationProfile(
  settings: Record<string, unknown>,
  platformConfig?: Record<string, unknown>,
): OrganizationProfileView {
  const settingsRow = settings['organization_profile'] as Record<string, unknown> | undefined;
  const configRow = platformConfig?.['organization_profile'] as Record<string, unknown> | undefined;
  const row = settingsRow ?? configRow ?? {};
  return {
    displayName: String(row['display_name'] ?? ''),
    legalName: String(row['legal_name'] ?? ''),
    taxId: String(row['tax_id'] ?? ''),
    email: String(row['email'] ?? ''),
    phone: String(row['phone'] ?? ''),
    website: String(row['website'] ?? ''),
    address: readAddress(row['address'] as Record<string, unknown> | undefined),
    timezone: String(row['timezone'] ?? 'UTC'),
    locale: String(row['locale'] ?? 'en'),
    currency: String(row['currency'] ?? 'USD'),
    fiscalYearStartMonth: Number(row['fiscal_year_start_month'] ?? 1),
    logoUrl: String(row['logo_url'] ?? ''),
    faviconUrl: String(row['favicon_url'] ?? ''),
    secondaryColor: String(row['secondary_color'] ?? ''),
    invoice: readTemplateBlock(row['invoice'] as Record<string, unknown> | undefined),
    report: readTemplateBlock(row['report'] as Record<string, unknown> | undefined),
    purchaseOrder: readTemplateBlock(row['purchase_order'] as Record<string, unknown> | undefined),
    emailSignature: String(row['email_signature'] ?? ''),
  };
}

/** Build template variable map for header/footer interpolation. */
export function buildOrganizationTemplateVars(
  profile: OrganizationProfileView,
  extra: OrganizationProfileTemplateVars = {},
): OrganizationProfileTemplateVars {
  return {
    displayName: profile.displayName,
    legalName: profile.legalName,
    taxId: profile.taxId,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    addressLine1: profile.address.line1,
    addressLine2: profile.address.line2,
    city: profile.address.city,
    state: profile.address.state,
    postalCode: profile.address.postalCode,
    country: profile.address.country,
    date: new Date().toISOString().slice(0, 10),
    ...extra,
  };
}

const TEMPLATE_TOKEN_RE = /\{\{(\w+)\}\}/g;

/** Interpolate {{token}} placeholders in document header/footer templates. */
export function interpolateOrganizationTemplate(
  template: string,
  vars: OrganizationProfileTemplateVars,
): string {
  const lookup: Record<string, string> = {
    display_name: vars.displayName ?? '',
    legal_name: vars.legalName ?? '',
    tax_id: vars.taxId ?? '',
    email: vars.email ?? '',
    phone: vars.phone ?? '',
    website: vars.website ?? '',
    address_line1: vars.addressLine1 ?? '',
    address_line2: vars.addressLine2 ?? '',
    city: vars.city ?? '',
    state: vars.state ?? '',
    postal_code: vars.postalCode ?? '',
    country: vars.country ?? '',
    date: vars.date ?? '',
  };
  return template.replace(TEMPLATE_TOKEN_RE, (_match, token: string) => lookup[token] ?? '');
}

/** Format a single-line postal address for display. */
export function formatOrganizationAddressLine(profile: OrganizationProfileView): string {
  const parts = [
    profile.address.line1,
    profile.address.line2,
    profile.address.city,
    profile.address.state,
    profile.address.postalCode,
    profile.address.country,
  ].filter((part) => part.trim().length > 0);
  return parts.join(', ');
}

/** Build organization_profile object for PUT /admin/organization-profile. */
export function buildOrganizationProfilePayload(view: OrganizationProfileView): Record<string, unknown> {
  return {
    display_name: view.displayName.trim(),
    legal_name: view.legalName.trim(),
    tax_id: view.taxId.trim(),
    email: view.email.trim(),
    phone: view.phone.trim(),
    website: view.website.trim(),
    address: {
      line1: view.address.line1.trim(),
      line2: view.address.line2.trim(),
      city: view.address.city.trim(),
      state: view.address.state.trim(),
      postal_code: view.address.postalCode.trim(),
      country: view.address.country.trim(),
    },
    timezone: view.timezone.trim() || 'UTC',
    locale: view.locale.trim() || 'en',
    currency: view.currency.trim().toUpperCase() || 'USD',
    fiscal_year_start_month: view.fiscalYearStartMonth,
    logo_url: view.logoUrl.trim(),
    favicon_url: view.faviconUrl.trim(),
    secondary_color: view.secondaryColor.trim(),
    invoice: { header: view.invoice.header, footer: view.invoice.footer },
    report: { header: view.report.header, footer: view.report.footer },
    purchase_order: { header: view.purchaseOrder.header, footer: view.purchaseOrder.footer },
    email_signature: view.emailSignature,
  };
}

/** Resolve document header/footer text for PDF export or print views. */
export function resolveDocumentHeaderFooter(
  profile: OrganizationProfileView,
  block: DocumentTemplateBlock,
): { header: string; footer: string } {
  const vars = buildOrganizationTemplateVars(profile);
  return {
    header: interpolateOrganizationTemplate(block.header, vars),
    footer: interpolateOrganizationTemplate(block.footer, vars),
  };
}

export function isOrganizationPathEditable(editablePaths: string[], path: string): boolean {
  return editablePaths.includes(path);
}

/** Whether a logo URL is safe to preview (http(s) or uploaded document content path). */
export function isOrganizationLogoPreviewAllowed(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('https://') || lower.startsWith('http://')) {
    return true;
  }
  return trimmed.startsWith('/api/v1/documents/') && trimmed.endsWith('/content');
}

/** Resolve logo preview src — absolute http(s) or API-hosted document content. */
export function resolveOrganizationLogoPreviewUrl(
  logoUrl: string,
  apiBaseUrl: string,
): string {
  const trimmed = logoUrl.trim();
  if (!isOrganizationLogoPreviewAllowed(trimmed)) {
    return '';
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}${trimmed}`;
}

/** Pick first previewable logo URL from organization profile and tenant branding fallback. */
export function pickOrganizationLogoPreviewUrl(
  organizationLogoUrl: string,
  tenantLogoUrl: string,
  apiBaseUrl: string,
): string {
  for (const candidate of [organizationLogoUrl.trim(), tenantLogoUrl.trim()]) {
    const resolved = resolveOrganizationLogoPreviewUrl(candidate, apiBaseUrl);
    if (resolved) {
      return resolved;
    }
  }
  return '';
}
