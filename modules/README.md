# Business modules

Each module exports `MODULE: ModuleDefinition` from `module.py`.

| Module | Entities | Notes |
|--------|----------|-------|
| `demo` | `CUSTOMER` | Scaffold example |
| `inventory` | `PRODUCT`, `WAREHOUSE` | Phase 5 reference module |
| `crm` | `LEAD`, `CONTACT` | Phase 8 reference module (avoids `CUSTOMER` clash with demo) |
| `accounting` | `ACCOUNT`, `JOURNAL_ENTRY` | Phase 9 SDD §27 |
| `hrm` | `EMPLOYEE`, `LEAVE_REQUEST` | Phase 9 SDD §27 |
| `pos` | `SALE`, `TERMINAL` | Phase 9 SDD §27 |

Example: `modules/demo/module.py` registers the `CUSTOMER` entity with CRUD, audit, menus, and permissions — no platform core changes.

```python
# modules/<name>/module.py
from emcap.module.models import ModuleDefinition

MODULE = ModuleDefinition(
    code="MYMODULE",
    name="My Module",
    entities=[...],
    menus=[...],
)
```

Platform discovers modules via `EMCAP_MODULES_PATH` (default: `SDD/modules/`).
