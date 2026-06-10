import { FormMetadata } from "./metadata/contract";

export class DynamicFormRenderer {
  constructor(private readonly metadata: FormMetadata) {}

  fieldNames(): string[] {
    return this.metadata.sections.flatMap((section) => section.fields.map((field) => field.name));
  }

  isRequired(name: string): boolean {
    return this.metadata.sections.some((section) =>
      section.fields.some((field) => field.name === name && field.required),
    );
  }
}
