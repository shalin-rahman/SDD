import '../metadata_contract.dart';
import 'status_chip_util.dart';

class RecordHeadlineView {
  const RecordHeadlineView({
    required this.headline,
    required this.subtitle,
    required this.statusLabel,
    required this.statusActive,
  });

  final String headline;
  final String subtitle;
  final String statusLabel;
  final bool statusActive;
}

String _dualHeadline(String left, String right) {
  if (left.isNotEmpty && right.isNotEmpty) {
    return '$left — $right';
  }
  return left.isNotEmpty ? left : right;
}

String _str(dynamic value) => '${value ?? ''}'.trim();

/// Entity record hero text — metadata-driven headline (web `record-headline.util` parity).
RecordHeadlineView buildRecordHeadlineView(
  String entityCode,
  Map<String, dynamic> record,
  bool creatingNew,
  String? selectedRecordId,
  String Function(String key) t, {
  StatusFieldMetadata? statusField,
  String locale = 'en',
}) {
  if (creatingNew) {
    return RecordHeadlineView(
      headline: t('entity.newRecord'),
      subtitle: t('entity.createSubtitle'),
      statusLabel: '',
      statusActive: false,
    );
  }

  var headline = '${t('entity.record')} ${selectedRecordId ?? ''}'.trim();
  var subtitle = selectedRecordId ?? '';

  if (entityCode == 'PRODUCT') {
    headline = _dualHeadline(_str(record['sku']), _str(record['name']));
    if (headline.isEmpty) {
      headline = '${t('entity.record')} ${selectedRecordId ?? ''}'.trim();
    }
    final qty = record['quantity_on_hand'];
    final price = record['unit_price'];
    if (qty != null && price != null) {
      subtitle = '${t('entity.stockLine')} $qty · ${t('entity.priceLine')} $price';
    }
  } else if (entityCode == 'WAREHOUSE') {
    headline = _dualHeadline(_str(record['code']), _str(record['name']));
    if (headline.isEmpty) {
      headline = '${t('entity.record')} ${selectedRecordId ?? ''}'.trim();
    }
  } else if (entityCode == 'CUSTOMER') {
    final code = _str(record['code']);
    final name = _str(record['name']);
    headline = code.isNotEmpty ? _dualHeadline(code, name) : name;
    if (headline.isEmpty) {
      headline = '${t('entity.record')} ${selectedRecordId ?? ''}'.trim();
    }
  } else if (entityCode == 'LEAD') {
    headline = _dualHeadline(_str(record['company']), _str(record['contact_name']));
    if (headline.isEmpty) {
      headline = '${t('entity.record')} ${selectedRecordId ?? ''}'.trim();
    }
  } else if (entityCode == 'CONTACT') {
    headline = _str(record['name']);
    if (headline.isEmpty) {
      headline = '${t('entity.record')} ${selectedRecordId ?? ''}'.trim();
    }
    final email = _str(record['email']);
    if (email.isNotEmpty) {
      subtitle = email;
    }
  } else if (entityCode == 'SUPPLIER') {
    headline = _dualHeadline(_str(record['code']), _str(record['name']));
    if (headline.isEmpty) {
      headline = '${t('entity.record')} ${selectedRecordId ?? ''}'.trim();
    }
  } else if (entityCode == 'PURCHASE_ORDER') {
    headline = _str(record['po_number']);
    if (headline.isEmpty) {
      headline = '${t('entity.record')} ${selectedRecordId ?? ''}'.trim();
    }
  } else if (entityCode == 'SALES_ORDER') {
    headline = _str(record['order_number']);
    if (headline.isEmpty) {
      headline = '${t('entity.record')} ${selectedRecordId ?? ''}'.trim();
    }
  } else if (entityCode == 'INVOICE') {
    headline = _str(record['invoice_number']);
    if (headline.isEmpty) {
      headline = '${t('entity.record')} ${selectedRecordId ?? ''}'.trim();
    }
  }

  final chip = buildStatusChipView(record, statusField, locale, t);
  return RecordHeadlineView(
    headline: headline,
    subtitle: subtitle,
    statusLabel: chip.label,
    statusActive: chip.active,
  );
}
