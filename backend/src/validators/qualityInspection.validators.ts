import { z } from 'zod'
import { listQuerySchema } from './common.validators'

const QUALITY_INSPECTION_STATUSES = ['Pending', 'In Progress', 'Approved', 'Partially Accepted', 'Rejected'] as const
const QUALITY_GRADES = ['A', 'B', 'C', 'Rejected'] as const

export const assignInspectorSchema = z.object({
  inspectorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid inspector id format'),
})

export const submitInspectionSchema = z
  .object({
    qualityGrade: z.enum(QUALITY_GRADES),
    inspectedQuantity: z.number().positive('Inspected quantity must be greater than 0'),
    acceptedQuantity: z.number().min(0, 'Accepted quantity cannot be negative'),
    photos: z.array(z.string().url('Each photo must be a valid URL')).optional().default([]),
    defects: z.array(z.string().trim().min(1)).optional().default([]),
    notes: z.string().trim().min(1).optional(),
  })
  .refine((data) => data.acceptedQuantity <= data.inspectedQuantity, {
    message: 'acceptedQuantity cannot exceed inspectedQuantity',
    path: ['acceptedQuantity'],
  })

export const qualityInspectionListQuerySchema = listQuerySchema.extend({
  status: z.enum(QUALITY_INSPECTION_STATUSES).optional(),
  qualityGrade: z.enum(QUALITY_GRADES).optional(),
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse id format').optional(),
  inventoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid inventory id format').optional(),
})

export type AssignInspectorInput = z.infer<typeof assignInspectorSchema>
export type SubmitInspectionInput = z.infer<typeof submitInspectionSchema>
export type QualityInspectionListQuery = z.infer<typeof qualityInspectionListQuerySchema>
