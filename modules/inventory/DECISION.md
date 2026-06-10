# P5-T01 — Reference Module Choice

**Decision:** Inventory is the Phase 5 reference business module. SDD §27 lists Inventory first among plug-in modules, and it exercises the Definition-of-Done surface area naturally: multiple entities (`PRODUCT`, `WAREHOUSE`), a stock-adjustment workflow with escalation and delegation, valuation and low-stock reports, an overview dashboard, and navigation menus — all declared in `ModuleDefinition` without modifying `platform/` core.
