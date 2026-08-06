import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createColdRoomRecord, createInventoryRecord, createWarehouseRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'
import { InventoryMovement } from '../../src/models/inventoryMovement.model'
import { INVENTORY_EVENTS, inventoryEvents, type InventoryReceivedEvent } from '../../src/events/inventory.events'

async function loginAsOperations(permissionKeys: string[] = ['inventory.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('POST /api/v1/inventory/:id/receive', () => {
  it('assigns a warehouse and computes expiryDate from harvestDate + shelfLifeDays', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouse._id.toString(), shelfLifeDays: 14, valuePerUnit: 3 })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('In Stock')
    expect(res.body.data.warehouseCode).toBe(warehouse.warehouseCode)
    expect(res.body.data.receivedAt).not.toBeNull()
    const expectedExpiry = new Date(inventory.harvestDate.getTime() + 14 * 24 * 60 * 60 * 1000)
    expect(new Date(res.body.data.expiryDate).getTime()).toBe(expectedExpiry.getTime())
    expect(res.body.data.totalValue).toBe(inventory.currentQuantity * 3)
  })

  it('assigns a cold room belonging to the given warehouse', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouse = await createWarehouseRecord()
    const { coldRoom } = await createColdRoomRecord({ warehouseId: warehouse._id })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouse._id.toString(), coldRoomId: coldRoom._id.toString(), shelfLifeDays: 14 })

    expect(res.status).toBe(200)
    expect(res.body.data.coldRoomCode).toBe(coldRoom.coldRoomCode)
  })

  it('rejects a cold room that does not belong to the given warehouse', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouseA = await createWarehouseRecord()
    const warehouseB = await createWarehouseRecord()
    const { coldRoom } = await createColdRoomRecord({ warehouseId: warehouseB._id })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouseA._id.toString(), coldRoomId: coldRoom._id.toString(), shelfLifeDays: 14 })
    expect(res.status).toBe(400)
  })

  it('logs a "Receipt" movement', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouse._id.toString(), shelfLifeDays: 14 })

    const movements = await InventoryMovement.find({ inventoryId: inventory._id, type: 'Receipt' }).exec()
    expect(movements).toHaveLength(1)
    expect(movements[0]?.quantityAfter).toBe(inventory.currentQuantity)
  })

  it('writes an "Inventory Received" audit log entry', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouse._id.toString(), shelfLifeDays: 14 })

    const entries = await AuditLog.find({ entityType: 'Inventory', entityId: inventory._id.toString(), action: 'Inventory Received' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('emits inventory.received with the farmer’s linked userId', async () => {
    const { inventory, user } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const received: InventoryReceivedEvent[] = []
    const listener = (event: InventoryReceivedEvent) => received.push(event)
    inventoryEvents.on(INVENTORY_EVENTS.RECEIVED, listener)

    try {
      await request(testApp)
        .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
        .set('Authorization', `Bearer ${token}`)
        .send({ warehouseId: warehouse._id.toString(), shelfLifeDays: 14 })
      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({ inventoryId: inventory._id.toString(), farmerUserId: user._id.toString() })
    } finally {
      inventoryEvents.off(INVENTORY_EVENTS.RECEIVED, listener)
    }
  })

  it('rejects receiving an already-received record', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouse._id.toString(), shelfLifeDays: 14 })
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown warehouseId', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: '665f1a2b3c4d5e6f7a8b9c0d', shelfLifeDays: 14 })
    expect(res.status).toBe(404)
  })

  it('returns 404 for an unknown coldRoomId', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouse._id.toString(), coldRoomId: '665f1a2b3c4d5e6f7a8b9c0d', shelfLifeDays: 14 })
    expect(res.status).toBe(404)
  })

  it('returns 404 for an unknown inventory id', async () => {
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/inventory/665f1a2b3c4d5e6f7a8b9c0d/receive')
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouse._id.toString(), shelfLifeDays: 14 })
    expect(res.status).toBe(404)
  })

  it('rejects a non-positive shelfLifeDays', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouse._id.toString(), shelfLifeDays: 0 })
    expect(res.status).toBe(422)
  })

  it('rejects a caller without inventory.manage', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations([])

    const res = await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouse._id.toString(), shelfLifeDays: 14 })
    expect(res.status).toBe(403)
  })
})
