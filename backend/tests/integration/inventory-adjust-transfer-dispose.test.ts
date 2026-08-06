import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createColdRoomRecord, createInventoryRecord, createWarehouseRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'
import { InventoryMovement } from '../../src/models/inventoryMovement.model'

async function loginAsOperations(permissionKeys: string[] = ['inventory.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('PATCH /api/v1/inventory/:id/adjust', () => {
  it('increases quantity', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 400 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/inventory/${inventory._id.toString()}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantityChange: 20, reason: 'Recount found extra crates' })

    expect(res.status).toBe(200)
    expect(res.body.data.currentQuantity).toBe(420)
    expect(res.body.data.status).toBe('In Stock')
  })

  it('decreases quantity to exactly 0 and moves the record to Depleted', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 50 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/inventory/${inventory._id.toString()}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantityChange: -50, reason: 'Fully sold' })

    expect(res.status).toBe(200)
    expect(res.body.data.currentQuantity).toBe(0)
    expect(res.body.data.status).toBe('Depleted')
  })

  it('logs an "Adjustment" movement', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 400 })
    const token = await loginAsOperations()

    await request(testApp)
      .patch(`/api/v1/inventory/${inventory._id.toString()}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantityChange: -20, reason: 'Spoilage found in count' })

    const movements = await InventoryMovement.find({ inventoryId: inventory._id, type: 'Adjustment' }).exec()
    expect(movements).toHaveLength(1)
    expect(movements[0]?.quantityChange).toBe(-20)
    expect(movements[0]?.reason).toBe('Spoilage found in count')
  })

  it('writes an "Inventory Adjusted" audit log entry', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 400 })
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/inventory/${inventory._id.toString()}/adjust`).set('Authorization', `Bearer ${token}`).send({ quantityChange: 10, reason: 'x' })

    const entries = await AuditLog.find({ entityType: 'Inventory', entityId: inventory._id.toString(), action: 'Inventory Adjusted' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects an adjustment that would drop below zero', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 50 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/inventory/${inventory._id.toString()}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantityChange: -100, reason: 'x' })
    expect(res.status).toBe(409)
  })

  it('rejects an adjustment that would drop below the reserved quantity', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 100, reservedQuantity: 40 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/inventory/${inventory._id.toString()}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantityChange: -70, reason: 'x' })
    expect(res.status).toBe(409)
  })

  it('rejects adjusting a Pending Placement record', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/inventory/${inventory._id.toString()}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantityChange: 10, reason: 'x' })
    expect(res.status).toBe(409)
  })

  it('rejects a zero quantityChange', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/inventory/${inventory._id.toString()}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantityChange: 0, reason: 'x' })
    expect(res.status).toBe(422)
  })

  it('requires a reason', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/inventory/${inventory._id.toString()}/adjust`).set('Authorization', `Bearer ${token}`).send({ quantityChange: 10 })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/inventory/665f1a2b3c4d5e6f7a8b9c0d/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantityChange: 10, reason: 'x' })
    expect(res.status).toBe(404)
  })

  it('rejects a caller without inventory.manage', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const token = await loginAsOperations([])

    const res = await request(testApp)
      .patch(`/api/v1/inventory/${inventory._id.toString()}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantityChange: 10, reason: 'x' })
    expect(res.status).toBe(403)
  })
})

