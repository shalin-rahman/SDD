import '../services/i18n_service.dart';

/// Maps workflow `current_state` codes to localized labels; falls back to raw code.
String workflowStateLabel(String state) {
  final trimmed = state.trim();
  if (trimmed.isEmpty) {
    return EmcapLocale.t('common.emptyValue');
  }
  final key = 'platform.workflow.state.$trimmed';
  final label = EmcapLocale.t(key);
  return label == key ? trimmed : label;
}
