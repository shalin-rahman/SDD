import { describe, expect, it } from "vitest";

import { DynamicFormRenderer, validateField } from "./dynamic-form.component";
import type { FormMetadata } from "./metadata/contract";

const sampleForm: FormMetadata = {
  schema_version: "1.0",
  entity_code: "PRODUCT",
  sections: [
    {
      code: "main",
      label: "Main",
      fields: [
        {
          name: "sku",
          label: "SKU",
          field_type: "text",
          required: true,
          row: 0,
          col: 0,
          span: 6,
          validation: [{ rule: "required", message: "SKU is required" }],
        },
        {
          name: "email",
          label: "Email",
          field_type: "email",
          required: false,
          row: 0,
          col: 6,
          span: 6,
          validation: [{ rule: "email", message: "Invalid email" }],
        },
      ],
    },
  ],
  conditions: [
    { field: "active", operator: "equals", value: true, action: "show", targets: ["email"] },
  ],
  i18n: { en: { title: "Product" } },
};

describe("DynamicFormRenderer", () => {
  it("validates required fields", () => {
    const renderer = new DynamicFormRenderer(sampleForm);
    const errors = renderer.validate({ sku: "" });
    expect(errors.sku).toBe("SKU is required");
  });

  it("hides conditional fields", () => {
    const renderer = new DynamicFormRenderer(sampleForm);
    expect(renderer.isVisible("email", { active: false })).toBe(false);
    expect(renderer.isVisible("email", { active: true })).toBe(true);
  });

  it("validates email rule", () => {
    const field = sampleForm.sections[0].fields[1];
    expect(validateField(field, "bad")).toBe("Invalid email");
    expect(validateField(field, "a@b.com")).toBeNull();
  });

  it("applies layout grid row/col/span", () => {
    const renderer = new DynamicFormRenderer(sampleForm);
    const sku = renderer.getField("sku");
    expect(renderer.layoutStyle(sku!)).toEqual({ gridColumn: "1 / 7", gridRow: "1" });
    const email = renderer.getField("email");
    expect(renderer.layoutStyle(email!)).toEqual({ gridColumn: "7 / 13", gridRow: "1" });
  });
});
