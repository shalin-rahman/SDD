---
name: emcap-integrations
description: >-
  EMCAP integration adapters for REST webhooks and Kafka event publishing, plus
  notification hub, document storage, and payment gateway patterns. Use when
  wiring external systems or platform service routes.
---

# EMCAP Integrations

## REST adapter

- Route: `POST /api/v1/integrations/rest/dispatch`
- Service: `emcap.integrations.adapters.RestAdapter`
- Persists jobs in `integration_jobs` table

## Kafka adapter

- Route: `POST /api/v1/integrations/kafka/publish`
- Service: `emcap.integrations.adapters.KafkaAdapter`

## Notification hub

- Routes: `POST /api/v1/notifications/send`, `GET /api/v1/notifications`
- Channels gated by `config/platform.yaml` → `notifications.*` and `modules.notifications.enabled`
- Service: `emcap.notifications.hub.NotificationHub`

## Documents

- Routes: `POST /api/v1/documents/upload`, `GET /api/v1/documents/{id}`
- Local storage root: `EMCAP_STORAGE_PATH` (default `./storage`)
- Pluggable hooks: `DocumentHooks.scan_virus()`, `DocumentHooks.extract_ocr()`

## Payments

- Route: `POST /api/v1/payments/intents`
- Gated by `modules.payments.enabled` and `payments.enabled`
- Service: `emcap.payments.gateway.PaymentGateway` (Stripe-style stub)

## AI platform stub

- Routes: `POST /api/v1/ai/chat`, `POST /api/v1/ai/summarize`
- Gated by `modules.ai.enabled` and `ai.enabled`
- Service: `emcap.ai.service.AIService`

## Client shell (Phase 8)

| Service | Web | Mobile |
|---------|-----|--------|
| Notifications (multi-channel) | `main.ts` | `notification_screen.dart` |
| Document preview | `entity-view.ts` → `getDocument()` | `entity_screen.dart` |
| Report runs history | `main.ts` reports view | `report_screen.dart` |
| REST dispatch | Account view | `account_screen.dart` |
| Payments demo | Account view (flag gated) | `account_screen.dart` |
| AI assistant | `main.ts` Assistant nav | `assistant_screen.dart` |

All flag-gated features read `GET /api/v1/config/platform` before showing UI.

## Module metadata

Register reports and dashboards on `ModuleDefinition` in `modules/*/module.py`.
