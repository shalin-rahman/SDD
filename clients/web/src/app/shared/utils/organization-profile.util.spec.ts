import {
  buildOrganizationProfilePayload,
  formatOrganizationAddressLine,
  interpolateOrganizationTemplate,
  isOrganizationLogoPreviewAllowed,
  isOrganizationPathEditable,
  parseOrganizationProfile,
  pickOrganizationLogoPreviewUrl,
  resolveDocumentHeaderFooter,
  resolveOrganizationLogoPreviewUrl,
} from './organization-profile.util';

describe('organization-profile.util', () => {
  const platformConfig = {
    organization_profile: {
      display_name: 'EMCAP Demo Corp',
      legal_name: 'EMCAP Demo Corporation Ltd',
      email: 'contact@example.com',
      address: { line1: '100 Main Street', city: 'Demo City', country: 'US' },
      invoice: { header: '{{display_name}}', footer: 'Thanks' },
    },
  };

  it('parses organization profile from platform config', () => {
    const view = parseOrganizationProfile({}, platformConfig);
    expect(view.displayName).toBe('EMCAP Demo Corp');
    expect(view.address.city).toBe('Demo City');
    expect(view.invoice.header).toBe('{{display_name}}');
  });

  it('prefers settings overrides over platform defaults', () => {
    const view = parseOrganizationProfile(
      { organization_profile: { display_name: 'Acme Widgets' } },
      platformConfig,
    );
    expect(view.displayName).toBe('Acme Widgets');
  });

  it('formats address line and interpolates templates', () => {
    const view = parseOrganizationProfile({}, platformConfig);
    expect(formatOrganizationAddressLine(view)).toContain('100 Main Street');
    expect(formatOrganizationAddressLine(view)).toContain('Demo City');

    const resolved = resolveDocumentHeaderFooter(view, view.invoice);
    expect(resolved.header).toBe('EMCAP Demo Corp');
    expect(resolved.footer).toBe('Thanks');
  });

  it('resolves report document blocks for grid export', () => {
    const view = parseOrganizationProfile(
      {},
      {
        organization_profile: {
          display_name: 'Acme',
          report: { header: '{{display_name}} Report', footer: 'Generated {{date}}' },
        },
      },
    );
    const resolved = resolveDocumentHeaderFooter(view, view.report);
    expect(resolved.header).toBe('Acme Report');
    expect(resolved.footer).toContain('Generated');
  });

  it('interpolates date token in report footer', () => {
    const text = interpolateOrganizationTemplate('Generated {{date}}', {
      date: '2026-06-18',
    });
    expect(text).toBe('Generated 2026-06-18');
  });

  it('builds API payload with snake_case keys', () => {
    const view = parseOrganizationProfile({}, platformConfig);
    view.displayName = 'Acme';
    const payload = buildOrganizationProfilePayload(view);
    expect(payload['display_name']).toBe('Acme');
    expect((payload['address'] as Record<string, string>)['postal_code']).toBeDefined();
    expect(payload['purchase_order']).toBeDefined();
  });

  it('returns empty address line when all parts blank', () => {
    const view = parseOrganizationProfile({}, {});
    expect(formatOrganizationAddressLine(view)).toBe('');
  });

  it('leaves unknown template tokens unchanged', () => {
    const text = interpolateOrganizationTemplate('Hello {{unknown}}', { displayName: 'Acme' });
    expect(text).toBe('Hello ');
  });

  it('checks editable organization paths', () => {
    expect(isOrganizationPathEditable(['organization_profile.display_name'], 'organization_profile.display_name')).toBe(
      true,
    );
    expect(isOrganizationPathEditable([], 'organization_profile.email')).toBe(false);
  });

  it('buildOrganizationProfilePayload applies defaults for blank locale and currency', () => {
    const view = parseOrganizationProfile({}, {});
    view.locale = '  ';
    view.currency = '';
    view.timezone = '';
    const payload = buildOrganizationProfilePayload(view);
    expect(payload['locale']).toBe('en');
    expect(payload['currency']).toBe('USD');
    expect(payload['timezone']).toBe('UTC');
  });

  it('parseOrganizationProfile prefers settings over platform config', () => {
    const view = parseOrganizationProfile(
      { organization_profile: { display_name: 'From Settings' } },
      { organization_profile: { display_name: 'From Platform' } },
    );
    expect(view.displayName).toBe('From Settings');
  });

  it('reads nested address and template blocks from partial payloads', () => {
    const view = parseOrganizationProfile({
      organization_profile: {
        address: { city: 'Paris' },
        report: { footer: 'Confidential' },
      },
    });
    expect(view.address.city).toBe('Paris');
    expect(view.address.line1).toBe('');
    expect(view.report.footer).toBe('Confidential');
    expect(view.report.header).toBe('');
  });

  it('allows http(s) and uploaded document content paths for logo preview', () => {
    expect(isOrganizationLogoPreviewAllowed('https://cdn.example/logo.png')).toBe(true);
    expect(isOrganizationLogoPreviewAllowed('file:///tmp/logo.png')).toBe(false);
    expect(isOrganizationLogoPreviewAllowed('/api/v1/documents/abc/content')).toBe(true);
    expect(isOrganizationLogoPreviewAllowed('/api/v1/documents/abc')).toBe(false);
  });

  it('resolves uploaded logo URL with API base', () => {
    const resolved = resolveOrganizationLogoPreviewUrl(
      '/api/v1/documents/doc-1/content',
      'http://localhost:8000',
    );
    expect(resolved).toBe('http://localhost:8000/api/v1/documents/doc-1/content');
  });

  it('pickOrganizationLogoPreviewUrl prefers organization logo over tenant fallback', () => {
    const url = pickOrganizationLogoPreviewUrl(
      '/api/v1/documents/org-logo/content',
      'https://tenant/logo.png',
      'http://localhost:8000',
    );
    expect(url).toContain('/api/v1/documents/org-logo/content');
  });
});
