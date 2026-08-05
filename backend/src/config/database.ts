import mongoose from 'mongoose'
import { dbLogger } from './logger'
import { env, isTest } from './env'

mongoose.set('strictQuery', true)

const MAX_CONNECT_ATTEMPTS = 5
const RETRY_DELAY_MS = 2000

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Connects to MongoDB with retry + linear backoff. Called once from
 * server.ts before the HTTP listener starts — if every attempt fails we
 * exit the process rather than serve traffic against a database that isn't
 * there (fail fast, let the process orchestrator restart us).
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  const uri = isTest && env.MONGODB_URI_TEST ? env.MONGODB_URI_TEST : env.MONGODB_URI

  for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt += 1) {
    try {
      dbLogger.info({ attempt, maxAttempts: MAX_CONNECT_ATTEMPTS }, 'Connecting to MongoDB...')
      const connection = await mongoose.connect(uri)
      dbLogger.info({ host: connection.connection.host, name: connection.connection.name }, 'MongoDB connected')
      return connection
    } catch (error) {
      dbLogger.error({ err: error, attempt }, 'MongoDB connection attempt failed')

      if (attempt === MAX_CONNECT_ATTEMPTS) {
        dbLogger.fatal('Exhausted all MongoDB connection attempts — exiting')
        throw error
      }

      await delay(RETRY_DELAY_MS * attempt)
    }
  }

  // Unreachable — satisfies TypeScript's control-flow analysis.
  throw new Error('Failed to connect to MongoDB')
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) return
  await mongoose.disconnect()
  dbLogger.info('MongoDB disconnected')
}

mongoose.connection.on('error', (error) => {
  dbLogger.error({ err: error }, 'MongoDB connection error')
})

mongoose.connection.on('disconnected', () => {
  dbLogger.warn('MongoDB disconnected unexpectedly')
})

mongoose.connection.on('reconnected', () => {
  dbLogger.info('MongoDB reconnected')
})

/** Readiness helper for the health-check endpoint. */
const CONNECTION_STATE_NAMES: Record<number, 'disconnected' | 'connected' | 'connecting' | 'disconnecting'> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
}

export function getDatabaseState(): 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'unknown' {
  return CONNECTION_STATE_NAMES[mongoose.connection.readyState] ?? 'unknown'
}
