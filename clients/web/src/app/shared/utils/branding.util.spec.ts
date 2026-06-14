import {
  DEFAULT_EMCAP_PRIMARY,
  isBrandingPathEditable,
  normalizePrimaryColor,
  parseTenantBranding,
  previewPrimaryColor,
} from './branding.util';

describe('branding.util', () => {
  it('normalizes 3- and 6-digit hex colors', () => {
    expect(normalizePrimaryColor('#abc')).toBe('#aabbcc');
    expect(normalizePrimaryColor('005cbb')).toBe('#005cbb');
    expect(normalizePrimaryColor('')).toBeNull();
    expect(normalizePrimaryColor('not-a-color')).toBeNull();
  });

  it('parses tenant branding with platform fallback', () => {
    const view = parseTenantBranding(
      { tenants: { default: { theme: 'custom', domain: 'app.local', primary_color: '#112233' } } },
      { tenants: { default: { primary_color: '#999999' } } },
    );
    expect(view.theme).toBe('custom');
    expect(view.primaryColor).toBe('#112233');
  });

  it('falls back to default primary when unset', () => {
    const view = parseTenantBranding({}, {});
    expect(view.primaryColor).toBe(DEFAULT_EMCAP_PRIMARY);
  });

  it('checks editable branding paths', () => {
    expect(isBrandingPathEditable(['tenants.default.primary_color'], 'tenants.default.primary_color')).toBe(
      true,
    );
    expect(isBrandingPathEditable([], 'tenants.default.logo_url')).toBe(false);
  });

  it('resolves preview primary from draft or fallback', () => {
    expect(previewPrimaryColor('#ff0000')).toBe('#ff0000');
    expect(previewPrimaryColor('not-a-color', '#00ff00')).toBe('#00ff00');
    expect(previewPrimaryColor('', '')).toBe(DEFAULT_EMCAP_PRIMARY);
  });
});
