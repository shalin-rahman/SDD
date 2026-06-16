import { I18nService } from '../services/i18n.service';
import { workflowStateLabel } from './workflow-state.util';

describe('workflowStateLabel', () => {
  const i18n = new I18nService();

  it('localizes known workflow states', () => {
    expect(workflowStateLabel('draft', i18n)).toBe('Draft');
    expect(workflowStateLabel('submitted', i18n)).toBe('Submitted');
    expect(workflowStateLabel('approved', i18n)).toBe('Approved');
  });

  it('falls back to raw code for unknown states', () => {
    expect(workflowStateLabel('custom_state', i18n)).toBe('custom_state');
  });
});
