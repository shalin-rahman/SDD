# EMCAP — Admin & Product UI Matrix (honest gap vs framework-sdd)



**Purpose:** Correct overstated “100%” for **enterprise product UX** and **admin consoles**.  

**Companions:** `04-capability-matrix.md` (platform API wired) · `05-end-user-matrix.md` (CRUD/renderer depth) · `plan/12-phase12-dod-checklist.md`



**Legend:** Done · Partial · No · N/A · API-only · Phase 13 (deferred)



**Last updated:** 2026-06-15 (rev. 18 — P15-T32 axe CI; P16-T06 mobile density parity)

**Note:** Backlog **Done** on Phase 12/13 means **Wired** or **Demo** in `07-product-readiness-matrix.md` until screenshot + UX checklist pass.



---



## §2 Platform goals — presentation & services



| Capability | Web | Mobile | Notes |

|------------|-----|--------|-------|

| Design system (Material / tokens) | Partial | Partial | Material shell + `--emcap-*` badges on admin/settings (P16-T05 Done) |

| Responsive app shell | Partial | Partial | Sidenav/drawer + rail ≥900px; **entity separate list/record routes** (not master–detail) |

| Workflow / reports / AI nav when enabled | Partial | Partial | Platform links gated; Admin/Settings when permitted |

| Integrations / payments entry points | Partial | Partial | Settings → Integrations registry, test REST dispatch, provider cards; Account has no integration tests (P19-T10/T11) |



---



## §3–§4 Tenancy & isolation



| Capability | API | Web | Mobile | Notes |

|------------|-----|-----|--------|-------|

| SaaS tenant picker | Done | Partial | Partial | Header / login |

| White-label theme from tenant | Partial | Partial | Partial | Seed color from tenant config |

| **Tenant branding admin UI** | No | Partial | Partial | Settings Integrations tab: split-pane live preview, primary/logo save, WCAG contrast hint (P19-T05 Done) |

| Isolation strategy display | Done | Partial | Partial | Settings Platform tab shows configured/effective mode |

| Isolation strategy **change** UI | Done | Partial | Partial | P13-T20/T21 — ops confirmation token; web + mobile settings form |



---



## §5 Module feature flags



| Capability | Web | Mobile | Notes |

|------------|-----|--------|-------|

| Runtime read of module flags | Done | Done | From `/config/platform` |

| Hide disabled module menus | Partial | Partial | Shell filters menus + settings toggles |

| **Module on/off settings UI** | Partial | Partial | Settings mat-tab hub + module toggles (P12C-T02 Done; P19-T01) |

| Per-page enable within module | No | No | Not in SDD v1 detail |



---



## §6–§9 Shell, forms, grids



| Capability | Web | Mobile | Notes |

|------------|-----|--------|-------|

| Dynamic entity menus | Done | Done | Permission-filtered |

| **Module-grouped navigation** | Done | Done | Web sidenav + mobile drawer + rail module headers (P12F-T50) |

| Master–detail single page | Partial | Partial | Split pane ≥900px; mobile back toggle |

| Responsive data grid | Partial | Partial | Horizontal scroll wrapper |

| Grid grouping UI | Partial | Partial | Toggle in entity toolbar |

| Grid export toolbar | Done | Done | Phase 8 |

| Realtime grid refresh | Partial | Partial | SSE fetch workaround |

| Offline/sync indicator | Partial | Partial | Status line when `grid.offline` |

| Form validation / conditions | Done | Done | Renderers |

| Metadata i18n labels | Done | Done | `label_key` + BN sample on PRODUCT |

| **App UI i18n + locale switcher** | Demo | Demo | P18-T12 — login/admin users/settings payment+storage labels; entity errors; settings tabs mostly keyed |

| **Theme picker (light/dark)** | Done | Done | Persisted (`localStorage` / `shared_preferences`) |

| Layout designer | Partial | Partial | **ADR-007** — web + mobile settings layout editor; override API + merge |

| Breadcrumbs / page titles | Done | Partial | Entity list/record + admin users/roles/security/permissions; Karma specs on all admin pages (`P16-T09`) |



---



## §7 Identity & authorization



| Capability | API | Web | Mobile | Notes |

|------------|-----|-----|--------|-------|

| Login / MFA / OAuth | Done | Partial | Partial | P18-T11 — web provider cards, session-expiry redirect, MFA steps; mobile mirror pending |

| List roles | Done | Done | Done | Admin roles screen; P19-T02 search, empty state, module permission chips |

| Create / edit roles | Done | Done | Done | Master–detail + permission picker; inline save validation |

| Permission assignment UI | Partial | Partial | Partial | Checkbox picker by module; list shows grouped chips; matrix read-only |

| List / CRUD users | Done | Done | Done | Admin users screen; P19-T02 search; `.emcap-badge` active chips (P16-T05) |

| Assign role to user | Done | Done | Done | Role multi-select checkboxes |

