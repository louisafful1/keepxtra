import { Router } from 'express'

/**
 * Versioned API root. No business modules are mounted yet — Farmers,
 * Storage, Inventory, Sales, Payments, etc. each get their own
 * `<module>.routes.ts` mounted here as they ship.
 */
export const apiRouter = Router()

apiRouter.get('/', (_req, res) => {
  res.status(200).json({
    name: 'KeepXtra API',
    version: '0.1.0',
    status: 'foundation — no business modules mounted yet',
  })
})
