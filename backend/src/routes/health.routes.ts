import { Router } from 'express'
import { getDatabaseState } from '../config/database'

export const healthRouter = Router()

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Liveness probe
 *     description: Returns 200 as long as the process is up. Never checks the database — use /health/ready for that.
 *     responses:
 *       200:
 *         description: The process is alive.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 uptimeSeconds: { type: integer }
 *                 timestamp: { type: string, format: date-time }
 */
healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
})

/**
 * @openapi
 * /health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness probe
 *     description: Returns 200 only when this instance can actually serve traffic (i.e. the database is connected).
 *     responses:
 *       200:
 *         description: Ready to serve traffic.
 *       503:
 *         description: Not ready — a dependency (e.g. the database) is unavailable.
 */
healthRouter.get('/ready', (_req, res) => {
  const dbState = getDatabaseState()
  const ready = dbState === 'connected'

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not-ready',
    dependencies: { database: dbState },
    timestamp: new Date().toISOString(),
  })
})
