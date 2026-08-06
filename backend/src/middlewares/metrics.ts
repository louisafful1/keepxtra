import type { NextFunction, Request, Response } from 'express'
import { httpRequestDurationSeconds, httpRequestsTotal } from '../config/metrics'

/**
 * Route *pattern*, not the raw URL — `/farmers/:id`, never `/farmers/665f...`.
 * Using the raw path as a Prometheus label would let every distinct ID (and
 * every bogus path a scanner throws at the server) mint a new metrics time
 * series forever ("cardinality explosion"). Requests that never matched a
 * route (404s) collapse to a single `unmatched` label for the same reason.
 */
function routeLabel(req: Request): string {
  const route = req.route as { path?: string } | undefined
  if (!route?.path) return 'unmatched'
  return `${req.baseUrl}${route.path === '/' ? '' : route.path}`
}

export function recordMetrics(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint()

  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9
    const labels = { method: req.method, route: routeLabel(req), status_code: String(res.statusCode) }
    httpRequestsTotal.inc(labels)
    httpRequestDurationSeconds.observe(labels, durationSeconds)
  })

  next()
}
