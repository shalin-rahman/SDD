import { formatGridCellValue } from './field-display.util';
import { formatCurrency, formatDate, type LocaleTag } from './locale-format.util';

export const VENDOR_PAYMENT_PO_FIELD = 'po_id';
export const CUSTOMER_PAYMENT_INVOICE_FIELD = 'invoice_id';

export interface PaymentSummaryLabels {
  total: string;
  paid: string;
  balance: string;
}

/** Filter payment rows allocated to a parent document. */
export function filterPaymentsByParent(
  payments: Record<string, unknown>[],
  parentField: string,
  parentId: string,
): Record<string, unknown>[] {
  return payments.filter((row) => String(row[parentField] ?? '') === parentId);
}

export function filterVendorPayments(
  payments: Record<string, unknown>[],
  poId: string,
): Record<string, unknown>[] {
  return filterPaymentsByParent(payments, VENDOR_PAYMENT_PO_FIELD, poId);
}

export function filterCustomerPayments(
  payments: Record<string, unknown>[],
  invoiceId: string,
): Record<string, unknown>[] {
  return filterPaymentsByParent(payments, CUSTOMER_PAYMENT_INVOICE_FIELD, invoiceId);
}

export function paymentAmount(payment: Record<string, unknown>): number {
  const value = Number(payment['amount']);
  return Number.isFinite(value) ? value : 0;
}

export function sumPaymentAmounts(payments: Record<string, unknown>[]): number {
  return payments.reduce((sum, row) => sum + paymentAmount(row), 0);
}

export function formatPaymentAmount(
  amount: number,
  currencyCode = 'USD',
  localeTag: LocaleTag = 'en-US',
): string {
  if (amount === 0) {
    return '—';
  }
  return formatCurrency(amount, currencyCode, localeTag);
}

export function formatPaymentCell(
  payment: Record<string, unknown>,
  currencyCode = 'USD',
  localeTag: LocaleTag = 'en-US',
): string {
  return formatPaymentAmount(paymentAmount(payment), currencyCode, localeTag);
}

export function formatPaymentDate(
  payment: Record<string, unknown>,
  localeTag: LocaleTag = 'en-US',
): string {
  const raw = payment['payment_date'];
  if (raw === undefined || raw === null || raw === '') {
    return '—';
  }
  try {
    return formatDate(raw as string | Date, localeTag);
  } catch {
    return formatGridCellValue('payment_date', raw, { fieldType: 'date' });
  }
}

export function paymentNumberLabel(payment: Record<string, unknown>): string {
  const num = String(payment['payment_number'] ?? '').trim();
  return num || String(payment['id'] ?? '—');
}

export function paymentStatusLabel(payment: Record<string, unknown>): string {
  const status = String(payment['status'] ?? '').trim();
  return status || '—';
}

export function numericField(record: Record<string, unknown>, field: string): number {
  const value = Number(record[field]);
  return Number.isFinite(value) ? value : 0;
}

/** Build formatted total / paid / balance labels from a parent record. */
export function buildPaymentSummaryLabels(
  record: Record<string, unknown>,
  totalField: string,
  currencyCode = 'USD',
  localeTag: LocaleTag = 'en-US',
): PaymentSummaryLabels {
  const total = numericField(record, totalField);
  const paid = numericField(record, 'amount_paid');
  const balance = numericField(record, 'balance_due');
  return {
    total: formatPaymentAmount(total, currencyCode, localeTag),
    paid: formatPaymentAmount(paid, currencyCode, localeTag),
    balance: formatPaymentAmount(balance, currencyCode, localeTag),
  };
}

export function hasOutstandingBalance(record: Record<string, unknown>): boolean {
  return numericField(record, 'balance_due') > 0;
}
