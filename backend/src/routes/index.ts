import { Router } from 'express'
import { authRouter } from './auth.routes'
import { farmerRouter } from './farmer.routes'

/**
 * Versioned API root. Auth and Farmers are mounted below; Storage,
 * Inventory, Sales, Payments, etc. each get their own `<module>.routes.ts`
 * mounted here as they ship.
 */
export const apiRouter = Router()

apiRouter.get('/', (_req, res) => {
  res.status(200).json({
    name: 'KeepXtra API',
    version: '0.1.0',
    status: 'auth + farmers modules live — remaining business modules not mounted yet',
  })
})

apiRouter.use('/auth', authRouter)
apiRouter.use('/farmers', farmerRouter)
