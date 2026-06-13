import { canDeleteRecord, canRestoreRecord, isRecordDeleted } from './record-lifecycle.util';

describe('record-lifecycle.util', () => {
  it('detects soft-deleted records', () => {
    expect(isRecordDeleted({})).toBe(false);
    expect(isRecordDeleted({ deleted_at: null })).toBe(false);
    expect(isRecordDeleted({ deleted_at: '2026-01-01T00:00:00Z' })).toBe(true);
  });

  it('gates delete and restore actions', () => {
    const active = { id: '1' };
    const deleted = { id: '1', deleted_at: '2026-01-01T00:00:00Z' };
    expect(canDeleteRecord('1', active, false)).toBe(true);
    expect(canDeleteRecord('1', deleted, false)).toBe(false);
    expect(canRestoreRecord('1', deleted)).toBe(true);
    expect(canRestoreRecord('1', active)).toBe(false);
  });
});
