import '../services/i18n_service.dart';
import 'field_display.dart';
import 'workflow_state_util.dart';

class WorkflowDetailEntry {
  const WorkflowDetailEntry({required this.key, required this.label, required this.value});

  final String key;
  final String label;
  final String value;
}

List<WorkflowDetailEntry> workflowDetailEntries(
  Map<String, dynamic> payload, {
  String locale = 'en',
}) {
  const labelKeys = {
    'id': null,
    'workflow_code': 'platform.workflow.colWorkflow',
    'entity_code': 'platform.workflow.colEntity',
    'record_id': 'platform.workflow.colRecord',
    'current_state': 'platform.workflow.colState',
    'assignee': 'platform.workflow.colAssignee',
    'due_at': 'platform.workflow.colDueAt',
  };

  return payload.entries
      .where((entry) {
        final value = entry.value;
        return value != null && '$value'.isNotEmpty;
      })
      .map((entry) {
        final key = entry.key;
        final i18nKey = labelKeys[key];
        final label = i18nKey != null ? EmcapLocale.t(i18nKey) : (key == 'id' ? 'ID' : key);
        final value = key == 'due_at'
            ? formatRecordFieldValue(key, 'datetime', entry.value, locale: locale)
            : key == 'current_state'
                ? workflowStateLabel('${entry.value}')
                : '${entry.value}';
        return WorkflowDetailEntry(key: key, label: label, value: value);
      })
      .toList();
}

String workflowActionLabel(String action) {
  switch (action) {
    case 'submit':
      return EmcapLocale.t('platform.workflow.submit');
    case 'approve':
      return EmcapLocale.t('platform.workflow.approve');
    case 'reject':
      return EmcapLocale.t('platform.workflow.reject');
    default:
      return action;
  }
}

List<String> workflowRowActions(String currentState) {
  if (currentState == 'draft') return const ['submit'];
  if (currentState == 'submitted') return const ['approve', 'reject'];
  return const [];
}

bool workflowCanDelegate(String currentState) => currentState == 'submitted';
