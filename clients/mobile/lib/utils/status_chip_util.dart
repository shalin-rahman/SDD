import '../metadata_contract.dart';

class StatusChipView {
  const StatusChipView({required this.label, required this.active});

  final String label;
  final bool active;
}

bool _isActiveValue(dynamic value, List<dynamic> activeValues) {
  for (final expected in activeValues) {
    if (identical(value, expected) || value == expected) {
      return true;
    }
  }
  return false;
}

String _resolveStatusLabel(
  bool active,
  StatusFieldMetadata statusField,
  String locale,
  String Function(String key) t,
) {
  final key = active ? 'active' : 'inactive';
  final localized = statusField.labels[key]?[locale] ?? statusField.labels[key]?['en'];
  if (localized != null && localized.isNotEmpty) {
    return localized;
  }
  return active ? t('entity.statusActive') : t('entity.statusInactive');
}

StatusChipView buildStatusChipView(
  Map<String, dynamic> record,
  StatusFieldMetadata? statusField,
  String locale,
  String Function(String key) t,
) {
  if (statusField == null) {
    return const StatusChipView(label: '', active: false);
  }
  final raw = record[statusField.field];
  if (raw == null) {
    return const StatusChipView(label: '', active: false);
  }
  final active = _isActiveValue(raw, statusField.activeValues);
  return StatusChipView(
    label: _resolveStatusLabel(active, statusField, locale, t),
    active: active,
  );
}
