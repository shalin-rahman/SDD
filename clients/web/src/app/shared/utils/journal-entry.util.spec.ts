import {
  buildAccountLabelMap,
  canAddJournalLine,
  canPostJournalEntry,
  canVoidJournalEntry,
  filterJournalLines,
  formatJournalLineAmount,
  formatJournalLinesTotal,
  journalLineAccountLabel,
  sumJournalLineAmounts,
} from './journal-entry.util';

describe('journal-entry.util', () => {
  it('filters lines by journal_entry_id', () => {
    const lines = [
      { id: '1', journal_entry_id: 'je-1', debit: 10 },
      { id: '2', journal_entry_id: 'je-2', debit: 5 },
    ];
    expect(filterJournalLines(lines, 'je-1').length).toBe(1);
  });

  it('sums debits and credits', () => {
    const lines = [
      { debit: 100, credit: 0 },
      { debit: 50, credit: 25 },
    ];
    expect(sumJournalLineAmounts(lines, 'debit')).toBe(150);
    expect(sumJournalLineAmounts(lines, 'credit')).toBe(25);
  });

  it('formats zero amounts as dash', () => {
    expect(formatJournalLineAmount({ debit: 0 }, 'debit')).toBe('—');
    expect(formatJournalLinesTotal(0)).toBe('—');
  });

  it('builds account labels and resolves line account', () => {
    const labels = buildAccountLabelMap([{ id: 'acct-1', code: '1000', name: 'Cash' }]);
    expect(labels['acct-1']).toBe('Cash');
    expect(journalLineAccountLabel({ account_id: 'acct-1' }, labels)).toBe('Cash');
    expect(journalLineAccountLabel({ account_id: 'missing' }, labels)).toBe('missing');
    expect(journalLineAccountLabel({}, labels)).toBe('—');
  });

  it('gates post, void, and add-line by status', () => {
    const draft = { status: 'draft' };
    const posted = { status: 'posted' };
    const opts = { recordId: 'je-1', creatingNew: false };

    expect(canPostJournalEntry('JOURNAL_ENTRY', draft, opts)).toBeTrue();
    expect(canPostJournalEntry('JOURNAL_ENTRY', posted, opts)).toBeFalse();
    expect(canPostJournalEntry('INVOICE', draft, opts)).toBeFalse();
    expect(canPostJournalEntry('JOURNAL_ENTRY', draft, { creatingNew: true })).toBeFalse();

    expect(canVoidJournalEntry('JOURNAL_ENTRY', posted, opts)).toBeTrue();
    expect(canVoidJournalEntry('JOURNAL_ENTRY', draft, opts)).toBeFalse();
    expect(canVoidJournalEntry('JOURNAL_ENTRY', posted, { recordId: null })).toBeFalse();

    expect(canAddJournalLine('JOURNAL_ENTRY', draft, opts)).toBeTrue();
    expect(canAddJournalLine('JOURNAL_ENTRY', posted, opts)).toBeFalse();
  });
});
