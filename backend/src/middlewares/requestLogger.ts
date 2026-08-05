import pinoHttp from 'pino-http'
import { randomUUID } from 'node:crypto'
import { httpLogger } from '../config/logger'

/**
 * Structured request logging — one JSON line per request with method,
 * path, status, latency, and a correlated `requestId` that's also echoed
 * back in error responses (see `errorHandler`). Auth/authorization headers
 * and cookies are redacted at the logger level (`config/logger.ts`), never
 * here.
 */
export const requestLogger = pinoHttp({
  logger: httpLogger,
  genReqId: (req, res) => {
    const existing = req.headers['x-request-id']
    const id = typeof existing === 'string' ? existing : randomUUID()
    res.setHeader('X-Request-Id', id)
    return id
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} -> ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} -> ${res.statusCode} (${err.message})`,
})
