import { Schema, model, type Document, type Types } from 'mongoose'

export interface IAuditLog extends Document {
  userId: Types.ObjectId | null
  /** Denormalized snapshot — audit rows must stay readable even if the acting user is later deleted. */
  userName: string
  action: string
  entityType: string
  entityId: Types.ObjectId
  affectedRecord: string
  previousValue: string | null
  newValue: string | null
  ip: string | null
  createdAt: Date
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    userName: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    affectedRecord: { type: String, required: true },
    previousValue: { type: String, default: null },
    newValue: { type: String, default: null },
    ip: { type: String, default: null },
  },
  // Immutable, append-only — no `updatedAt`, no soft delete, never edited or removed.
  { timestamps: { createdAt: true, updatedAt: false } },
)

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ entityType: 1, entityId: 1 })
auditLogSchema.index({ userId: 1, createdAt: -1 })

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema)
