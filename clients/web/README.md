# EMCAP Angular web client

Full **Angular CLI 19** application — metadata-driven presentation shell aligned with **SDD §9**. Replaces the archived Vite thin shell in `clients/web-legacy/`.

## Structure

| Path | Role |
|------|------|
| `src/app/api/emcap-client.ts` | Platform HTTP client (40+ methods) |
| `src/app/metadata/contract.ts` | Form/grid metadata types |
| `src/app/metadata/dynamic-form.renderer.ts` | Validation, conditions, layout grid |
| `src/app/metadata/dynamic-grid.renderer.ts` | Sort, filter, group, paginate |
| `src/app/services/auth.service.ts` | Session token + tenant |
| `src/app/services/emcap-api.service.ts` | Injectable API client |
| `src/app/pages/shell/` | Header, tenant picker, nav |
| `src/app/pages/entity/` | Full entity CRUD UX |
| `src/app/pages/*` | Workflow, reports, dashboards, notifications, account, assistant |
| `src/index.html` | `window.EMCAP_API_URL` |

## Run

```bash
cd clients/web
npm ci
npm start          # http://localhost:4200
```

API default: `http://localhost:8000` (set in `src/index.html`). Login: `admin` / `admin123`.

## Quality

```bash
npm run build
npm test           # Karma + Jasmine (interactive)
npm run test:ci    # ChromeHeadless (CI)
```

Contract tests: `src/app/api/emcap-client.spec.ts`, `src/app/metadata/dynamic-form.renderer.spec.ts`.

See `plan/10-angular-cli-web.md` and `plan/04-client-api-completion.md`.
