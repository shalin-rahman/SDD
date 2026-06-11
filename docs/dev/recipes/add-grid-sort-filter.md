# Recipe — Grid sort + filter

## Checklist

1. Read `sortable` / `filterable` on grid column metadata.
2. Web `dynamic-grid.component.ts` — click header toggles asc/desc sort.
3. Filter row under headers when `filterable: true`.
4. Mobile `DataTable` — `onSort` + filter `TextField` per column.
5. Sort/filter applies to in-memory `currentRecords` before render.

## Verify

Manual: Products grid — sort by name, filter SKU.
