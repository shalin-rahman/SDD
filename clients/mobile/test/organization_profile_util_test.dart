import 'package:emcap_mobile/utils/organization_profile_util.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final platformConfig = {
    'organization_profile': {
      'display_name': 'EMCAP Demo Corp',
      'email': 'contact@example.com',
      'address': {'line1': '100 Main Street', 'city': 'Demo City'},
      'invoice': {'header': '{{display_name}}', 'footer': 'Thanks'},
    },
  };

  test('parseOrganizationProfile reads platform defaults', () {
    final view = parseOrganizationProfile({}, platformConfig: platformConfig);
    expect(view.displayName, 'EMCAP Demo Corp');
    expect(view.address.city, 'Demo City');
  });

  test('formatOrganizationAddressLine joins non-empty parts', () {
    final view = parseOrganizationProfile({}, platformConfig: platformConfig);
    final line = formatOrganizationAddressLine(view);
    expect(line, contains('100 Main Street'));
    expect(line, contains('Demo City'));
  });

  test('resolveDocumentHeaderFooter interpolates tokens', () {
    final view = parseOrganizationProfile({}, platformConfig: platformConfig);
    final resolved = resolveDocumentHeaderFooter(view, view.invoice);
    expect(resolved.header, 'EMCAP Demo Corp');
    expect(resolved.footer, 'Thanks');
  });

  test('isOrganizationLogoPreviewAllowed accepts http(s) only', () {
    expect(isOrganizationLogoPreviewAllowed('https://cdn.example/logo.png'), isTrue);
    expect(isOrganizationLogoPreviewAllowed('file:///tmp/logo.png'), isFalse);
  });

  test('buildOrganizationProfilePayload trims strings', () {
    final view = OrganizationProfileView(
      displayName: ' Acme ',
      legalName: '',
      taxId: '',
      email: 'a@b.co',
      phone: '',
      website: '',
      address: const OrganizationAddress(
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      ),
      timezone: 'UTC',
      locale: 'en',
      currency: 'usd',
      fiscalYearStartMonth: 1,
      logoUrl: '',
      faviconUrl: '',
      secondaryColor: '',
      invoice: const DocumentTemplateBlock(header: '', footer: ''),
      report: const DocumentTemplateBlock(header: '', footer: ''),
      purchaseOrder: const DocumentTemplateBlock(header: '', footer: ''),
      emailSignature: '',
    );
    final payload = buildOrganizationProfilePayload(view);
    expect(payload['display_name'], 'Acme');
    expect(payload['currency'], 'USD');
  });
}
