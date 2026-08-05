import { Schema, model, type Document } from 'mongoose'

export interface IPermission extends Document {
  key: string
  module: string
  description: string
  createdAt: Date
  updatedAt: Date
}

const permissionSchema = new Schema<IPermission>(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    module: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

permissionSchema.index({ module: 1 })

export const Permission = model<IPermission>('Permission', permissionSchema)
