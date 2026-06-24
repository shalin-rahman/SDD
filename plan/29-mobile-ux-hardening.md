# Phase 29 — Mobile UX hardening (P1/P2)

**Status:** Complete — 2026-06-24  
**Parent:** Standards review remediation (loading feedback, pagination, SSE lifecycle, workflow a11y)  
**Gate:** Mobile Flutter **≥80% line**; web Karma **≥80% branches** on touched files; API pytest for pagination

**Honesty rule:** Backlog **Done** ≠ **Product-ready** without matrix 07 evidence where applicable.

---

## Scope

| Wave | Deliverable |
|------|-------------|
| P1 | HTTP timeout on `EmcapClient`; `BusyTextButton`; workflow loading/spinner/error UX; workflow → entity record deep-link |
| P2 | Cancellable mobile SSE; server pagination (API + web + mobile parity); workflow Semantics + a11y tests + manual checklist |

**Out of scope:** Liquid Glass, EU DMA, shell tab preservation, secure token storage.

---

## Task map

| ID | Task | Verify |
|----|------|--------|
| P29-T01 | `EmcapClient.requestTimeout` + `EmcapClientTimeoutException` | `test/emcap_client_http_test.dart` |
| P29-T02 | `BusyTextButton` + workflow inbox loading UX | `test/workflow_inbox_screen_test.dart` |
| P29-T03 | Workflow open-record deep-link (`EntityRecordScreen`) | `test/workflow_inbox_screen_test.dart` |
| P29-T04 | `cancelRecordsStream()` + entity list `dispose` | `test/emcap_client_http_test.dart` |
| P29-T05 | API `limit`/`offset`/`total` on entity list | `tests/test_entity_pagination.py` |
| P29-T06 | Web entity-list server pagination | `entity-list.component.spec.ts` |
| P29-T07 | Mobile entity-list server pagination | `EntityRecordsPage`; entity list tests |
| P29-T08 | Workflow a11y Semantics + manual checklist | `test/a11y_semantics_test.dart` (17 cases) |
| P29-T09 | Full verify + doc sync | This doc + backlog + matrices + index |

---

## Verify (copy-paste)

```powershell
cd platform/api && python -m pytest tests/test_entity_pagination.py -q

cd clients/mobile
flutter pub get && flutter test --coverage
python ../../scripts/check-flutter-coverage.py --lcov coverage/lcov.info --min 80

cd clients/web && npm run test:coverage
# Branches gate: ≥80% (global summary)
```

### Results (2026-06-24)

| Layer | Result |
|-------|--------|
| API pagination | `tests/test_entity_pagination.py` **3/3** pass |
| Flutter | **542/542** pass (~4m24s); line coverage **85.71%** (5128/5983) |
| Web Karma | **543/543** pass; branches **80.79%**; lines **95.17%** |

---

## Key paths

| Area | Path |
|------|------|
| Mobile client timeout / pagination / SSE | `clients/mobile/lib/api/emcap_client.dart` |
| Busy button | `clients/mobile/lib/widgets/busy_text_button.dart` |
| Workflow inbox UX | `clients/mobile/lib/app/workflow_inbox_screen.dart` |
| Entity list pagination | `clients/mobile/lib/app/entity_list_screen.dart` |
| API pagination | `platform/api/src/emcap/api/routes/entities.py`, `persistence/repository.py` |
| Web pagination | `clients/web/src/app/pages/entity/entity-list.component.ts`, `api/emcap-client.ts` |
| A11y manual | `docs/dev/recipes/mobile-a11y-manual-checklist.md` § Workflow inbox |

---

## DoD

- [x] Users see spinners / disabled-busy states on workflow async actions
- [x] HTTP requests fail with typed timeout (30s default), not silent hang
- [x] Workflow row opens linked entity **record**, not only entity list
- [x] SSE subscription cancelled on entity list dispose
- [x] Entity list pages fetched server-side (web + mobile); backward compat when `limit` omitted
- [x] Workflow inbox loading + main landmark Semantics; automated a11y tests
- [x] Docs synced (backlog, index, pitfalls, matrix 07 note, HANDOFF)

**Open (not P29):** Workflow inbox mobile Product-ready PNG; device TalkBack sign-off per P24-T04 manual checklist.
