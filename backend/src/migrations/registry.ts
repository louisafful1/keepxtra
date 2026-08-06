import { migration as m0001SyncIndexes } from './0001_sync_indexes'
import type { Migration } from './types'

/**
 * Explicit, ordered list — append new migrations here, never reorder or
 * edit one that may have already run anywhere (write a new migration to
 * correct it instead, exactly like a SQL migration chain).
 */
export const migrations: Migration[] = [m0001SyncIndexes]
