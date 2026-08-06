import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'

export type QualityInspectionStatus = 'Pending' | 'In Progress' | 'Approved' | 'Partially Accepted' | 'Rejected'
export type QualityGrade = 'A' | 'B' | 'C' | 'Rejected'

/**
 * A Quality Inspection is always born from a received Inventory record —
 * subscribed by `qualityInspectionAutoCreate.listener.ts` to
 * `INVENTORY_EVENTS.RECEIVED`, exactly the extension point Module 4's doc
 * comment promised. `Pending` is the birth state (awaiting an inspector);
 * `submit` decides the outcome and — for any rejected portion — adjusts
 * the linked Inventory record's quantity down (see "Inventory updates").
 */
export interface IQualityInspection extends Document {
  inspectionCode: string
  inventoryId: Types.ObjectId
  // Denormalized at creation time — same immutable-snapshot pattern used
  // throughout (see storageRequest.model.ts).
  inventoryCode: string
  produceType: string
  warehouseId: Types.ObjectId | null
  warehouseCode: string | null

  inspectorId: Types.ObjectId | null
  status: QualityInspectionStatus

  qualityGrade: QualityGrade | null
  photos: string[]
  defects: string[]
  notes: string | null

  inspectedQuantity: number | null
  acceptedQuantity: number | null
  rejectedQuantity: number | null

  assignedAt: Date | null
  inspectedAt: Date | null

  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const qualityInspectionSchema = new Schema<IQualityInspection>(
  {
    inspectionCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true, unique: true },
    inventoryCode: { type: String, required: true, trim: true, uppercase: true },
    produceType: { type: String, required: true, trim: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', default: null },
    warehouseCode: { type: String, default: null, trim: true, uppercase: true },

    inspectorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['Pending', 'In Progress', 'Approved', 'Partially Accepted', 'Rejected'], default: 'Pending' },

    qualityGrade: { type: String, enum: ['A', 'B', 'C', 'Rejected'], default: null },
    photos: { type: [String], default: [] },
    defects: { type: [String], default: [] },
    notes: { type: String, default: null },

    inspectedQuantity: { type: Number, default: null, min: 0.01 },
    acceptedQuantity: { type: Number, default: null, min: 0 },
    rejectedQuantity: { type: Number, default: null, min: 0 },

    assignedAt: { type: Date, default: null },
    inspectedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

qualityInspectionSchema.plugin(auditablePlugin)

qualityInspectionSchema.index({ status: 1 })
qualityInspectionSchema.index({ warehouseId: 1 })

export const QualityInspection = model<IQualityInspection>('QualityInspection', qualityInspectionSchema)
