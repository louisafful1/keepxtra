import type { Server } from 'node:http'
import { createApp } from './app'
import { env } from './config/env'
import { logger } from './config/logger'
import { connectDatabase, disconnectDatabase } from './config/database'

const SHUTDOWN_TIMEOUT_MS = 10000

async function main() {
  await connectDatabase()

  const app = createApp()
  const server: Server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, docs: `http://localhost:${env.PORT}/docs` },
      `KeepXtra API listening on port ${env.PORT}`,
    )
  })

  registerShutdownHandlers(server)
}

function registerShutdownHandlers(server: Server) {
  let shuttingDown = false

  const shutdown = (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true

    logger.info({ signal }, 'Shutdown signal received — closing server gracefully')

    const forceExitTimer = setTimeout(() => {
      logger.fatal('Graceful shutdown timed out — forcing exit')
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS)
    forceExitTimer.unref()

    const finishShutdown = async (closeError?: Error) => {
      if (closeError) {
        logger.error({ err: closeError }, 'Error while closing HTTP server')
      }

      try {
        await disconnectDatabase()
        clearTimeout(forceExitTimer)
        logger.info('Shutdown complete')
        process.exit(closeError ? 1 : 0)
      } catch (error) {
        logger.error({ err: error }, 'Error while disconnecting from MongoDB during shutdown')
        clearTimeout(forceExitTimer)
        process.exit(1)
      }
    }

    server.close((closeError) => {
      void finishShutdown(closeError)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection')
    shutdown('unhandledRejection')
  })

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception')
    shutdown('uncaughtException')
  })
}

main().catch((error) => {
  logger.fatal({ err: error }, 'Fatal error during application startup')
  process.exit(1)
})