| Permission-filtered menus | Partial | Partial | Partial | Shell filters via `/auth/me` |

| Row/field security admin | Partial | Partial | Partial | P19-T03 web + P13-T12 mobile field matrix edit; `PUT /admin/security/field-access` + merged policies GET (P13-T10/T11 Done) |
| ABAC policy admin | Done | Partial | Partial | `GET/PUT /admin/security/abac`; web table editor; P19-T04 delete confirm + empty permission validation |

| Auth provider config UI | Partial | Partial | Partial | Settings Identity tab auth toggles; override badges (P12B-T09 Done) |



---



## §10 Workflow · §11 Rules



| Capability | API | Web | Mobile | Notes |

|------------|-----|--------|-------|

| Workflow actions on entity | Done | Done | Done | Phase 8 |

| Workflow settings UI (escalation, SLA) | Partial | Partial | Partial | Settings workflow toggles |

| Rule engine toggle UI | Partial | Partial | Partial | Settings rules toggles |
| Rule evaluate panel | Done | Partial | No | Settings `/app/settings/rules`; P17-T11 web |



---



## §12 Reporting



| Capability | Web | Mobile | Notes |

|------------|-----|--------|-------|

| Run reports | Done | Done | — |

| Dashboards / KPI widgets | Partial | Partial | Overview dashboard |

| **Report schedule admin UI** | Partial | Partial | No | **Sprint 12** — `GET/PUT /admin/reports/schedules`; settings Platform tab; `test_report_schedule_admin.py` |



---



## §13 Communication



| Capability | API | Web | Mobile | Notes |

|------------|-----|-----|--------|-------|

| Channel flags (email/sms/push/…) | Done | Partial | Partial | Dropdown when sending |

| **Channel toggles settings UI** | Partial | Partial | Partial | Settings notifications + template channel bar (P12C-T16 Done; P19-T12) |

| Email / SMS templates CRUD | Done | Partial | Partial | Settings templates master–detail |

| Template editor UI | Partial | Partial | Partial | Subject/body editor in settings |



---



## §14 Documents · §15 Integrations · §16 Payments · §17 AI



| Capability | API | Web | Mobile | Notes |

|------------|-----|-----|--------|-------|

| Document upload/list on record | Done | Done | Done | — |

| Document platform settings UI | Partial | Partial | Partial | **Sprint 12** — editable Platform tab via `PUT /admin/settings` (`documents.*` paths) |

| Integration registry admin | Partial | Partial | Partial | Settings integrations panel + test REST (P12F-T30–T36) |

| Payment gateway config UI | Partial | Partial | Partial | Provider + publishable key + masked secret rotate (P12F-T20–T27) |

| AI config UI | No | Partial | Partial | Settings AI toggle |

| AI chat when enabled | Done | **Demo** | Done | P17-T09: `AssistantChatPanelComponent`; flag-gated; no `alert()` |



---



## §18 Observability · §19 Audit · §20 Security



| Capability | Web | Mobile | Notes |

|------------|-----|-------|

| In-app observability dashboard | No | No | Grafana external |

| Observability links in settings | Partial | No | Web read-only section |

| Record audit viewer | Done | Done | Entity detail |

| Audit subsystem config UI | Partial | Partial | Settings audit toggles |

| Settings change audit | Partial | Partial | Admin audit log list |

| Security settings UI (rate limit, MFA policy) | Partial | Partial | Read-only cards: rate limit, headers, MFA account hint, ABAC count (P12C-T19 Done) |

| Admin route hardening | Partial | Partial | API RBAC + permission-filtered nav |



---



## §26–§30 SDK & DoD



| Capability | Status | Notes |

|------------|--------|-------|

| Menus from ModuleDefinition | API Done | UI module-grouped with Material icons (web sidenav + mobile shell `iconFromMaterialName`, P18-T07) |

| Permissions auto from modules | Done | Admin permission matrix (read-only) |

| Localization from SDK | Partial | App EN/FR/BN switcher + metadata keys |

| **Operate platform without YAML edits** | Partial | Users/roles/settings/integrations/payments/documents/report schedules via admin UI |



---



## Summary



| Layer | Honest status |

|-------|----------------|

| Platform API + metadata | **Strong** |

| End-user CRUD shell (05) | **Partial** |

| Product shell (nav, layout, i18n, theme) | **Partial** (12F closed major gaps) |

| Admin & settings consoles | **Partial** (web + mobile parity on core flows) |

| Phase 13 ABAC builder | **Partial** (Slice 1 done) |
| Phase 13 (field override editor, layout designer, isolation write) | **Partial** (P13-T10–T12/T20/T21/T30–T32 web+mobile Done) |



**Playbook:** `plan/12-enterprise-product-ui.md` · **Phase 12F:** `plan/12f-ui-polish-admin-depth.md` · **DoD:** `plan/12-phase12-dod-checklist.md`


