import { Schema } from 'mongoose'

/**
 * Adds the audit + soft-delete fields the SAD requires on every business
 * collection (`createdBy`/`updatedBy`, `isDeleted`/`deletedAt`) so they
 * don't have to be redeclared on each schema. Filtering `isDeleted: false`
 * is a repository-layer responsibility (see `BaseRepository`), not a
 * schema-level hook here — keeps "deleted" visibility an explicit choice
 * at the call site instead of implicit Mongoose middleware magic.
 */
export function auditablePlugin(schema: Schema): void {
  schema.add({
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  })
}