describe('POST /api/v1/inventory/:id/transfer', () => {
  it('relocates the record to a new warehouse', async () => {
    const originWarehouse = await createWarehouseRecord()
    const { inventory } = await createInventoryRecord({ status: 'In Stock', warehouseId: originWarehouse._id, warehouseCode: originWarehouse.warehouseCode })
    const destWarehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: destWarehouse._id.toString() })

    expect(res.status).toBe(200)
    expect(res.body.data.warehouseCode).toBe(destWarehouse.warehouseCode)
  })

  it('logs a "Transfer" movement with the correct quantity (unchanged) and from/to warehouses', async () => {
    const originWarehouse = await createWarehouseRecord()
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 300, warehouseId: originWarehouse._id })
    const destWarehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: destWarehouse._id.toString() })

    const movements = await InventoryMovement.find({ inventoryId: inventory._id, type: 'Transfer' }).exec()
    expect(movements).toHaveLength(1)
    expect(movements[0]?.quantityChange).toBe(0)
    expect(movements[0]?.quantityAfter).toBe(300)
    expect(movements[0]?.fromWarehouseId?.toString()).toBe(originWarehouse._id.toString())
    expect(movements[0]?.toWarehouseId?.toString()).toBe(destWarehouse._id.toString())
  })

  it('writes an "Inventory Transferred" audit log entry', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const destWarehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/inventory/${inventory._id.toString()}/transfer`).set('Authorization', `Bearer ${token}`).send({ warehouseId: destWarehouse._id.toString() })

    const entries = await AuditLog.find({ entityType: 'Inventory', entityId: inventory._id.toString(), action: 'Inventory Transferred' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('assigns a cold room belonging to the destination warehouse', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const destWarehouse = await createWarehouseRecord()
    const { coldRoom } = await createColdRoomRecord({ warehouseId: destWarehouse._id })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: destWarehouse._id.toString(), coldRoomId: coldRoom._id.toString() })
    expect(res.status).toBe(200)
    expect(res.body.data.coldRoomCode).toBe(coldRoom.coldRoomCode)
  })

  it('rejects a cold room that does not belong to the destination warehouse', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const destWarehouse = await createWarehouseRecord()
    const otherWarehouse = await createWarehouseRecord()
    const { coldRoom } = await createColdRoomRecord({ warehouseId: otherWarehouse._id })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: destWarehouse._id.toString(), coldRoomId: coldRoom._id.toString() })
    expect(res.status).toBe(400)
  })

  it('rejects transferring a Pending Placement record', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const destWarehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: destWarehouse._id.toString() })
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown warehouseId', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: '665f1a2b3c4d5e6f7a8b9c0d' })
    expect(res.status).toBe(404)
  })

  it('returns 404 for an unknown coldRoomId', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const destWarehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: destWarehouse._id.toString(), coldRoomId: '665f1a2b3c4d5e6f7a8b9c0d' })
    expect(res.status).toBe(404)
  })

  it('returns 404 for an unknown inventory id', async () => {
    const destWarehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/inventory/665f1a2b3c4d5e6f7a8b9c0d/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: destWarehouse._id.toString() })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/inventory/:id/dispose', () => {
  it('zeroes the quantity and marks the record Disposed', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 120 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/dispose`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Mold found during inspection' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Disposed')
    expect(res.body.data.currentQuantity).toBe(0)
    expect(res.body.data.disposalReason).toBe('Mold found during inspection')
    expect(res.body.data.disposedAt).not.toBeNull()
  })

  it('logs a "Disposal" movement', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 120 })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/inventory/${inventory._id.toString()}/dispose`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })

    const movements = await InventoryMovement.find({ inventoryId: inventory._id, type: 'Disposal' }).exec()
    expect(movements).toHaveLength(1)
    expect(movements[0]?.quantityChange).toBe(-120)
    expect(movements[0]?.quantityAfter).toBe(0)
  })

  it('writes an "Inventory Disposed" audit log entry', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/inventory/${inventory._id.toString()}/dispose`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })

    const entries = await AuditLog.find({ entityType: 'Inventory', entityId: inventory._id.toString(), action: 'Inventory Disposed' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects disposing a Pending Placement record', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/inventory/${inventory._id.toString()}/dispose`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })
    expect(res.status).toBe(409)
  })

  it('rejects disposing an already-Disposed record', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Disposed', currentQuantity: 0 })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/inventory/${inventory._id.toString()}/dispose`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })
    expect(res.status).toBe(409)
  })

  it('requires a reason', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/inventory/${inventory._id.toString()}/dispose`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/inventory/665f1a2b3c4d5e6f7a8b9c0d/dispose').set('Authorization', `Bearer ${token}`).send({ reason: 'x' })
    expect(res.status).toBe(404)
  })

  it('rejects a caller without inventory.manage', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const token = await loginAsOperations([])

    const res = await request(testApp).post(`/api/v1/inventory/${inventory._id.toString()}/dispose`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })
    expect(res.status).toBe(403)
  })
})
