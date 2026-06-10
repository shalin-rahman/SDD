---
name: emcap-workflow-rules
description: >-
  EMCAP workflow engine and formula rule engine. Use when implementing workflows,
  transitions, SLA escalation, delegation, or business rule formulas.
---

# EMCAP Workflow & Rules

## Workflow (SDD §10)

Definitions: `emcap.workflow.models.WorkflowDefinition`

Demo workflow: `CUSTOMER_APPROVAL` in `modules/demo/module.py`

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/workflows/{code}/start` | Start instance |
| `POST /api/v1/workflows/instances/{id}/transition` | State transition |
| `POST /api/v1/workflows/instances/{id}/delegate` | Delegation |
| `POST /api/v1/workflows/escalate` | SLA escalation |

Engine: `emcap.workflow.engine.WorkflowEngine`

Features: escalation, delegation, SLA (`due_at`, `escalated_at`)

## Rule engine (SDD §11)

Formula mode only when `rules.formula_enabled: true`

`POST /api/v1/workflows/rules/evaluate`

```json
{"expression": "amount > 100 and active == True", "context": {"amount": 150, "active": true}}
```

Engine: `emcap.rules.engine.evaluate_formula()` — safe AST evaluation only.

## Module registration

Add `WorkflowDefinition` to `ModuleDefinition.workflows` list.
