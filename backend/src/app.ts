import express, { type Application } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'
import { env, isDevelopment } from './config/env'
import { swaggerSpec } from './config/swagger'
import { requestLogger } from './middlewares/requestLogger'
import { notFoundHandler } from './middlewares/notFoundHandler'
import { errorHandler } from './middlewares/errorHandler'
import { healthRouter } from './routes/health.routes'
import { apiRouter } from './routes'
// Side-effect import — registers every Mongoose model (`mongoose.model(name, schema)`)
// on module load. Without this, a model that's only ever referenced via
// `import type` (as populate targets like Role/Permission are, e.g. in
// auth.service.ts) never actually gets registered, and the first
// `.populate()` call throws `MissingSchemaError` at runtime.
import './models'
import { registerAllEventListeners } from './events/registerListeners'

export function createApp(): Application {
  registerAllEventListeners()

  const app = express()

  // Express sits behind a load balancer/reverse proxy in every real
  // deployment — trust the first hop so `req.ip` and `req.secure` reflect
  // the real client instead of the proxy.
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  )
  app.use(compression())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))
  app.use(cookieParser(env.COOKIE_SECRET))

  // Structured, always-on request logging (Pino — see config/logger.ts).
  app.use(requestLogger)

  // Human-readable one-line-per-request console output for local
  // development only; Pino above is the system of record in every
  // environment, including production.
  if (isDevelopment) {
    app.use(morgan('dev'))
  }

  // Unversioned — load balancer / orchestrator liveness & readiness probes
  // hit this directly, not through the API version prefix.
  app.use('/health', healthRouter)

  app.use(env.API_PREFIX, apiRouter)

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'KeepXtra API Docs' }))
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
