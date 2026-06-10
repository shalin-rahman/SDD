# Business modules

Each module exports `MODULE: ModuleDefinition` from `module.py`.

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
