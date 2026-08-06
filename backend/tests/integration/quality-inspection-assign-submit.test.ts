import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createQualityInspectionRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { Inventory } from '../../src/models/inventory.model'
import { InventoryMovement } from '../../src/models/inventoryMovement.model'
import { AuditLog } from '../../src/models/auditLog.model'
import {
  QUALITY_INSPECTION_EVENTS,
  qualityInspectionEvents,
  type QualityInspectionCompletedEvent,
} from '../../src/events/qualityInspection.events'

async function loginAsOperations(permissionKeys: string[] = ['inspections.manage']) {
  const { user } = await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  const token = await loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
  return { token, user }
}

describe('PATCH /api/v1/quality-inspections/:id/assign', () => {
  it('assigns an inspector and moves the inspection to In Progress', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    const { token } = await loginAsOperations()
    const inspector = await createActiveUser({ email: 'inspector@keepxtra.com', permissionKeys: [] })

    const res = await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ inspectorId: inspector.user._id.toString() })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('In Progress')
    expect(res.body.data.inspectorId).toBe(inspector.user._id.toString())
    expect(res.body.data.assignedAt).not.toBeNull()
  })

  it('writes an "Inspector Assigned" audit log entry', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    const { token } = await loginAsOperations()
    const inspector = await createActiveUser({ email: 'inspector@keepxtra.com', permissionKeys: [] })

    await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ inspectorId: inspector.user._id.toString() })

    const entries = await AuditLog.find({ entityType: 'QualityInspection', entityId: inspection._id.toString(), action: 'Inspector Assigned' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects assigning an unknown inspectorId', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    const { token } = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ inspectorId: '665f1a2b3c4d5e6f7a8b9c0d' })
    expect(res.status).toBe(404)
  })

  it('rejects assigning to an inspection that already has one', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'In Progress' })
    const { token } = await loginAsOperations()
    const inspector = await createActiveUser({ email: 'inspector@keepxtra.com', permissionKeys: [] })

    const res = await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ inspectorId: inspector.user._id.toString() })
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown inspection id', async () => {
    const { token } = await loginAsOperations()
    const inspector = await createActiveUser({ email: 'inspector@keepxtra.com', permissionKeys: [] })

    const res = await request(testApp)
      .patch('/api/v1/quality-inspections/665f1a2b3c4d5e6f7a8b9c0d/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({ inspectorId: inspector.user._id.toString() })
    expect(res.status).toBe(404)
  })

  it('rejects a caller without inspections.manage', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    const { token } = await loginAsOperations([])
    const inspector = await createActiveUser({ email: 'inspector@keepxtra.com', permissionKeys: [] })

    const res = await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ inspectorId: inspector.user._id.toString() })
    expect(res.status).toBe(403)
  })
})

describe('PATCH /api/v1/quality-inspections/:id/submit', () => {
  it('fully approves when acceptedQuantity equals inspectedQuantity', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    const { token } = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qualityGrade: 'A', inspectedQuantity: 480, acceptedQuantity: 480 })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Approved')
    expect(res.body.data.rejectedQuantity).toBe(0)
  })

  it('fully rejects when acceptedQuantity is 0', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    const { token } = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qualityGrade: 'Rejected', inspectedQuantity: 480, acceptedQuantity: 0, defects: ['Mold'] })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Rejected')
    expect(res.body.data.rejectedQuantity).toBe(480)
  })

  it('partially accepts and deducts the rejected portion from Inventory', async () => {
    const inventoryOverrides = { status: 'In Stock' as const, currentQuantity: 480 }
    const { inspection, inventory } = await createQualityInspectionRecord({ status: 'Pending' })
    await Inventory.updateOne({ _id: inventory._id }, { $set: inventoryOverrides }).exec()
    const { token } = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qualityGrade: 'B', inspectedQuantity: 480, acceptedQuantity: 450, defects: ['Minor bruising'] })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Partially Accepted')
    expect(res.body.data.rejectedQuantity).toBe(30)

    const updatedInventory = await Inventory.findById(inventory._id).exec()
    expect(updatedInventory?.currentQuantity).toBe(450)

    const movements = await InventoryMovement.find({ inventoryId: inventory._id, type: 'Adjustment' }).exec()
    expect(movements).toHaveLength(1)
    expect(movements[0]?.quantityChange).toBe(-30)
    expect(movements[0]?.reason).toContain(inspection.inspectionCode)
  })

  it('fully rejects and depletes the inventory record when rejected quantity equals current quantity', async () => {
    const { inspection, inventory } = await createQualityInspectionRecord({ status: 'Pending' })
    await Inventory.updateOne({ _id: inventory._id }, { $set: { status: 'In Stock', currentQuantity: 100 } }).exec()
    const { token } = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qualityGrade: 'Rejected', inspectedQuantity: 100, acceptedQuantity: 0, defects: ['Rotten'] })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Rejected')

    const updatedInventory = await Inventory.findById(inventory._id).exec()
    expect(updatedInventory?.currentQuantity).toBe(0)
    expect(updatedInventory?.status).toBe('Depleted')
  })

  it('writes an "Inspection Submitted" audit log entry', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    const { token } = await loginAsOperations()

    await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qualityGrade: 'A', inspectedQuantity: 100, acceptedQuantity: 100 })

    const entries = await AuditLog.find({ entityType: 'QualityInspection', entityId: inspection._id.toString(), action: 'Inspection Submitted' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('emits qualityInspection.completed with the farmer’s linked userId', async () => {
    const { inspection, inventory } = await createQualityInspectionRecord({ status: 'Pending' })
    const { token } = await loginAsOperations()

    const received: QualityInspectionCompletedEvent[] = []
    const listener = (event: QualityInspectionCompletedEvent) => received.push(event)
    qualityInspectionEvents.on(QUALITY_INSPECTION_EVENTS.COMPLETED, listener)

    try {
      await request(testApp)
        .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ qualityGrade: 'A', inspectedQuantity: 100, acceptedQuantity: 100 })
      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({ inspectionId: inspection._id.toString(), farmerId: inventory.farmerId.toString(), status: 'Approved' })
    } finally {
      qualityInspectionEvents.off(QUALITY_INSPECTION_EVENTS.COMPLETED, listener)
    }
  })

  it('submits directly from Pending without a prior assign', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    const { token } = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qualityGrade: 'A', inspectedQuantity: 100, acceptedQuantity: 100 })
    expect(res.status).toBe(200)
  })

  it('rejects an acceptedQuantity greater than inspectedQuantity', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    const { token } = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qualityGrade: 'A', inspectedQuantity: 100, acceptedQuantity: 200 })
    expect(res.status).toBe(422)
  })

  it('rejects resubmitting an already-decided inspection', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Approved' })
    const { token } = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qualityGrade: 'A', inspectedQuantity: 100, acceptedQuantity: 100 })
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const { token } = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/quality-inspections/665f1a2b3c4d5e6f7a8b9c0d/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ qualityGrade: 'A', inspectedQuantity: 100, acceptedQuantity: 100 })
    expect(res.status).toBe(404)
  })

  it('rejects a caller without inspections.manage', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    const { token } = await loginAsOperations([])

    const res = await request(testApp)
      .patch(`/api/v1/quality-inspections/${inspection._id.toString()}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qualityGrade: 'A', inspectedQuantity: 100, acceptedQuantity: 100 })
    expect(res.status).toBe(403)
  })
})
