import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'

export type UserStatus = 'Active' | 'Suspended' | 'Pending Review'

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  roleId: Types.ObjectId
  avatarInitials: string
  phone: string
  status: UserStatus
  emailVerifiedAt: Date | null
  lastLoginAt: Date | null
  passwordChangedAt: Date | null
  /** Bumped on password change/reset — any access token signed before the bump is rejected by `authenticate`, giving instant "log out everywhere". */
  tokenVersion: number
  /** Brute-force lockout — consecutive bad-password attempts since the last success/reset; reset to 0 on either. See `LOGIN_MAX_ATTEMPTS`/`LOGIN_LOCKOUT_MINUTES` in env.ts and `auth.service.ts#login`. */
  failedLoginAttempts: number
  lockedUntil: Date | null
  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    // `select: false` — a password hash must never come back on a normal
    // `find`/`findOne`; the future AuthService opts in explicitly with
    // `.select('+passwordHash')` when it needs to verify credentials.
    passwordHash: { type: String, required: true, select: false },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    avatarInitials: { type: String, required: true, trim: true, uppercase: true, maxlength: 3 },
    phone: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Active', 'Suspended', 'Pending Review'], default: 'Pending Review' },
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true },
)

userSchema.plugin(auditablePlugin)

// `isDeleted` already has its own index via `auditablePlugin`.
userSchema.index({ roleId: 1, status: 1 })

export const User = model<IUser>('User', userSchema)
