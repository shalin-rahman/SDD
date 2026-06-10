import { GridMetadata } from "./metadata/contract";

export class DynamicGridRenderer {
  constructor(private readonly metadata: GridMetadata) {}

  columnFields(): string[] {
    return this.metadata.columns.map((column) => column.field);
  }

  exportEnabled(): boolean {
    return this.metadata.export.excel || this.metadata.export.pdf || this.metadata.export.csv;
  }
}
