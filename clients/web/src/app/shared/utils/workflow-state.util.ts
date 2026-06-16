import type { I18nService } from '../services/i18n.service';

/** Maps workflow `current_state` codes to localized labels; falls back to raw code. */
export function workflowStateLabel(state: string, i18n: I18nService): string {
  const trimmed = state.trim();
  if (!trimmed) {
    return i18n.t('common.emptyValue');
  }
  const key = `platform.workflow.state.${trimmed}`;
  const label = i18n.t(key);
  return label === key ? trimmed : label;
}
