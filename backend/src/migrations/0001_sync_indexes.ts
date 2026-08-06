import mongoose from 'mongoose'
import type { Migration } from './types'

/**
 * Reconciles every collection's actual indexes with what its current
 * Mongoose schema declares — creates anything missing (e.g. `order.model.ts`'s
 * `{status, confirmedAt}` index, added after the collection already existed
 * in some environments) and drops anything no longer declared. Safe to run
 * repeatedly; a no-op once indexes are already in sync.
 */
export const migration: Migration = {
  id: '0001_sync_indexes',
  description: "Reconciles every collection's indexes with the current Mongoose schemas.",
  async up() {
    for (const model of Object.values(mongoose.models)) {
      await model.syncIndexes()
    }
  },
}
