/// SALES_ORDER line helpers — web entity-record parity.

const salesOrderLineEntityCode = 'SALES_ORDER_LINE';
const salesOrderParentFkField = 'sales_order_id';
const salesOrderCreatePrefillParam = 'sales_order_id';

bool canAddSalesOrderLine(
  String entityCode,
  Map<String, dynamic> record, {
  String? recordId,
  bool creatingNew = false,
}) {
  final id = recordId ?? '${record['id'] ?? ''}';
  if (entityCode != 'SALES_ORDER' || id.isEmpty || creatingNew) {
    return false;
  }
  final status = '${record['status'] ?? ''}';
  return status == 'draft' || status == 'confirmed';
}

List<Map<String, dynamic>> filterSalesOrderLines(
  List<Map<String, dynamic>> lines,
  String salesOrderId,
) {
  return lines
      .where((row) => '${row[salesOrderParentFkField] ?? ''}' == salesOrderId)
      .toList();
}

double salesOrderLineQuantity(Map<String, dynamic> line) {
  final value = double.tryParse('${line['quantity'] ?? ''}');
  return value ?? 0;
}

double salesOrderLineUnitPrice(Map<String, dynamic> line) {
  final value = double.tryParse('${line['unit_price'] ?? ''}');
  return value ?? 0;
}

double salesOrderLineExtension(Map<String, dynamic> line) {
  return salesOrderLineQuantity(line) * salesOrderLineUnitPrice(line);
}
