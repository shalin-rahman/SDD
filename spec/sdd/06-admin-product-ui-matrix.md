# EMCAP — Admin & Product UI Matrix (honest gap vs framework-sdd)



**Purpose:** Correct overstated “100%” for **enterprise product UX** and **admin consoles**.  

**Companions:** `04-capability-matrix.md` (platform API wired) · `05-end-user-matrix.md` (CRUD/renderer depth) · `plan/12-phase12-dod-checklist.md`



**Legend:** Done · Partial · No · N/A · API-only · Phase 13 (deferred)



**Last updated:** 2026-06-14 (rev. 12 — P19-T03 Done; P19-T05/T06 Partial; entity routes not master–detail)

**Note:** Backlog **Done** on Phase 12/13 means **Wired** or **Demo** in `07-product-readiness-matrix.md` until screenshot + UX checklist pass.



---



## §2 Platform goals — presentation & services



| Capability | Web | Mobile | Notes |

|------------|-----|--------|-------|

| Design system (Material / tokens) | Partial | Partial | Material shell + light/dark theme (P12A / P12D / P12F) |

| Responsive app shell | Partial | Partial | Sidenav/drawer + rail ≥900px; **entity separate list/record routes** (not master–detail) |

| Workflow / reports / AI nav when enabled | Partial | Partial | Platform links gated; Admin/Settings when permitted |

| Integrations / payments entry points | Partial | Partial | Settings registry + masked secrets; Account ad-hoc tests |



---



## §3–§4 Tenancy & isolation



| Capability | API | Web | Mobile | Notes |

|------------|-----|-----|--------|-------|

| SaaS tenant picker | Done | Partial | Partial | Header / login |

| White-label theme from tenant | Partial | Partial | Partial | Seed color from tenant config |

| **Tenant branding admin UI** | No | Partial | Partial | Settings split-pane: primary/logo + live preview (P19-T05); theme/domain save via admin PUT |

| Isolation strategy display | Done | Partial | Partial | Settings read-only line |

| Isolation strategy **change** UI | No | No | No | Phase 13 (ops) |



---



## §5 Module feature flags



| Capability | Web | Mobile | Notes |

|------------|-----|--------|-------|

| Runtime read of module flags | Done | Done | From `/config/platform` |

| Hide disabled module menus | Partial | Partial | Shell filters menus + settings toggles |

| **Module on/off settings UI** | Partial | Partial | Settings hub module section; P19-T01 mat-tab IA (Modules \| Identity \| Platform \| Integrations) |

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

| **App UI i18n + locale switcher** | Partial | Partial | EN/FR/**BN** JSON bundles; shell/admin/settings/entity chrome |

| **Theme picker (light/dark)** | Done | Done | Persisted (`localStorage` / `shared_preferences`) |

| Layout designer | No | N/A | Phase 13 |

| Breadcrumbs / page titles | Partial | Partial | AppBar title from selection |



---



## §7 Identity & authorization



| Capability | API | Web | Mobile | Notes |

|------------|-----|-----|--------|-------|

| Login / MFA / OAuth | Done | Done | Done | — |

| List roles | Done | Done | Done | Admin roles screen; P19-T02 search, empty state, module permission chips |

| Create / edit roles | Done | Done | Done | Master–detail + permission picker; inline save validation |

| Permission assignment UI | Partial | Partial | Partial | Checkbox picker by module; list shows grouped chips; matrix read-only |

| List / CRUD users | Done | Done | Done | Admin users screen; P19-T02 search, active chips, empty state |

| Assign role to user | Done | Done | Done | Role multi-select checkboxes |

| Permission-filtered menus | Partial | Partial | Partial | Shell filters via `/auth/me` |

| Row/field security admin | Partial | Partial | Partial | P19-T03 web field matrix + permission picker; `PUT /admin/security/field-access` + merged policies GET (P13-T10/T11 Done) |
| ABAC policy admin | Done | Partial | Partial | `GET/PUT /admin/security/abac`; web table editor; P19-T04 delete confirm + empty permission validation |

| Auth provider config UI | Partial | Partial | Partial | Settings authentication toggles |



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

| **Report schedule admin UI** | No | No | API partial |



---



## §13 Communication



| Capability | API | Web | Mobile | Notes |

|------------|-----|-----|--------|-------|

| Channel flags (email/sms/push/…) | Done | Partial | Partial | Dropdown when sending |

| **Channel toggles settings UI** | Partial | Partial | Partial | Settings notifications section |

| Email / SMS templates CRUD | Done | Partial | Partial | Settings templates master–detail |

| Template editor UI | Partial | Partial | Partial | Subject/body editor in settings |



---



## §14 Documents · §15 Integrations · §16 Payments · §17 AI



| Capability | API | Web | Mobile | Notes |

|------------|-----|-----|--------|-------|

| Document upload/list on record | Done | Done | Done | — |

| Document platform settings UI | Partial | No | No | P19-T06: read-only cards in Settings → Platform from GET `/config/platform` |

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

| Security settings UI (rate limit, MFA policy) | No | No | — |

| Admin route hardening | Partial | Partial | API RBAC + permission-filtered nav |



---



## §26–§30 SDK & DoD



| Capability | Status | Notes |

|------------|--------|-------|

| Menus from ModuleDefinition | API Done | UI module-grouped (web + mobile) |

| Permissions auto from modules | Done | Admin permission matrix (read-only) |

| Localization from SDK | Partial | App EN/FR/BN switcher + metadata keys |

| **Operate platform without YAML edits** | Partial | Users/roles/settings/integrations/payments via admin UI |



---



## Summary



| Layer | Honest status |

|-------|----------------|

| Platform API + metadata | **Strong** |

| End-user CRUD shell (05) | **Partial** |

| Product shell (nav, layout, i18n, theme) | **Partial** (12F closed major gaps) |

| Admin & settings consoles | **Partial** (web + mobile parity on core flows) |

| Phase 13 ABAC builder | **Partial** (Slice 1 done) |
| Phase 13 (field override editor, layout designer, isolation write) | **Partial** (P13-T10/T11 API Done; P19-T03 web UI; P13-T20/T30 pending) |



**Playbook:** `plan/12-enterprise-product-ui.md` · **Phase 12F:** `plan/12f-ui-polish-admin-depth.md` · **DoD:** `plan/12-phase12-dod-checklist.md`


