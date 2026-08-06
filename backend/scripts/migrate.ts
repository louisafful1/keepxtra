/**
 * Applies every not-yet-applied migration in `src/migrations/registry.ts`.
 * Usage: npm run migrate
 */
import 'dotenv/config'
import { connectDatabase, disconnectDatabase } from '../src/config/database'
// Side-effect import — registers every Mongoose model before migrations run (mirrors app.ts).
import '../src/models'
import { runMigrations } from '../src/migrations/runner'
import { logger } from '../src/config/logger'

const migrateLogger = logger.child({ module: 'migrations' })

async function main(): Promise<void> {
  await connectDatabase()
  const result = await runMigrations()
  migrateLogger.info(result, `Migrations complete — ${result.applied.length} applied, ${result.skipped.length} already up to date`)
  await disconnectDatabase()
}

main().catch((err: unknown) => {
  migrateLogger.error({ err }, 'Migration run failed')
  process.exitCode = 1
})
