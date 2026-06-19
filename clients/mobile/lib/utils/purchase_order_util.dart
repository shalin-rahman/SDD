/// PURCHASE_ORDER receive + line helpers — web `order-line` / entity-record parity.

const purchaseOrderLineEntityCode = 'PURCHASE_ORDER_LINE';
const purchaseOrderParentFkField = 'po_id';
const purchaseOrderCreatePrefillParam = 'po_id';

bool canReceivePurchaseOrderStatus(Map<String, dynamic> record) {
  final status = '${record['status'] ?? ''}';
  return status == 'draft' || status == 'submitted';
}

bool canReceivePurchaseOrder(
  String entityCode,
  Map<String, dynamic> record, {
  String? recordId,
  bool creatingNew = false,
  int orderLineCount = 0,
}) {
  final id = recordId ?? '${record['id'] ?? ''}';
  if (entityCode != 'PURCHASE_ORDER' || id.isEmpty || creatingNew) {
    return false;
  }
  if (orderLineCount <= 0) {
    return false;
  }
  return canReceivePurchaseOrderStatus(record);
}

bool canAddPurchaseOrderLine(
  String entityCode,
  Map<String, dynamic> record, {
  String? recordId,
  bool creatingNew = false,
}) {
  final id = recordId ?? '${record['id'] ?? ''}';
  if (entityCode != 'PURCHASE_ORDER' || id.isEmpty || creatingNew) {
    return false;
  }
  return canReceivePurchaseOrderStatus(record);
}

List<Map<String, dynamic>> filterPurchaseOrderLines(
  List<Map<String, dynamic>> lines,
  String poId,
) {
  return lines
      .where((row) => '${row[purchaseOrderParentFkField] ?? ''}' == poId)
      .toList();
}

double purchaseOrderLineQuantity(Map<String, dynamic> line) {
  final value = double.tryParse('${line['quantity'] ?? ''}');
  return value ?? 0;
}

double purchaseOrderLineUnitPrice(Map<String, dynamic> line) {
  final value = double.tryParse('${line['unit_price'] ?? ''}');
  return value ?? 0;
}

double purchaseOrderLineExtension(Map<String, dynamic> line) {
  return purchaseOrderLineQuantity(line) * purchaseOrderLineUnitPrice(line);
}
