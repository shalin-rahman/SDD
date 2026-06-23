/// JOURNAL_ENTRY post/void + line helpers — web `journal-entry.util.ts` parity.

import 'field_display.dart';
import 'lookup_display.dart';

const journalLineParentField = 'journal_entry_id';
const journalLineEntityCode = 'JOURNAL_ENTRY_LINE';
const journalEntryCreatePrefillParam = 'journal_entry_id';

List<Map<String, dynamic>> filterJournalLines(
  List<Map<String, dynamic>> lines,
  String journalEntryId,
) {
  return lines
      .where((row) => '${row[journalLineParentField] ?? ''}' == journalEntryId)
      .toList();
}

double journalLineAmount(Map<String, dynamic> line, String field) {
  final value = double.tryParse('${line[field] ?? ''}');
  return value ?? 0;
}

double sumJournalLineAmounts(
  List<Map<String, dynamic>> lines,
  String field,
) {
  return lines.fold(0.0, (sum, line) => sum + journalLineAmount(line, field));
}

String formatJournalLineAmount(
  Map<String, dynamic> line,
  String field, {
  String? locale,
  String currencyCode = 'USD',
}) {
  final amount = journalLineAmount(line, field);
  if (amount == 0) {
    return '—';
  }
  return formatGridCellValue(
    field,
    amount,
    locale: locale,
    fieldType: 'currency',
    currencyCode: currencyCode,
  );
}

String formatJournalLinesTotal(
  double total, {
  String? locale,
  String currencyCode = 'USD',
}) {
  if (total == 0) {
    return '—';
  }
  return formatGridCellValue(
    'amount',
    total,
    locale: locale,
    fieldType: 'currency',
    currencyCode: currencyCode,
  );
}

String resolveAccountLabel(String accountId, Map<String, String> labels) {
  if (accountId.isEmpty) {
    return '—';
  }
  return labels[accountId] ?? accountId;
}

Map<String, String> buildAccountLabelMap(List<Map<String, dynamic>> accounts) {
  final map = <String, String>{};
  for (final account in accounts) {
    final id = '${account['id'] ?? ''}';
    if (id.isNotEmpty) {
      map[id] = resolveRecordDisplayLabel(account);
    }
  }
  return map;
}

String journalLineAccountLabel(
  Map<String, dynamic> line,
  Map<String, String> labels,
) {
  return resolveAccountLabel('${line['account_id'] ?? ''}', labels);
}

bool canPostJournalEntry(
  String entityCode,
  Map<String, dynamic> record, {
  String? recordId,
  bool creatingNew = false,
}) {
  final id = recordId ?? '${record['id'] ?? ''}';
  if (entityCode != 'JOURNAL_ENTRY' || id.isEmpty || creatingNew) {
    return false;
  }
  return '${record['status'] ?? ''}' == 'draft';
}

bool canVoidJournalEntry(
  String entityCode,
  Map<String, dynamic> record, {
  String? recordId,
  bool creatingNew = false,
}) {
  final id = recordId ?? '${record['id'] ?? ''}';
  if (entityCode != 'JOURNAL_ENTRY' || id.isEmpty || creatingNew) {
    return false;
  }
  return '${record['status'] ?? ''}' == 'posted';
}

bool canAddJournalLine(
  String entityCode,
  Map<String, dynamic> record, {
  String? recordId,
  bool creatingNew = false,
}) {
  return canPostJournalEntry(
    entityCode,
    record,
    recordId: recordId,
    creatingNew: creatingNew,
  );
}
