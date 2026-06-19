class OrganizationAddress {
  const OrganizationAddress({
    required this.line1,
    required this.line2,
    required this.city,
    required this.state,
    required this.postalCode,
    required this.country,
  });

  final String line1;
  final String line2;
  final String city;
  final String state;
  final String postalCode;
  final String country;
}

class DocumentTemplateBlock {
  const DocumentTemplateBlock({required this.header, required this.footer});

  final String header;
  final String footer;
}

class OrganizationProfileView {
  const OrganizationProfileView({
    required this.displayName,
    required this.legalName,
    required this.taxId,
    required this.email,
    required this.phone,
    required this.website,
    required this.address,
    required this.timezone,
    required this.locale,
    required this.currency,
    required this.fiscalYearStartMonth,
    required this.logoUrl,
    required this.faviconUrl,
    required this.secondaryColor,
    required this.invoice,
    required this.report,
    required this.purchaseOrder,
    required this.emailSignature,
  });

  final String displayName;
  final String legalName;
  final String taxId;
  final String email;
  final String phone;
  final String website;
  final OrganizationAddress address;
  final String timezone;
  final String locale;
  final String currency;
  final int fiscalYearStartMonth;
  final String logoUrl;
  final String faviconUrl;
  final String secondaryColor;
  final DocumentTemplateBlock invoice;
  final DocumentTemplateBlock report;
  final DocumentTemplateBlock purchaseOrder;
  final String emailSignature;
}

OrganizationAddress _readAddress(Map<String, dynamic>? raw) {
  return OrganizationAddress(
    line1: '${raw?['line1'] ?? ''}',
    line2: '${raw?['line2'] ?? ''}',
    city: '${raw?['city'] ?? ''}',
    state: '${raw?['state'] ?? ''}',
    postalCode: '${raw?['postal_code'] ?? ''}',
    country: '${raw?['country'] ?? ''}',
  );
}

DocumentTemplateBlock _readTemplateBlock(Map<String, dynamic>? raw) {
  return DocumentTemplateBlock(
    header: '${raw?['header'] ?? ''}',
    footer: '${raw?['footer'] ?? ''}',
  );
}

/// Parse organization profile from admin settings or platform config payload.
OrganizationProfileView parseOrganizationProfile(
  Map<String, dynamic> settings, {
  Map<String, dynamic>? platformConfig,
}) {
  final settingsRow = settings['organization_profile'] as Map<String, dynamic>?;
  final configRow = platformConfig?['organization_profile'] as Map<String, dynamic>?;
  final row = settingsRow ?? configRow ?? {};
  return OrganizationProfileView(
    displayName: '${row['display_name'] ?? ''}',
    legalName: '${row['legal_name'] ?? ''}',
    taxId: '${row['tax_id'] ?? ''}',
    email: '${row['email'] ?? ''}',
    phone: '${row['phone'] ?? ''}',
    website: '${row['website'] ?? ''}',
    address: _readAddress(row['address'] as Map<String, dynamic>?),
    timezone: '${row['timezone'] ?? 'UTC'}',
    locale: '${row['locale'] ?? 'en'}',
    currency: '${row['currency'] ?? 'USD'}',
    fiscalYearStartMonth: (row['fiscal_year_start_month'] as num?)?.toInt() ?? 1,
    logoUrl: '${row['logo_url'] ?? ''}',
    faviconUrl: '${row['favicon_url'] ?? ''}',
    secondaryColor: '${row['secondary_color'] ?? ''}',
    invoice: _readTemplateBlock(row['invoice'] as Map<String, dynamic>?),
    report: _readTemplateBlock(row['report'] as Map<String, dynamic>?),
    purchaseOrder: _readTemplateBlock(row['purchase_order'] as Map<String, dynamic>?),
    emailSignature: '${row['email_signature'] ?? ''}',
  );
}

/// Format a single-line postal address for display.
String formatOrganizationAddressLine(OrganizationProfileView profile) {
  final parts = [
    profile.address.line1,
    profile.address.line2,
    profile.address.city,
    profile.address.state,
    profile.address.postalCode,
    profile.address.country,
  ].where((part) => part.trim().isNotEmpty);
  return parts.join(', ');
}

final _templateTokenRe = RegExp(r'\{\{(\w+)\}\}');

/// Interpolate {{token}} placeholders in document header/footer templates.
String interpolateOrganizationTemplate(String template, Map<String, String> vars) {
  return template.replaceAllMapped(_templateTokenRe, (match) {
    final token = match.group(1) ?? '';
    return vars[token] ?? '';
  });
}

Map<String, String> buildOrganizationTemplateVars(OrganizationProfileView profile) {
  return {
    'display_name': profile.displayName,
    'legal_name': profile.legalName,
    'tax_id': profile.taxId,
    'email': profile.email,
    'phone': profile.phone,
    'website': profile.website,
    'address_line1': profile.address.line1,
    'address_line2': profile.address.line2,
    'city': profile.address.city,
    'state': profile.address.state,
    'postal_code': profile.address.postalCode,
    'country': profile.address.country,
    'date': DateTime.now().toIso8601String().substring(0, 10),
  };
}

/// Resolve document header/footer text for PDF export or print views.
({String header, String footer}) resolveDocumentHeaderFooter(
  OrganizationProfileView profile,
  DocumentTemplateBlock block,
) {
  final vars = buildOrganizationTemplateVars(profile);
  return (
    header: interpolateOrganizationTemplate(block.header, vars),
    footer: interpolateOrganizationTemplate(block.footer, vars),
  );
}

/// Build organization_profile object for PUT /admin/organization-profile.
Map<String, dynamic> buildOrganizationProfilePayload(OrganizationProfileView view) {
  return {
    'display_name': view.displayName.trim(),
    'legal_name': view.legalName.trim(),
    'tax_id': view.taxId.trim(),
    'email': view.email.trim(),
    'phone': view.phone.trim(),
    'website': view.website.trim(),
    'address': {
      'line1': view.address.line1.trim(),
      'line2': view.address.line2.trim(),
      'city': view.address.city.trim(),
      'state': view.address.state.trim(),
      'postal_code': view.address.postalCode.trim(),
      'country': view.address.country.trim(),
    },
    'timezone': view.timezone.trim().isEmpty ? 'UTC' : view.timezone.trim(),
    'locale': view.locale.trim().isEmpty ? 'en' : view.locale.trim(),
    'currency': view.currency.trim().isEmpty ? 'USD' : view.currency.trim().toUpperCase(),
    'fiscal_year_start_month': view.fiscalYearStartMonth,
    'logo_url': view.logoUrl.trim(),
    'favicon_url': view.faviconUrl.trim(),
    'secondary_color': view.secondaryColor.trim(),
    'invoice': {'header': view.invoice.header, 'footer': view.invoice.footer},
    'report': {'header': view.report.header, 'footer': view.report.footer},
    'purchase_order': {'header': view.purchaseOrder.header, 'footer': view.purchaseOrder.footer},
    'email_signature': view.emailSignature,
  };
}

/// Whether a logo URL is safe to preview (http/https only; avoids loading arbitrary schemes).
bool isOrganizationLogoPreviewAllowed(String url) {
  final trimmed = url.trim();
  if (trimmed.isEmpty) {
    return false;
  }
  final lower = trimmed.toLowerCase();
  if (lower.startsWith('https://') || lower.startsWith('http://')) {
    return true;
  }
  return trimmed.startsWith('/api/v1/documents/') && trimmed.endsWith('/content');
}
