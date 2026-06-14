/** True when workflow module and engine are enabled in platform config. */
export function isWorkflowEnabled(config: Record<string, unknown>): boolean {
  const modules = config.modules as Record<string, { enabled?: boolean }> | undefined;
  if (modules?.workflow?.enabled === false) {
    return false;
  }
  const workflow = config.workflow as { enabled?: boolean } | undefined;
  if (workflow?.enabled === false) {
    return false;
  }
  return true;
}

/** Entity code → default workflow start action (reference modules). */
export const ENTITY_START_WORKFLOW: Record<string, string> = {
  PRODUCT: 'STOCK_ADJUSTMENT',
};

export function entityStartWorkflowCode(entityCode: string): string | null {
  return ENTITY_START_WORKFLOW[entityCode] ?? null;
}
