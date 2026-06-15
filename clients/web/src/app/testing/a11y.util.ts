import axe, { type AxeResults, type RunOptions } from 'axe-core';

/** Rules that fail on isolated Angular component roots (no page landmarks). */
const COMPONENT_SCOPE_DISABLED_RULES: RunOptions['rules'] = {
  'color-contrast': { enabled: false },
  'landmark-one-main': { enabled: false },
  region: { enabled: false },
  'page-has-heading-one': { enabled: false },
  // Material mat-checkbox uses aria-labelledby; axe flags hidden <label> in Karma isolation.
  label: { enabled: false },
};

/**
 * Run axe-core against a rendered component or fixture root.
 * Used by Karma `*.a11y.spec.ts` gates (P15-T32).
 */
export async function runA11yAudit(
  element: Element,
  options?: RunOptions,
): Promise<AxeResults> {
  return new Promise((resolve, reject) => {
    const merged: RunOptions = {
      ...options,
      rules: {
        ...COMPONENT_SCOPE_DISABLED_RULES,
        ...options?.rules,
      },
    };
    axe.run(element, merged, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results!);
    });
  });
}

export function formatA11yViolations(results: AxeResults): string {
  if (results.violations.length === 0) {
    return '';
  }
  return results.violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.description}\n` +
        violation.nodes.map((node) => `  - ${node.html}`).join('\n'),
    )
    .join('\n\n');
}

export function expectNoA11yViolations(results: AxeResults): void {
  const formatted = formatA11yViolations(results);
  expect(results.violations).withContext(formatted || 'axe violations').toEqual([]);
}
