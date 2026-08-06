import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createStorageRequestRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { Inventory } from '../../src/models/inventory.model'
import { Pickup } from '../../src/models/pickup.model'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[]) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

async function waitForInventory(pickupId: string) {
  return vi.waitFor(async () => {
    const found = await Inventory.findOne({ pickupId }).exec()
    if (!found) throw new Error('inventory not yet created')
    return found
  })
}

describe('Inventory auto-creation on Pickup completion', () => {
  it('creates a Pending Placement inventory record denormalized from the completed pickup', async () => {
    const { request: sr, user: farmerUser } = await createStorageRequestRecord({ status: 'Submitted' })
    const farmerToken = await loginAndGetToken(farmerUser.email, DEFAULT_TEST_PASSWORD)
    const opsToken = await loginAsOperations(['storage-requests.review', 'pickups.manage'])

    await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/submit`).set('Authorization', `Bearer ${farmerToken}`)
    await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/approve`).set('Authorization', `Bearer ${opsToken}`)

    const pickup = await vi.waitFor(async () => {
      const found = await Pickup.findOne({ storageRequestId: sr._id }).exec()
      if (!found) throw new Error('pickup not yet created')
      return found
    })

    await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/schedule`)
      .set('Authorization', `Bearer ${opsToken}`)
      .send({ scheduledDate: new Date(Date.now() + 86400000).toISOString(), scheduledTime: '09:00', driverName: 'D', driverPhone: 'P', vehiclePlateNumber: 'V', vehicleType: 'T' })
    await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/start`).set('Authorization', `Bearer ${opsToken}`)
    await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/arrive`).set('Authorization', `Bearer ${opsToken}`)
    await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/collect`)
      .set('Authorization', `Bearer ${opsToken}`)
      .send({ collectedQuantity: 480, collectedWeightKg: 480 })
    await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/complete`).set('Authorization', `Bearer ${opsToken}`)

    const inventory = await waitForInventory(pickup._id.toString())

    expect(inventory.status).toBe('Pending Placement')
    expect(inventory.inventoryCode).toMatch(/^INV-\d{5}$/)
    expect(inventory.requestNumber).toBe(sr.requestNumber)
    expect(inventory.produceType).toBe(sr.produceType)
    expect(inventory.initialQuantity).toBe(480)
    expect(inventory.currentQuantity).toBe(480)
    expect(inventory.harvestDate.getTime()).toBe(sr.harvestDate.getTime())

    const entries = await vi.waitFor(async () => {
      const found = await AuditLog.find({ entityType: 'Inventory', entityId: inventory._id.toString(), action: 'Inventory Auto-Created' }).exec()
      if (found.length === 0) throw new Error('audit log entry not yet written')
      return found
    })
    expect(entries).toHaveLength(1)
  })
})
