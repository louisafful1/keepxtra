import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'

export type RoleScope = 'farmer' | 'operations'

export interface IRole extends Document {
  name: string
  scope: RoleScope
  description: string
  permissions: Types.ObjectId[]
  /** System roles (seeded from `constants/roles.ts`) can't be deleted via the API. */
  isSystem: boolean
  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    scope: { type: String, enum: ['farmer', 'operations'], required: true },
    description: { type: String, required: true, trim: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
)

roleSchema.plugin(auditablePlugin)
roleSchema.index({ scope: 1 })

export const Role = model<IRole>('Role', roleSchema)
