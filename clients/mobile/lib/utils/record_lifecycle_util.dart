/// Soft-delete lifecycle helpers — web `record-lifecycle.util.ts` parity.

bool isRecordDeleted(Map<String, dynamic> record) {
  final deletedAt = record['deleted_at'];
  if (deletedAt == null) return false;
  return '$deletedAt'.trim().isNotEmpty;
}

bool isRecordLoaded(String? recordId, Map<String, dynamic> record) {
  if (recordId == null || recordId.isEmpty) return false;
  return '${record['id'] ?? ''}' == recordId;
}

bool canDeleteRecord(String? recordId, Map<String, dynamic> record, bool creatingNew) {
  return isRecordLoaded(recordId, record) && !creatingNew && !isRecordDeleted(record);
}

bool canRestoreRecord(String? recordId, Map<String, dynamic> record) {
  return isRecordLoaded(recordId, record) && isRecordDeleted(record);
}
