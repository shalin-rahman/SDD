import {
  buildPaymentSummaryLabels,
  filterCustomerPayments,
  filterVendorPayments,
  formatPaymentAmount,
  formatPaymentCell,
  formatPaymentDate,
  hasOutstandingBalance,
  paymentAmount,
  paymentNumberLabel,
  paymentStatusLabel,
  sumPaymentAmounts,
} from './payment.util';

describe('payment.util', () => {
  const vendorPayments = [
    { id: 'vp1', po_id: 'po-1', payment_number: 'VP-001', amount: 100, payment_date: '2026-01-15', status: 'posted' },
    { id: 'vp2', po_id: 'po-2', payment_number: 'VP-002', amount: 50, status: 'draft' },
    { id: 'vp3', po_id: 'po-1', payment_number: 'VP-003', amount: 25, status: 'posted' },
  ];

  const customerPayments = [
    { id: 'cp1', invoice_id: 'inv-1', payment_number: 'CP-001', amount: 200, status: 'posted' },
    { id: 'cp2', invoice_id: 'inv-2', payment_number: 'CP-002', amount: 75, status: 'void' },
  ];

  it('filters payments by parent document', () => {
    expect(filterVendorPayments(vendorPayments, 'po-1').length).toBe(2);
    expect(filterVendorPayments(vendorPayments, 'missing')).toEqual([]);
    expect(filterCustomerPayments(customerPayments, 'inv-1').length).toBe(1);
  });

  it('sums and formats payment amounts', () => {
    const filtered = filterVendorPayments(vendorPayments, 'po-1');
    expect(paymentAmount(filtered[0])).toBe(100);
    expect(sumPaymentAmounts(filtered)).toBe(125);
    expect(formatPaymentAmount(0)).toBe('—');
    expect(formatPaymentCell({ amount: 42.5 })).toContain('42.50');
  });

  it('formats payment metadata and summary labels with locale', () => {
    expect(paymentNumberLabel({ payment_number: 'P-1' })).toBe('P-1');
    expect(paymentNumberLabel({ id: 'x' })).toBe('x');
    expect(paymentStatusLabel({ status: 'posted' })).toBe('posted');
    expect(paymentStatusLabel({})).toBe('—');
    expect(formatPaymentDate({})).toBe('—');
    expect(formatPaymentDate({ payment_date: '2026-03-01' }, 'en-US')).not.toBe('—');

    const summary = buildPaymentSummaryLabels(
      { total_amount: 500, amount_paid: 200, balance_due: 300 },
      'total_amount',
      'USD',
      'en-US',
    );
    expect(summary.total).toContain('500');
    expect(summary.paid).toContain('200');
    expect(summary.balance).toContain('300');
    expect(hasOutstandingBalance({ balance_due: 1 })).toBeTrue();
    expect(hasOutstandingBalance({ balance_due: 0 })).toBeFalse();

    const bnSummary = buildPaymentSummaryLabels(
      { amount: 100, amount_paid: 0, balance_due: 100 },
      'amount',
      'BDT',
      'bn-BD',
    );
    expect(bnSummary.balance).toContain('৳');
    expect(bnSummary.balance).not.toMatch(/[0-9]/);
  });

  it('handles invalid amounts and missing balance fields', () => {
    expect(paymentAmount({ amount: 'bad' })).toBe(0);
    expect(formatPaymentAmount(10)).toContain('10.00');
    expect(hasOutstandingBalance({})).toBeFalse();
    expect(sumPaymentAmounts([{ amount: 'x' }, { amount: 5 }])).toBe(5);
  });

  it('labels payments by id when payment_number is blank', () => {
    expect(paymentNumberLabel({ payment_number: '  ', id: 'pay-99' })).toBe('pay-99');
  });
});
