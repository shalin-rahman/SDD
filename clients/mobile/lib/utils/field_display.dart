import 'package:intl/intl.dart';

const _datetimeFields = {'created_at', 'updated_at', 'deleted_at'};

String formatRecordFieldValue(
  String fieldName,
  String fieldType,
  Object? value, {
  String? locale,
  String? currencyCode,
}) {
  if (value == null || value == '') {
    return '—';
  }
  if (fieldType == 'datetime' || _datetimeFields.contains(fieldName)) {
    final parsed = DateTime.tryParse(value.toString());
    if (parsed != null) {
      final format = DateFormat.yMMMd(locale).add_jm();
      return format.format(parsed.toLocal());
    }
  }
  if (fieldType == 'currency') {
    final code = currencyCode ?? 'USD';
    final amount = double.tryParse(value.toString());
    if (amount != null) {
      return NumberFormat.simpleCurrency(name: code, locale: locale).format(amount);
    }
  }
  if (fieldType == 'textarea') {
    return value.toString();
  }
  if (fieldType == 'lookup') {
    return value.toString();
  }
  if (fieldType == 'checkbox' || value is bool) {
    return value == true ? 'Yes' : 'No';
  }
  return value.toString();
}

String formatGridCellValue(
  String fieldName,
  Object? value, {
  String? locale,
  String? fieldType,
  String? currencyCode,
}) {
  if (value == null || value == '') {
    return '—';
  }
  if (fieldType == 'currency') {
    return formatRecordFieldValue(fieldName, 'currency', value, locale: locale, currencyCode: currencyCode);
  }
  if (fieldType == 'textarea') {
    final text = value.toString();
    return text.length > 80 ? '${text.substring(0, 77)}…' : text;
  }
  if (_datetimeFields.contains(fieldName)) {
    return formatRecordFieldValue(fieldName, 'datetime', value, locale: locale);
  }
  if (value is bool) {
    return value ? 'Yes' : 'No';
  }
  return value.toString();
}
