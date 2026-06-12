import type { ConditionalRule, FormFieldMetadata, FormMetadata } from "./metadata/contract";
import { resolveFieldLabel } from "./metadata/contract";

export class DynamicFormRenderer {
  constructor(
    private readonly metadata: FormMetadata,
    private readonly locale = "en",
  ) {}

  fieldNames(): string[] {
    return this.metadata.sections.flatMap((section) => section.fields.map((field) => field.name));
  }

  fields(): FormFieldMetadata[] {
    return this.metadata.sections.flatMap((section) => section.fields);
  }

  getField(name: string): FormFieldMetadata | undefined {
    return this.fields().find((field) => field.name === name);
  }

  label(name: string): string {
    const field = this.getField(name);
    return field ? resolveFieldLabel(field, this.locale) : name;
  }

  isRequired(name: string): boolean {
    return this.metadata.sections.some((section) =>
      section.fields.some((field) => field.name === name && field.required),
    );
  }

  isVisible(name: string, values: Record<string, unknown>): boolean {
    const conditions = this.metadata.conditions ?? [];
    let visible = true;
    for (const rule of conditions) {
      if (!rule.targets.includes(name)) {
        continue;
      }
      const matches = evaluateCondition(rule, values);
      if (rule.action === "show") {
        visible = visible && matches;
      } else if (rule.action === "hide") {
        visible = visible && !matches;
      }
    }
    return visible;
  }

  visibleFieldNames(values: Record<string, unknown>): string[] {
    return this.fieldNames().filter((name) => this.isVisible(name, values));
  }

  validate(values: Record<string, unknown>): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const field of this.fields()) {
      if (!this.isVisible(field.name, values)) {
        continue;
      }
      const value = values[field.name];
      const message = validateField(field, value);
      if (message) {
        errors[field.name] = message;
      }
    }
    return errors;
  }

  layoutStyle(field: FormFieldMetadata): Record<string, string> {
    const colStart = field.col + 1;
    const colEnd = colStart + Math.max(1, field.span);
    return {
      gridColumn: `${colStart} / ${colEnd}`,
      gridRow: String(field.row + 1),
    };
  }

  createInputElement(field: FormFieldMetadata, value: unknown): HTMLInputElement | HTMLSelectElement {
    const type = field.field_type ?? "text";
    if (type === "checkbox") {
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(value);
      return input;
    }
    const input = document.createElement("input");
    input.type = type === "number" ? "number" : type === "date" ? "date" : type === "email" ? "email" : "text";
    if (value !== undefined && value !== null) {
      input.value = String(value);
    }
    return input;
  }
}

function evaluateCondition(rule: ConditionalRule, values: Record<string, unknown>): boolean {
  const left = values[rule.field];
  const right = rule.value;
  switch (rule.operator) {
    case "equals":
      return left === right || String(left) === String(right);
    case "not_equals":
      return left !== right;
    default:
      return Boolean(left);
  }
}

export function validateField(field: FormFieldMetadata, value: unknown): string | null {
  const rules = field.validation ?? [];
  if (field.required && (value === undefined || value === null || value === "")) {
    return rules.find((r) => r.rule === "required")?.message ?? `${field.label} is required`;
  }
  if (value === undefined || value === null || value === "") {
    return null;
  }
  for (const rule of rules) {
    if (rule.rule === "email" && typeof value === "string" && !value.includes("@")) {
      return rule.message;
    }
    if (rule.rule === "min" && typeof value === "string" && Number(value) < Number(rule.value ?? 0)) {
      return rule.message;
    }
  }
  return null;
}
