# EMCAP web thin client

Metadata-driven presentation shell aligned with **SDD §9 Dynamic UI Platform**. The Vite/TypeScript client consumes the same backend form/grid metadata contract as the Flutter mobile client.

## SDD §9 structure

| Layer | Path | Role |
|-------|------|------|
| **API client** | `src/api/emcap-client.ts` | 40+ methods; Bearer + `X-Tenant-ID` |
| **Metadata contract** | `src/metadata/contract.ts` | Form/grid types, i18n helpers |
| **Dynamic renderers** | `src/dynamic-form.component.ts`, `src/dynamic-grid.component.ts` | Validation, sort/filter/group |
| **Entity view** | `src/app/entity-view.ts` | Edit/delete/search/pagination/export |
| **Shell app** | `src/app/main.ts` | Login, nav, workflow, reports, account, AI |
| **Host** | `index.html` | `#app`, `window.EMCAP_API_URL` |

## Capabilities (Phases 7–8)

| Area | Features |
|------|----------|
| Entity CRUD | Create, **edit**, **delete**, **search**, pagination |
| Dynamic forms | Field types, validation, conditions, i18n labels |
| Dynamic grids | Sort, filter, group, CSV/excel/PDF export |
| Workflow | Inbox actions, **start from record**, SLA display |
| Platform | Notifications (multi-channel), dashboards, reports + **history** |
| Identity | MFA, OAuth, **tenant picker**, white-label CSS vars |
| Documents | Upload, list, **preview**, versions |
| Integrations | REST dispatch, payments demo (flag gated), AI assistant |

## How to run

```bash
cd clients/web
npm ci
npm run dev
```

Open **http://localhost:4200**. API default: **http://localhost:8000**. Login: `admin` / `admin123`.

## Quality checks

```bash
npm run lint
npm test
npm run test:coverage   # optional
npm run build
```

**Tests:** 8 vitest (contract + renderer). CI runs lint + test on every PR.

See `plan/04-client-api-completion.md` for full API mapping.
