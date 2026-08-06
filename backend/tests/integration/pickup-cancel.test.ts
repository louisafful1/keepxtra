import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createPickupRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { StorageRequest } from '../../src/models/storageRequest.model'
import { AuditLog } from '../../src/models/auditLog.model'
import { PICKUP_EVENTS, pickupEvents, type PickupCancelledEvent } from '../../src/events/pickup.events'

async function loginAsOperations(permissionKeys: string[] = ['pickups.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('POST /api/v1/pickups/:id/cancel', () => {
  it('cancels a Pending pickup without touching the storage request status', async () => {
    const { pickup, request: sr } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Farmer withdrew produce' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Cancelled')
    expect(res.body.data.cancellationReason).toBe('Farmer withdrew produce')

    const updatedSr = await StorageRequest.findById(sr._id).exec()
    expect(updatedSr?.status).toBe('Approved')
  })

  it('reverts the storage request to Approved when cancelling a Scheduled pickup', async () => {
    const { pickup, request: sr } = await createPickupRecord({ status: 'Scheduled' })
    await StorageRequest.updateOne({ _id: sr._id }, { $set: { status: 'Pickup Scheduled' } }).exec()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Vehicle breakdown' })
    expect(res.status).toBe(200)

    const updatedSr = await StorageRequest.findById(sr._id).exec()
    expect(updatedSr?.status).toBe('Approved')
  })

  it('writes a "Cancelled" audit log entry', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'x' })

    const entries = await AuditLog.find({ entityType: 'Pickup', entityId: pickup._id.toString(), action: 'Cancelled' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('emits pickup.cancelled with the reason', async () => {
    const { pickup, user } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    const received: PickupCancelledEvent[] = []
    const listener = (event: PickupCancelledEvent) => received.push(event)
    pickupEvents.on(PICKUP_EVENTS.CANCELLED, listener)

    try {
      await request(testApp)
        .post(`/api/v1/pickups/${pickup._id.toString()}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Farmer withdrew produce' })
      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({ pickupId: pickup._id.toString(), farmerUserId: user._id.toString(), reason: 'Farmer withdrew produce' })
    } finally {
      pickupEvents.off(PICKUP_EVENTS.CANCELLED, listener)
    }
  })

  it('requires a cancellation reason', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(422)
  })

  it('rejects cancelling a Collected pickup', async () => {
    const { pickup } = await createPickupRecord({ status: 'Collected' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'x' })
    expect(res.status).toBe(409)
  })

  it('rejects cancelling a Completed pickup', async () => {
    const { pickup } = await createPickupRecord({ status: 'Completed' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'x' })
    expect(res.status).toBe(409)
  })

  it('rejects without the pickups.manage permission', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations([])

    const res = await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'x' })
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/pickups/665f1a2b3c4d5e6f7a8b9c0d/cancel')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'x' })
    expect(res.status).toBe(404)
  })
})
