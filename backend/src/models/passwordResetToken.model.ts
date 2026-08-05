import { Schema, model, type Document, type Types } from 'mongoose'

export interface IPasswordResetToken extends Document {
  userId: Types.ObjectId
  tokenHash: string
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

passwordResetTokenSchema.index({ userId: 1, usedAt: 1 })
// TTL — Mongo automatically purges tokens once they expire; no cleanup job needed.
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const PasswordResetToken = model<IPasswordResetToken>('PasswordResetToken', passwordResetTokenSchema)
