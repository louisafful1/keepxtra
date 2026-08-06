/**
 * Bootstraps a fresh database: the permission catalogue and role
 * definitions (`src/constants/{permissions,roles}.ts`) are the single
 * source of truth for both — this just makes the database agree with them.
 * Idempotent and safe to re-run any time those constants change.
 *
 * Optionally also creates the first Super Admin login, if
 * SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD are set — the only way to get into a
 * brand-new deployment before any other user exists.
 *
 * Usage: npm run seed   (reads backend/.env, same as the app itself)
 */
import 'dotenv/config'
import { connectDatabase, disconnectDatabase } from '../src/config/database'
import { seedDatabase } from '../src/seeding/seed'
import { logger } from '../src/config/logger'

const seedLogger = logger.child({ module: 'seed' })

async function main(): Promise<void> {
  await connectDatabase()
  await seedDatabase()
  await disconnectDatabase()
}

main().catch((err: unknown) => {
  seedLogger.error({ err }, 'Seed failed')
  process.exitCode = 1
})
