import mongoose, { Schema, type Model } from 'mongoose'
import { migrations } from './registry'
import { logger } from '../config/logger'

const migrationLogger = logger.child({ module: 'migrations' })

interface IAppliedMigration {
  migrationId: string
  appliedAt: Date
}

const appliedMigrationSchema = new Schema<IAppliedMigration>(
  { migrationId: { type: String, required: true, unique: true }, appliedAt: { type: Date, required: true } },
  { collection: 'migrations' },
)

// Guards against "OverwriteModelError" if this module is ever imported twice in the same process (e.g. by both a script and a test).
const AppliedMigration: Model<IAppliedMigration> =
  (mongoose.models.AppliedMigration as Model<IAppliedMigration> | undefined) ?? mongoose.model<IAppliedMigration>('AppliedMigration', appliedMigrationSchema)

export interface MigrationRunResult {
  applied: string[]
  skipped: string[]
}

/** Runs every migration in `registry.ts` that hasn't been recorded as applied yet, in order, and records each as it completes. */
export async function runMigrations(): Promise<MigrationRunResult> {
  const applied: string[] = []
  const skipped: string[] = []

  for (const migration of migrations) {
    const alreadyApplied = await AppliedMigration.findOne({ migrationId: migration.id }).exec()
    if (alreadyApplied) {
      skipped.push(migration.id)
      continue
    }

    migrationLogger.info({ id: migration.id, description: migration.description }, 'Applying migration')
    await migration.up()
    await AppliedMigration.create({ migrationId: migration.id, appliedAt: new Date() })
    applied.push(migration.id)
  }

  return { applied, skipped }
}
