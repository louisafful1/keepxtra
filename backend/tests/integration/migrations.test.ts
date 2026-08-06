import { describe, expect, it } from 'vitest'
import mongoose from 'mongoose'
import { runMigrations } from '../../src/migrations/runner'
// Side-effect import — registers every model, matching how scripts/migrate.ts loads them before running.
import '../../src/models'

describe('runMigrations', () => {
  it('applies a pending migration and records it', async () => {
    const result = await runMigrations()

    expect(result.applied).toContain('0001_sync_indexes')
    expect(result.skipped).not.toContain('0001_sync_indexes')

    const record = await mongoose.connection.collection('migrations').findOne({ migrationId: '0001_sync_indexes' })
    expect(record).toBeTruthy()
  })

  it('skips an already-applied migration on a second run within the same session', async () => {
    const first = await runMigrations()
    expect(first.applied).toContain('0001_sync_indexes')

    const second = await runMigrations()
    expect(second.applied).toHaveLength(0)
    expect(second.skipped).toContain('0001_sync_indexes')
  })
})
