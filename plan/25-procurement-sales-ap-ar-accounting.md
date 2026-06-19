# Phase 25 — Procurement / Sales / AP-AR / Accounting

**Parent:** `plan/17-standard-product-execution-playbook.md`  
**Pattern source:** W5 `modules/inventory/stock_movement.py` + P24 movement-line UX  
**Scope lock:** Lean AP — PO + lines → receive (stock) → multiple payments on PO. Mirror AR: SO + lines → invoice → multiple customer payments.

---

## Requirements

| ID | Scope |
|----|-------|
| FR-025 | Procurement AP: PO lines, receive spawns stock movement, multi vendor payment |
| FR-026 | Sales AR: SO lines, invoice partial/paid status, multi customer payment |
| FR-027 | GL double-entry: JOURNAL_ENTRY + JOURNAL_ENTRY_LINE, account balance rollup on post |

---

## Entity model

| Entity | Module | Key fields |
|--------|--------|------------|
| `PURCHASE_ORDER_LINE` | procurement | `po_id`, `product_id`, `quantity`, `unit_price` |
| `SALES_ORDER_LINE` | sales | `sales_order_id`, `product_id`, `quantity`, `unit_price` |
| `VENDOR_PAYMENT` | procurement | `payment_number`, `po_id`, `supplier_id`, `amount`, `payment_date`, `payment_method`, `status` |
| `CUSTOMER_PAYMENT` | sales | `payment_number`, `invoice_id`, `customer_id`, `amount`, `payment_date`, `payment_method`, `status` |
| `JOURNAL_ENTRY_LINE` | accounting | `journal_entry_id`, `account_id`, `debit`, `credit`, `memo` |

### Header extensions

| Entity | Fields |
|--------|--------|
| `PURCHASE_ORDER` | `amount_paid`, `balance_due` |
| `INVOICE` | `amount_paid`, `balance_due`; status adds `partial` |
| `ACCOUNT` | `account_type` enum |
| `JOURNAL_ENTRY` | `source_type`, `source_id`, `status` |

---

## Domain validators

| File | Entity | Responsibilities |
|------|--------|------------------|
| `modules/procurement/purchase_order.py` | PURCHASE_ORDER | Line rollup; on `received` spawn STOCK_MOVEMENT + lines |
| `modules/procurement/vendor_payment.py` | VENDOR_PAYMENT | Overpay guard; on `posted` update PO balances + JE |
| `modules/sales/sales_order.py` | SALES_ORDER | Line rollup totals |
| `modules/sales/customer_payment.py` | CUSTOMER_PAYMENT | Overpay guard; on `posted` update invoice + JE |
| `modules/accounting/journal.py` | JOURNAL_ENTRY | Double-entry balance check; ACCOUNT.balance rollup |

---

## Security

| Permission | Purpose |
|------------|---------|
| `procurement.pay` | Post vendor payments |
| `sales.collect` | Post customer payments |
| `accounting.post` | Post journal entries |
| `accounting.view` | Read financial field amounts |

Finance fields use `read_roles=["accounting.view"]` on unit prices, balances, debits/credits.

---

## Execution waves

| Task | Wave | Deliverable |
|------|------|-------------|
| P25-T01 | W1 | This plan + FR IDs + backlog rows |
| P25-T02 | W1 | PO_LINE + SO_LINE entities + fixtures + pytest |
| P25-T03 | W2 | PO receive validator + STOCK_MOVEMENT spawn |
| P25-T04 | W2 | VENDOR/CUSTOMER_PAYMENT + multi-pay tests |
| P25-T05 | W2 | JOURNAL_ENTRY_LINE + double-entry post |
| P25-T06 | W2 | Finance permissions + field security tests |
| P25-T07–T13 | W3–W6 | Web/mobile UX, seed, product-ready (separate agents) |

---

## Verify (backend W1–W2)

```powershell
cd platform/api
python -m pytest -q tests/test_purchase_order_entities.py tests/test_vendor_payment_entities.py tests/test_sales_order_entities.py tests/test_customer_payment_entities.py tests/test_journal_double_entry.py tests/test_order_chain_entities.py tests/test_procurement_sales_entity_fields.py tests/test_platform_core_unchanged.py tests/test_entity_system_contract.py --cov=src --cov-fail-under=80
```
