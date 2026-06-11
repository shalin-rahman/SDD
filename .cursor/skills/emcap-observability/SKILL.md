---
name: emcap-observability
description: >-
  EMCAP structured logging, Prometheus metrics, and Grafana dashboard templates.
  Use when adding observability middleware, metrics endpoints, or ops dashboards.
---

# EMCAP Observability

## Structured JSON logging

- Middleware: `emcap.observability.logging_middleware.JsonLoggingMiddleware`
- Logger: `emcap.access`
- Fields: `method`, `path`, `status_code`, `duration_ms`, `tenant_id`

## Prometheus metrics

- Middleware: `emcap.observability.metrics.MetricsMiddleware`
- Endpoint: `GET /api/v1/metrics`
- Metrics:
  - `emcap_http_requests_total{method,path,status}`
  - `emcap_http_request_duration_seconds{method,path}`

## Grafana

Import `infra/grafana/dashboard.json` and point Prometheus at the API scrape target.

## OpenTelemetry

Tracing is not fully wired yet. Add OTEL exporters alongside Kubernetes deployment when needed. Prometheus metrics and JSON logging are live (`GET /api/v1/metrics`).
