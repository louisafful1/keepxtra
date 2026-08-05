import { Schema, model, type Document, type Types } from 'mongoose'

export interface IRefreshToken extends Document {
  userId: Types.ObjectId
  tokenHash: string
  /** Rotation-chain id, shared by every token descended from the same login. Revoked as a whole on reuse detection. */
  family: string
  expiresAt: Date
  revokedAt: Date | null
  replacedByTokenHash: string | null
  userAgent: string | null
  ip: string | null
  createdAt: Date
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenHash: { type: String, default: null },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

refreshTokenSchema.index({ userId: 1, revokedAt: 1 })
refreshTokenSchema.index({ family: 1 })
// TTL — Mongo automatically purges tokens once they expire; no cleanup job needed.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema)
