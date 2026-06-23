import 'lookup_display.dart';

/// Resolve product_id to display label — web `movement-line.util` parity.
String resolveProductLabel(String productId, Map<String, String> labels) {
  if (productId.isEmpty) {
    return '—';
  }
  return labels[productId] ?? productId;
}

Map<String, String> buildProductLabelMap(List<Map<String, dynamic>> products) {
  final map = <String, String>{};
  for (final product in products) {
    final id = '${product['id'] ?? ''}';
    if (id.isEmpty) {
      continue;
    }
    map[id] = resolveRecordDisplayLabel(product);
  }
  return map;
}

String orderLineProductLabel(Map<String, dynamic> line, Map<String, String> labels) {
  return resolveProductLabel('${line['product_id'] ?? ''}', labels);
}

double orderLineQuantity(Map<String, dynamic> line) {
  final raw = line['quantity'] ?? line['qty'];
  final value = double.tryParse('$raw');
  return value ?? 0;
}

double orderLineUnitPrice(Map<String, dynamic> line) {
  final value = double.tryParse('${line['unit_price'] ?? ''}');
  return value ?? 0;
}

double orderLineExtension(Map<String, dynamic> line) {
  return orderLineQuantity(line) * orderLineUnitPrice(line);
}

double sumOrderLineQuantities(List<Map<String, dynamic>> lines) {
  return lines.fold(0.0, (sum, line) => sum + orderLineQuantity(line));
}

double sumOrderLineExtensions(List<Map<String, dynamic>> lines) {
  return lines.fold(0.0, (sum, line) => sum + orderLineExtension(line));
}
