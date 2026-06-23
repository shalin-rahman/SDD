import 'locale_format_util.dart';

/// Payment summary + AP/AR action helpers — web entity-record parity.

const vendorPaymentEntityCode = 'VENDOR_PAYMENT';
const customerPaymentEntityCode = 'CUSTOMER_PAYMENT';
const vendorPaymentPoField = 'po_id';
const customerPaymentInvoiceField = 'invoice_id';

class PaymentSummary {
  const PaymentSummary({
    required this.total,
    required this.paid,
    required this.balance,
  });

  final double total;
  final double paid;
  final double balance;
}

double _amount(dynamic value) {
  return double.tryParse('$value') ?? 0;
}

bool hasOutstandingBalance(Map<String, dynamic> record) {
  return _amount(record['balance_due']) > 0;
}

bool showPaymentSummaryCard(String entityCode) {
  return entityCode == 'PURCHASE_ORDER' || entityCode == 'INVOICE';
}

PaymentSummary? buildPaymentSummary(
  String entityCode,
  Map<String, dynamic> record,
) {
  if (entityCode == 'PURCHASE_ORDER') {
    final total = _amount(record['total_amount']);
    final paid = _amount(record['amount_paid']);
    final balance = record.containsKey('balance_due')
        ? _amount(record['balance_due'])
        : total - paid;
    return PaymentSummary(total: total, paid: paid, balance: balance);
  }
  if (entityCode == 'INVOICE') {
    final total = _amount(record['amount']);
    final paid = _amount(record['amount_paid']);
    final balance = record.containsKey('balance_due')
        ? _amount(record['balance_due'])
        : total - paid;
    return PaymentSummary(total: total, paid: paid, balance: balance);
  }
  return null;
}

bool canRecordVendorPayment(
  String entityCode,
  Map<String, dynamic> record, {
  String? recordId,
  bool creatingNew = false,
}) {
  final id = recordId ?? '${record['id'] ?? ''}';
  if (entityCode != 'PURCHASE_ORDER' || id.isEmpty || creatingNew) {
    return false;
  }
  if ('${record['status'] ?? ''}' == 'cancelled') {
    return false;
  }
  return hasOutstandingBalance(record);
}

bool canCollectCustomerPayment(
  String entityCode,
  Map<String, dynamic> record, {
  String? recordId,
  bool creatingNew = false,
}) {
  final id = recordId ?? '${record['id'] ?? ''}';
  if (entityCode != 'INVOICE' || id.isEmpty || creatingNew) {
    return false;
  }
  final status = '${record['status'] ?? ''}';
  if (status == 'paid' || status == 'void') {
    return false;
  }
  return hasOutstandingBalance(record);
}

Map<String, String> vendorPaymentPrefill(
  Map<String, dynamic> poRecord,
  String poId,
) {
  final prefill = <String, String>{'po_id': poId};
  final supplierId = poRecord['supplier_id'];
  if (supplierId != null && '$supplierId'.isNotEmpty) {
    prefill['supplier_id'] = '$supplierId';
  }
  return prefill;
}

Map<String, String> customerPaymentPrefill(
  Map<String, dynamic> invoiceRecord,
  String invoiceId,
) {
  final prefill = <String, String>{'invoice_id': invoiceId};
  final customerId = invoiceRecord['customer_id'];
  if (customerId != null && '$customerId'.isNotEmpty) {
    prefill['customer_id'] = '$customerId';
  }
  return prefill;
}

List<Map<String, dynamic>> filterPaymentsByParent(
  List<Map<String, dynamic>> payments,
  String parentField,
  String parentId,
) {
  return payments
      .where((row) => '${row[parentField] ?? ''}' == parentId)
      .toList();
}

List<Map<String, dynamic>> filterVendorPayments(
  List<Map<String, dynamic>> payments,
  String poId,
) {
  return filterPaymentsByParent(payments, vendorPaymentPoField, poId);
}

List<Map<String, dynamic>> filterCustomerPayments(
  List<Map<String, dynamic>> payments,
  String invoiceId,
) {
  return filterPaymentsByParent(payments, customerPaymentInvoiceField, invoiceId);
}

bool showVendorPaymentsSection(String entityCode) {
  return entityCode == 'PURCHASE_ORDER';
}

bool showCustomerPaymentsSection(String entityCode) {
  return entityCode == 'INVOICE';
}

double paymentAmount(Map<String, dynamic> payment) {
  return _amount(payment['amount']);
}

String paymentNumberLabel(Map<String, dynamic> payment) {
  final num = '${payment['payment_number'] ?? ''}'.trim();
  return num.isNotEmpty ? num : '${payment['id'] ?? '—'}';
}

String paymentStatusLabel(Map<String, dynamic> payment) {
  final status = '${payment['status'] ?? ''}'.trim();
  return status.isNotEmpty ? status : '—';
}

String formatPaymentAmount(
  double amount, {
  String currencyCode = 'USD',
  String locale = 'en-US',
}) {
  if (amount == 0) {
    return '—';
  }
  return formatCurrency(amount, currencyCode, locale);
}

String formatPaymentDate(
  Map<String, dynamic> payment, {
  String locale = 'en-US',
}) {
  final raw = payment['payment_date'];
  if (raw == null || raw == '') {
    return '—';
  }
  final parsed = DateTime.tryParse('$raw');
  if (parsed == null) {
    return '$raw';
  }
  return formatDate(parsed, locale);
}
