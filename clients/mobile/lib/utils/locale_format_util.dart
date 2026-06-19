import 'package:intl/intl.dart';

/// BCP 47 locale tags supported by EMCAP mobile chrome.
const supportedLocaleTags = ['en-US', 'bn-BD', 'fr-FR'];

/// One-release read-path aliases for legacy short tags.
const legacyLocaleAliases = <String, String>{
  'en': 'en-US',
  'bn': 'bn-BD',
  'fr': 'fr-FR',
};

String canonicalLocaleTag(String tag) => legacyLocaleAliases[tag] ?? tag;

String resolvePluralCategory(num count) => count == 1 ? 'one' : 'other';

String formatInteger(num value, String localeTag) {
  final tag = canonicalLocaleTag(localeTag);
  if (tag == 'bn-BD') {
    return NumberFormat('#,##0', 'bn_BD').format(value);
  }
  return NumberFormat.decimalPattern(tag).format(value);
}

String formatCurrency(num value, String currencyCode, String localeTag) {
  final tag = canonicalLocaleTag(localeTag);
  if (tag == 'bn-BD') {
    return NumberFormat.simpleCurrency(name: currencyCode, locale: 'bn_BD').format(value);
  }
  return NumberFormat.simpleCurrency(name: currencyCode, locale: tag).format(value);
}

String formatDate(
  DateTime value,
  String localeTag, {
  DateFormat? pattern,
}) {
  final tag = canonicalLocaleTag(localeTag);
  final formatter = pattern ?? DateFormat.yMMMd(tag);
  return formatter.format(value);
}
