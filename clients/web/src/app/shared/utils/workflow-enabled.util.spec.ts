import { entityStartWorkflowCode, isWorkflowEnabled } from './workflow-enabled.util';

describe('isWorkflowEnabled', () => {
  it('returns true when workflow module and engine are enabled', () => {
    expect(
      isWorkflowEnabled({
        modules: { workflow: { enabled: true } },
        workflow: { enabled: true },
      }),
    ).toBeTrue();
  });

  it('returns false when workflow module is disabled', () => {
    expect(isWorkflowEnabled({ modules: { workflow: { enabled: false } } })).toBeFalse();
  });

  it('returns false when workflow engine is disabled', () => {
    expect(isWorkflowEnabled({ workflow: { enabled: false } })).toBeFalse();
  });
});

describe('entityStartWorkflowCode', () => {
  it('returns STOCK_ADJUSTMENT for PRODUCT', () => {
    expect(entityStartWorkflowCode('PRODUCT')).toBe('STOCK_ADJUSTMENT');
  });

  it('returns null for entities without a start workflow', () => {
    expect(entityStartWorkflowCode('WAREHOUSE')).toBeNull();
  });
});
