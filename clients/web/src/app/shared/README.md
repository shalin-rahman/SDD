# Shared UI components (Phase 12+)

Reusable layout, navigation, data grid, and form components for web shell, entity pages, and future admin screens.

**After adding/changing components:** update this file + `docs/dev/codebase-index.md` (rule: `.cursor/rules/emcap-doc-sync.mdc`).

## Layout

| Component | Selector | Use |
|-----------|----------|-----|
| `AppLayoutComponent` | `app-app-layout` | Material sidenav shell + toolbar |
| `MasterDetailLayoutComponent` | `app-master-detail-layout` | List/detail split; mobile toggle via `[detailOpen]` |
| `PageHeaderComponent` | `app-page-header` | Title, optional back button, action slot (`ng-content`) |
| `DetailPlaceholderComponent` | `app-detail-placeholder` | Empty detail pane message |

## Navigation

| Component | Selector | Use |
|-----------|----------|-----|
| `SidenavNavComponent` | `app-sidenav-nav` | Platform links + module-grouped entity menus |
| `TenantSelectComponent` | `app-tenant-select` | SaaS tenant picker |

## Data & forms

| Component | Selector | Use |
|-----------|----------|-----|
| `DynamicDataGridComponent` | `app-dynamic-data-grid` | Metadata-driven grid + toolbar |
| `DynamicFormViewComponent` | `app-dynamic-form-view` | Metadata-driven form fields |
| `RecordTabsComponent` | `app-record-tabs` | Notes, documents, audit on a record |

## Admin & settings

| Component | Selector | Use |
|-----------|----------|-----|
| `AdminFormPanelComponent` | `app-admin-form-panel` | Detail pane header + aligned form grid |
| `AdminListToolbarComponent` | `app-admin-list-toolbar` | List pane “New” action |
| `PermissionPickerComponent` | `app-permission-picker` | Grouped checkbox permission assignment |
| `SettingsToggleGroupComponent` | `app-settings-toggle-group` | Aligned label + toggle rows |

## Services & utils

| Path | Purpose |
|------|---------|
| `services/layout.service.ts` | `isMobile$` breakpoint |
| `services/shell-context.service.ts` | Nav, tenants, config (shell + page titles) |
| `services/theme.service.ts` | Light/dark theme persisted in `localStorage` key `emcap-theme` |
| `services/i18n.service.ts` | EN/FR/**BN** JSON bundles; locale key `emcap-locale` |
| `utils/export.util.ts` | CSV/PDF export |
| `utils/page-title.util.ts` | Route → title |
| `utils/record.util.ts` | `recordId`, `inputType` |
| `utils/tenant.util.ts` | Tenant labels, permissions extract |
| `utils/permission.util.ts` | Permission grouping + wildcard helpers |
| `constants/layout.constants.ts` | Breakpoint, debounce, page size |

## Usage pattern (admin list + edit)

```html
<app-page-header [title]="'Users'" [showBack]="mobileDetailOpen" (back)="closeDetail()">
  <button (click)="startCreate()">New</button>
</app-page-header>

<app-master-detail-layout [detailOpen]="mobileDetailOpen">
  <div listPane><!-- table --></div>
  <div detailPane><!-- form --></div>
</app-master-detail-layout>
```

Pages stay thin: business logic in the page component; presentation in shared components.
