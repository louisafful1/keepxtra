import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client'

/**
 * Prometheus-format application metrics, exposed at `GET /metrics` (see
 * `routes/health.routes.ts`) — unauthenticated, matching how every
 * Prometheus exporter works; in production this endpoint should be
 * firewalled to the internal scraper network rather than exposed publicly
 * (see docs/security).
 */
export const metricsRegistry = new Registry()
metricsRegistry.setDefaultLabels({ service: 'keepxtra-backend' })
collectDefaultMetrics({ register: metricsRegistry })

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests handled',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
})

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
})
