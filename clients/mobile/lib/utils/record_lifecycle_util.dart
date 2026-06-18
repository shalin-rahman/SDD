/// Soft-delete lifecycle helpers — web `record-lifecycle.util.ts` parity.

bool isRecordDeleted(Map<String, dynamic> record) {
  final deletedAt = record['deleted_at'];
  if (deletedAt == null) return false;
  return '$deletedAt'.trim().isNotEmpty;
}

bool canDeleteRecord(String? recordId, Map<String, dynamic> record, bool creatingNew) {
  return recordId != null && recordId.isNotEmpty && !creatingNew && !isRecordDeleted(record);
}

bool canRestoreRecord(String? recordId, Map<String, dynamic> record) {
  return recordId != null && recordId.isNotEmpty && isRecordDeleted(record);
}
