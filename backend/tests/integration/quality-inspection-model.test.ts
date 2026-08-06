import { describe, expect, it } from 'vitest'
import { QualityInspection } from '../../src/models/qualityInspection.model'
import { createQualityInspectionRecord } from '../utils/factories'

describe('QualityInspection model constraints', () => {
  it('rejects a duplicate inspectionCode', async () => {
    await createQualityInspectionRecord({ inspectionCode: 'QI-90001' })
    await expect(createQualityInspectionRecord({ inspectionCode: 'QI-90001' })).rejects.toThrow()
  })

  it('rejects a second inspection for the same inventory record', async () => {
    const { inventory } = await createQualityInspectionRecord()
    await expect(createQualityInspectionRecord({ inventoryId: inventory._id })).rejects.toThrow()
  })

  it('rejects an invalid status', async () => {
    const { inventory } = await createQualityInspectionRecord()
    await expect(
      QualityInspection.create({
        inspectionCode: 'QI-90002',
        inventoryId: inventory._id,
        inventoryCode: inventory.inventoryCode,
        produceType: inventory.produceType,
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        status: 'Closed',
      }),
    ).rejects.toThrow()
  })

  it('rejects an invalid qualityGrade', async () => {
    const { inventory } = await createQualityInspectionRecord()
    await expect(
      QualityInspection.create({
        inspectionCode: 'QI-90003',
        inventoryId: inventory._id,
        inventoryCode: inventory.inventoryCode,
        produceType: inventory.produceType,
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        qualityGrade: 'D',
      }),
    ).rejects.toThrow()
  })

  it('defaults status to Pending', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: undefined })
    expect(inspection.status).toBe('Pending')
  })
})
