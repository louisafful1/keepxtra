import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createStorageRequestRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { Pickup } from '../../src/models/pickup.model'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['storage-requests.review']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

async function waitForPickup(storageRequestId: string) {
  return vi.waitFor(async () => {
    const found = await Pickup.findOne({ storageRequestId }).exec()
    if (!found) throw new Error('pickup not yet created')
    return found
  })
}

describe('Pickup auto-creation on Storage Request approval', () => {
  it('creates a Pending pickup denormalized from the approved storage request', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)

    const pickup = await waitForPickup(sr._id.toString())

    expect(pickup.status).toBe('Pending')
    expect(pickup.pickupNumber).toMatch(/^PU-\d{5}$/)
    expect(pickup.requestNumber).toBe(sr.requestNumber)
    expect(pickup.farmerId.toString()).toBe(sr.farmerId.toString())
    expect(pickup.farmerName).toBe(sr.farmerName)
    expect(pickup.farmerNumber).toBe(sr.farmerNumber)
    expect(pickup.district).toBe(sr.district)
    expect(pickup.region).toBe(sr.region)
    expect(pickup.produceType).toBe(sr.produceType)
    expect(pickup.quantity).toBe(sr.quantity)
    expect(pickup.unit).toBe(sr.unit)
    expect(pickup.estimatedWeightKg).toBe(sr.estimatedWeightKg)
    expect(pickup.pickupLocation).toBe(sr.pickupLocation)
    expect(pickup.scheduledDate).toBeNull()
    expect(pickup.driverName).toBeNull()
  })

  it('writes a "Pickup Auto-Created" audit log entry attributed to the approving user', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)

    const pickup = await waitForPickup(sr._id.toString())

    // The pickup document itself is written before its audit log entry
    // (two sequential awaits inside the same listener) — polling for the
    // audit log separately avoids a race against that in-flight second write.
    const entries = await vi.waitFor(async () => {
      const found = await AuditLog.find({ entityType: 'Pickup', entityId: pickup._id.toString(), action: 'Pickup Auto-Created' }).exec()
      if (found.length === 0) throw new Error('audit log entry not yet written')
      return found
    })
    expect(entries).toHaveLength(1)
    expect(entries[0]?.userName).toBe('Test User')
  })

  it('does not create a pickup when a storage request is rejected', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/storage-requests/${sr._id.toString()}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Below grade' })

    // Give any stray async work a moment, then assert nothing was created.
    await new Promise((resolve) => setImmediate(resolve))
    const pickup = await Pickup.findOne({ storageRequestId: sr._id }).exec()
    expect(pickup).toBeNull()
  })
})
