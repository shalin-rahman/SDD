# Angular web client

Metadata-driven UI. Shared contract in `src/metadata/contract.ts`.

- `dynamic-form.component.ts` — `DynamicFormRenderer`
- `dynamic-grid.component.ts` — `DynamicGridRenderer`

Fetch metadata from `GET /api/v1/metadata/forms/{entity}` and `/grids/{entity}`.

## Lint

```bash
cd clients/web
npm ci
npm run lint
```
