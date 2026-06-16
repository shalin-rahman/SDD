# Shared UI components (Phase 12+)

Reusable layout, navigation, data grid, and form components for web shell, entity pages, and future admin screens.

**After adding/changing components:** update this file + `docs/dev/codebase-index.md` (rule: `.cursor/rules/emcap-doc-sync.mdc`).

## Layout

| Component | Selector | Use |
|-----------|----------|-----|
| `AppLayoutComponent` | `app-app-layout` | Material sidenav shell + toolbar |
| `MasterDetailLayoutComponent` | `app-master-detail-layout` | List/detail split for **admin** screens; mobile toggle via `[detailOpen]` — **not** used on entity pages (separate routes per **A15**) |
| `PageHeaderComponent` | `app-page-header` | Title, optional back button, action slot (`ng-content`) |
| `DetailPlaceholderComponent` | `app-detail-placeholder` | Empty detail pane; optional New CTA |
| `LoadingPanelComponent` | `app-loading-panel` | Centered loading message |
| `EmptyStateComponent` | `app-empty-state` | Message + optional primary action |
| `SectionCardComponent` | `app-section-card` | Titled card for profile/settings sections |

## Navigation

| Component | Selector | Use |
|-----------|----------|-----|
| `SidenavNavComponent` | `app-sidenav-nav` | Platform links + module-grouped entity menus with Material icons (`MenuItem.icon`) |
| `TenantSelectComponent` | `app-tenant-select` | SaaS tenant picker |

## Data & forms

| Component | Selector | Use |
|-----------|----------|-----|
| `DynamicDataGridComponent` | `app-dynamic-data-grid` | Metadata-driven grid + toolbar; `[loading]` inline panel; empty grid → `EmptyStateComponent` + New CTA |
| `DynamicFormViewComponent` | `app-dynamic-form-view` | Metadata-driven form fields (select, lookup, currency, textarea) |
| `LookupFieldComponent` | `app-lookup-field` | Lookup picker trigger + selected label |
| `LookupPickerDialogComponent` | (dialog) | Search/select target entity record |
| `CurrencyFieldComponent` | `app-currency-field` | Currency input with `currency_code` label |
| `RecordTabsComponent` | `app-record-tabs` | Notes, documents, audit, workflow tabs on a record |
| `RecordDetailHeaderComponent` | `app-record-detail-header` | Entity record hero: headline, subtitle, `.emcap-badge` status, action toolbar |
| `DocumentPreviewPanelComponent` | `app-document-preview-panel` | Side panel: PDF/image inline, text snippet, download CTA, virus badge |

## Assistant (P17-T09)

| Component | Selector | Use |
|-----------|----------|-----|
| `AssistantChatPanelComponent` | `app-assistant-chat-panel` | Chat layout: message list, prompt suggestions, input bar, thinking/error states |
| `AssistantMessageBubbleComponent` | `app-assistant-message-bubble` | User/assistant message bubble with role label |

## Admin & settings

| Component | Selector | Use |
|-----------|----------|-----|
| `AdminFormPanelComponent` | `app-admin-form-panel` | Detail pane header + aligned form grid |
| `AdminListToolbarComponent` | `app-admin-list-toolbar` | List pane “New” action |
| `PermissionPickerComponent` | `app-permission-picker` | Grouped checkbox permission assignment |
| `SettingsToggleGroupComponent` | `app-settings-toggle-group` | Aligned label + toggle rows |
| `BrandingPreviewPanelComponent` | `app-branding-preview-panel` | P19-T05 live shell snippet with scoped `--emcap-primary` + WCAG contrast hint |
| `LayoutEditorPanelComponent` | `app-layout-editor-panel` | P13-T31/T32 settings Platform tab — form row/col/span + grid column reorder/flags/width override editor (ADR-007) |
| `layout_editor_panel.dart` (mobile) | — | P13-T31/T32 mobile settings ExpansionTile — same override editor parity |

## Services & utils

| Path | Purpose |
|------|---------|
| `services/layout.service.ts` | `isMobile$` breakpoint |
| `services/shell-context.service.ts` | Nav, tenants, config (shell + page titles) |
| `services/theme.service.ts` | Light/dark theme + tenant primary CSS var (`--emcap-primary`) |
| `services/i18n.service.ts` | EN/FR/**BN** JSON bundles; locale key `emcap-locale` |
| `utils/export.util.ts` | CSV/PDF export |
| `utils/page-title.util.ts` | Route → title |
| `utils/record.util.ts` | `recordId`, `inputType` |
| `utils/record-lifecycle.util.ts` | Soft delete: `canDeleteRecord`, `canRestoreRecord` |
| `utils/record-headline.util.ts` | Entity hero headline/subtitle from main-section field hints (`sku`/`code`/`terminal_id`/`employee_no`/`movement_number`/etc. + `name`/`location`/`full_name`/`company`/`contact_name`); status chip from `display.status_field` |
| `utils/workflow-sla.util.ts` | Workflow inbox SLA badge levels from `due_at` |
| `utils/workflow-state.util.ts` | Workflow `current_state` code → localized label (EN/FR/BN) |
| `utils/workflow-enabled.util.ts` | Platform workflow gate + entity start-workflow codes (PRODUCT → STOCK_ADJUSTMENT) |
| `utils/field-display.util.ts` | Grid/form datetime, currency, textarea cell formatters |
| `utils/lookup-display.util.ts` | Resolve lookup record display label (name/code/sku) |
| `utils/document-preview.util.ts` | Document mime, preview mode, version list, virus badge |
| `utils/assistant-chat.util.ts` | AI chat response extract + message id helper |
| `utils/branding.util.ts` | Tenant primary/logo parse, hex normalize, preview color |
| `utils/tenant.util.ts` | Tenant labels, permissions extract |
| `utils/permission.util.ts` | Permission grouping + wildcard helpers |
| `constants/layout.constants.ts` | Breakpoint, debounce, page size |

## Usage pattern (admin list + edit)

Entity pages use **separate routes** (`entity-list` / `entity-record`) — see `pages/entity/` and **A15** in `user-feedback-registry.md`.

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
