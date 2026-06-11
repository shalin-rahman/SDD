# Recipe — Add platform route

Generic platform HTTP surface (not business-module-specific).

## Checklist

1. **Service** — `platform/api/src/emcap/<domain>/service.py` (business-agnostic logic)
2. **Route** — `platform/api/src/emcap/api/routes/<name>.py` with `APIRouter`
3. **Register** — `app.include_router(...)` in `platform/api/src/emcap/main.py`
4. **Test** — `platform/api/tests/test_client_api_gaps.py` or domain test file
5. **Traceability** — row in `spec/sdd/03-traceability-matrix.md`
6. **Client** (if user-facing) — follow `add-client-api-method.md`

## Route template

```python
@router.get("/{entity_code}/example")
def example(entity_code: str, request: Request, ...) -> dict[str, Any]:
    registry = cast(EntityRegistry, request.app.state.entity_registry)
    session = _session(request)
    try:
        return SomeService(session, registry, tenant_id=tenant_id).method(entity_code)
    except EntityRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        session.close()
```

## Verify

```powershell
cd platform/api
python -m pytest -q tests/test_client_api_gaps.py
ruff check src tests
```
