# Recipe — Enterprise UI shell (Phase 12A)

Material sidenav, module-grouped nav, master–detail entity page using **shared components**.

**Playbook:** `plan/12-enterprise-product-ui.md`  
**DoD:** `plan/12-phase12-dod-checklist.md`  
**Shared UI:** `clients/web/src/app/shared/README.md`  
**Doc sync:** `docs/dev/recipes/sync-docs-after-change.md` (mandatory)

---

## Before you start

1. Read `docs/dev/known-pitfalls.md` Phase 12
2. Read `.cursor/rules/emcap-doc-sync.mdc`
3. Confirm task IDs in `plan/03-task-backlog.md`
4. Run stack: `scripts\run-emcap.bat --stack-only --local --skip-tests --skip-lint`

---

## Reusable components (do not duplicate in pages)

| Component | Path | Use |
|-----------|------|-----|
| `AppLayoutComponent` | `shared/layout/app-layout.component.ts` | Full Material shell |
| `SidenavNavComponent` | `shared/navigation/sidenav-nav.component.ts` | Module-grouped menus |
| `TenantSelectComponent` | `shared/navigation/tenant-select.component.ts` | SaaS tenant picker |
| `MasterDetailLayoutComponent` | `shared/layout/master-detail-layout.component.ts` | List + detail split |
| `PageHeaderComponent` | `shared/layout/page-header.component.ts` | Title + back + actions |
| `DynamicDataGridComponent` | `shared/data/dynamic-data-grid.component.ts` | Metadata grid |
| `DynamicFormViewComponent` | `shared/forms/dynamic-form-view.component.ts` | Metadata form |
| `RecordTabsComponent` | `shared/entity/record-tabs.component.ts` | Notes/docs/audit |

**Services / utils:** `ShellContextService`, `LayoutService`, `shell-nav.util.ts`, `page-title.util.ts`

---

## Step 1 — Shell (P12A-T01, T02, T03, T10, T11)

`pages/shell/shell.component.ts` is a **thin wrapper**:

```typescript
// Loads ShellContextService + binds AppLayoutComponent inputs
<app-app-layout
  [pageTitle]="pageTitle"
  [navGroups]="shellContext.navGroups()"
  ...
/>
```

Nav logic lives in `services/shell-nav.util.ts` — not in the page template.

Page title: `resolvePageTitle()` in `shared/utils/page-title.util.ts`.

---

## Step 2 — Entity list + record routes (P15-T15, Slice 15C)

**Not master–detail.** Admin screens still use `MasterDetailLayoutComponent`.

| Route | Component |
|-------|-----------|
| `/app/entity/:code` | `entity-list.component` — grid only |
| `/app/entity/:code/new`, `/:recordId` | `entity-record.component` — form + tabs |

```html
<!-- entity-list: grid + New CTA -->
<app-page-header [title]="title">
  <button mat-flat-button (click)="openNew()">New</button>
</app-page-header>
<app-dynamic-data-grid ... (rowSelect)="openRecord($event)" />

<!-- entity-record: hero + form + tabs -->
<app-page-header [title]="title" [showBack]="true" (back)="backToList()" />
<app-record-detail-header ... />
<app-dynamic-form-view ... />
<app-record-tabs ... />
```

Business logic in `entity-list.component.ts` / `entity-record.component.ts`; layout in shared components.

Mobile: `entity_list_screen.dart` → push `entity_record_screen.dart`.

---

## Step 3 — Tests

| Test | File |
|------|------|
| Nav grouping / permissions | `services/shell-nav.util.spec.ts` |
| Page title | `shared/utils/page-title.util.spec.ts` |
| Form renderer | `metadata/dynamic-form.renderer.spec.ts` |
| API contract | `api/emcap-client.spec.ts` |

---

## Step 4 — Documentation (same PR — mandatory)

- [ ] `spec/sdd/06-admin-product-ui-matrix.md`
- [ ] `plan/03-task-backlog.md`
- [ ] `docs/dev/codebase-index.md`
- [ ] `clients/web/src/app/shared/README.md` if components added/changed
- [ ] This recipe + `emcap-enterprise-ui` skill if paths changed
- [ ] `known-pitfalls.md` if new regression

---

## Verify

```bat
scripts\lint-format.bat
cd clients\web && npm run build && npm run test:ci
```

Manual: module sidenav · Product list → record navigation · mobile back · no duplicate on save

---

## Phase 12F smoke (after polish slices)

| Step | Web | Mobile |
|------|-----|--------|
| Persistence | Dark + BN → hard refresh → unchanged | Dark + BN → force-stop → relaunch |
| Payment secret | Settings → rotate secret → GET masked | Same |
| Integrations | Settings → REST base URL → Test REST | Same |
| Security viewer | Admin → Security → PRODUCT field roles | Same |
| Rail groups | N/A | Tablet width → module headers above entity icons in rail |
| Bangla | Settings section titles in Bengali | Shell locale menu → BN |
