/// STOCK_MOVEMENT post + line helpers — web `entity-record` parity.

bool canPostMovement(
  String entityCode,
  Map<String, dynamic> record, {
  String? recordId,
  bool creatingNew = false,
}) {
  final id = recordId ?? '${record['id'] ?? ''}';
  return entityCode == 'STOCK_MOVEMENT' &&
      id.isNotEmpty &&
      !creatingNew &&
      '${record['status'] ?? ''}' == 'draft';
}

List<Map<String, dynamic>> filterMovementLines(
  List<Map<String, dynamic>> lines,
  String movementId,
) {
  return lines.where((row) => '${row['movement_id'] ?? ''}' == movementId).toList();
}
