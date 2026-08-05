import pino from 'pino'
import { env, isDevelopment } from './env'

/**
 * The single Pino instance for the whole app. Every other logger (HTTP
 * request logging, DB event logging, job logging) is a `.child(...)` of
 * this one so every line shares the same base fields and can be routed the
 * same way in production (stdout -> log shipper).
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'keepxtra-backend', env: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[redacted]',
  },
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname,service,env' },
      }
    : undefined,
})

export const dbLogger = logger.child({ module: 'database' })
export const authLogger = logger.child({ module: 'auth' })
export const httpLogger = logger.child({ module: 'http' })
