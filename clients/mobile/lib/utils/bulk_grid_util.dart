/// Bulk grid selection + CSV export helpers — web `entity-list` parity.

List<String> recordIdsFromPage(List<Map<String, dynamic>> pageRecords) {
  return pageRecords
      .map((record) => '${record['id'] ?? ''}')
      .where((id) => id.isNotEmpty)
      .toList();
}

Set<String> toggleRecordSelection(Set<String> selected, String recordId) {
  final next = Set<String>.from(selected);
  if (next.contains(recordId)) {
    next.remove(recordId);
  } else {
    next.add(recordId);
  }
  return next;
}

Set<String> toggleSelectAllOnPage(Set<String> selected, List<Map<String, dynamic>> pageRecords) {
  final pageIds = recordIdsFromPage(pageRecords);
  final next = Set<String>.from(selected);
  final allSelected = pageIds.isNotEmpty && pageIds.every(next.contains);
  if (allSelected) {
    next.removeAll(pageIds);
  } else {
    next.addAll(pageIds);
  }
  return next;
}

bool isPageFullySelected(Set<String> selected, List<Map<String, dynamic>> pageRecords) {
  final pageIds = recordIdsFromPage(pageRecords);
  return pageIds.isNotEmpty && pageIds.every(selected.contains);
}

List<Map<String, dynamic>> selectedRecordsFromPage(
  Set<String> selected,
  List<Map<String, dynamic>> working,
) {
  return working.where((record) => selected.contains('${record['id'] ?? ''}')).toList();
}

String buildGridExportCsv(List<String> columns, List<Map<String, dynamic>> records) {
  final sb = StringBuffer(columns.join(','));
  for (final record in records) {
    sb.writeln();
    sb.write(columns.map((c) => '${record[c] ?? ''}').join(','));
  }
  return sb.toString();
}

bool shouldRunBulkDelete({required bool bulkActionsEnabled, required Set<String> selected}) {
  return bulkActionsEnabled && selected.isNotEmpty;
}
