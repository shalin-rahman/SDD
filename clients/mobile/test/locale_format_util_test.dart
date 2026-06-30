import 'package:emcap_mobile/utils/locale_format_util.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';
import 'support/screen_test_harness.dart';

void main() {
  setUpAll(() async {
    await initIntlDateFormatting();
  });
  test('resolvePluralCategory follows CLDR one/other', () {
    expect(resolvePluralCategory(1), 'one');
    expect(resolvePluralCategory(0), 'other');
    expect(resolvePluralCategory(2), 'other');
  });

  test('formatInteger uses Western Arabic numerals for en-US', () {
    expect(formatInteger(1234567, 'en-US'), '1,234,567');
  });

  test('formatInteger uses Bengali digits for bn-BD', () {
    final formatted = formatInteger(1234567, 'bn-BD');
    expect(formatted, contains('১'));
    expect(formatted.contains(RegExp(r'[0-9]')), isFalse);
  });

  test('formatCurrency localizes symbol and digits', () {
    expect(formatCurrency(42.5, 'USD', 'en-US'), contains('42.50'));
    final bn = formatCurrency(42.5, 'BDT', 'bn-BD');
    expect(bn, contains('৳'));
    expect(bn.contains(RegExp(r'[0-9]')), isFalse);
  });

  test('formatDate formats with locale tag', () {
    final date = DateTime.utc(2026, 6, 19);
    expect(formatDate(date, 'en-US'), isNotEmpty);
    expect(formatDate(date, 'bn-BD'), isNotEmpty);
  });

  test('canonicalLocaleTag resolves legacy aliases', () {
    expect(canonicalLocaleTag('en'), 'en-US');
    expect(canonicalLocaleTag('fr-FR'), 'fr-FR');
    expect(canonicalLocaleTag('bn'), 'bn-BD');
  });

  test('supportedLocaleTags includes primary locales', () {
    expect(supportedLocaleTags, containsAll(['en-US', 'bn-BD', 'fr-FR']));
  });

  test('formatDate accepts custom pattern', () {
    final date = DateTime.utc(2026, 6, 19);
    expect(formatDate(date, 'en-US', pattern: DateFormat('yyyy-MM-dd')), '2026-06-19');
  });

  test('formatIsoTimestamp parses sync version for banners', () {
    final formatted = formatIsoTimestamp('2026-06-25T07:27:53.900841+00:00', 'en-US');
    expect(formatted, isNotNull);
    expect(formatted, isNot(contains('T07:27:53')));
  });
}
