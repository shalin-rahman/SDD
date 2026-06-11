import { describe, expect, it } from "vitest";

import { DynamicGridRenderer } from "./dynamic-grid.component";
import type { GridMetadata } from "./metadata/contract";

const sampleGrid: GridMetadata = {
  schema_version: "1.0",
  entity_code: "PRODUCT",
  columns: [
    { field: "sku", label: "SKU", sortable: true, filterable: true },
    { field: "name", label: "Name", sortable: true, filterable: true },
  ],
  export: { excel: true, pdf: true, csv: true },
  grouping: true,
  realtime: true,
  offline: true,
};

const rows = [
  { id: "1", sku: "B", name: "Beta" },
  { id: "2", sku: "A", name: "Alpha" },
];

describe("DynamicGridRenderer", () => {
  it("sorts records ascending", () => {
    const renderer = new DynamicGridRenderer(sampleGrid);
    const sorted = renderer.sortRecords(rows, "sku", "asc");
    expect(sorted[0].sku).toBe("A");
  });

  it("filters records by column", () => {
    const renderer = new DynamicGridRenderer(sampleGrid);
    const filtered = renderer.filterRecords(rows, { name: "alp" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Alpha");
  });

  it("paginates records", () => {
    const renderer = new DynamicGridRenderer(sampleGrid);
    expect(renderer.paginate(rows, 1, 1)).toHaveLength(1);
    expect(renderer.paginate(rows, 2, 1)[0].sku).toBe("A");
  });
});
