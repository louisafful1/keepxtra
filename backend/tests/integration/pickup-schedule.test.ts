import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createPickupRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { StorageRequest } from '../../src/models/storageRequest.model'
import { AuditLog } from '../../src/models/auditLog.model'
import { PICKUP_EVENTS, pickupEvents, type PickupScheduledEvent } from '../../src/events/pickup.events'

async function loginAsOperations(permissionKeys: string[] = ['pickups.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

const validSchedule = {
  scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  scheduledTime: '09:00',
  driverName: 'Kofi Mensah',
  driverPhone: '+233 24 222 2222',
  vehiclePlateNumber: 'GT 1234-24',
  vehicleType: 'Refrigerated Truck',
}

describe('POST /api/v1/pickups/:id/schedule', () => {
  it('schedules a Pending pickup and advances the storage request to Pickup Scheduled', async () => {
    const { pickup, request: sr } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send(validSchedule)

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Scheduled')
    expect(res.body.data.driverName).toBe('Kofi Mensah')
    expect(res.body.data.vehiclePlateNumber).toBe('GT 1234-24')

    const updatedSr = await StorageRequest.findById(sr._id).exec()
    expect(updatedSr?.status).toBe('Pickup Scheduled')
  })

  it('writes a "Scheduled" audit log entry on first scheduling', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/schedule`).set('Authorization', `Bearer ${token}`).send(validSchedule)

    const entries = await AuditLog.find({ entityType: 'Pickup', entityId: pickup._id.toString(), action: 'Scheduled' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('emits pickup.scheduled with the farmer’s linked userId', async () => {
    const { pickup, user } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    const received: PickupScheduledEvent[] = []
    const listener = (event: PickupScheduledEvent) => received.push(event)
    pickupEvents.on(PICKUP_EVENTS.SCHEDULED, listener)

    try {
      await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/schedule`).set('Authorization', `Bearer ${token}`).send(validSchedule)
      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({ pickupId: pickup._id.toString(), farmerUserId: user._id.toString() })
    } finally {
      pickupEvents.off(PICKUP_EVENTS.SCHEDULED, listener)
    }
  })

  it('allows rescheduling an already-Scheduled pickup without re-advancing the storage request status a second time', async () => {
    const { pickup, request: sr } = await createPickupRecord({ status: 'Scheduled', driverName: 'Old Driver' })
    await StorageRequest.updateOne({ _id: sr._id }, { $set: { status: 'Pickup Scheduled' } }).exec()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validSchedule, driverName: 'New Driver' })

    expect(res.status).toBe(200)
    expect(res.body.data.driverName).toBe('New Driver')

    const entries = await AuditLog.find({ entityType: 'Pickup', entityId: pickup._id.toString(), action: 'Rescheduled' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects scheduling without the pickups.manage permission', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations([])

    const res = await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/schedule`).set('Authorization', `Bearer ${token}`).send(validSchedule)
    expect(res.status).toBe(403)
  })

  it('rejects scheduling a Completed pickup', async () => {
    const { pickup } = await createPickupRecord({ status: 'Completed' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/schedule`).set('Authorization', `Bearer ${token}`).send(validSchedule)
    expect(res.status).toBe(409)
  })

  it('rejects an incomplete schedule body', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scheduledDate: validSchedule.scheduledDate })
    expect(res.status).toBe(422)
  })

  it('rejects a malformed scheduledTime', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validSchedule, scheduledTime: '9am' })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/pickups/665f1a2b3c4d5e6f7a8b9c0d/schedule')
      .set('Authorization', `Bearer ${token}`)
      .send(validSchedule)
    expect(res.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const res = await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/schedule`).send(validSchedule)
    expect(res.status).toBe(401)
  })
})
