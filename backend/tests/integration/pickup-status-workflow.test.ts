import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createPickupRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { StorageRequest } from '../../src/models/storageRequest.model'
import { AuditLog } from '../../src/models/auditLog.model'
import {
  PICKUP_EVENTS,
  pickupEvents,
  type PickupCollectedEvent,
  type PickupCompletedEvent,
} from '../../src/events/pickup.events'

async function loginAsOperations(permissionKeys: string[] = ['pickups.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('POST /api/v1/pickups/:id/start', () => {
  it('moves a Scheduled pickup to En Route', async () => {
    const { pickup } = await createPickupRecord({ status: 'Scheduled' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/start`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('En Route')
  })

  it('rejects starting a Pending pickup', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/start`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('rejects without the pickups.manage permission', async () => {
    const { pickup } = await createPickupRecord({ status: 'Scheduled' })
    const token = await loginAsOperations([])

    const res = await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/start`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/pickups/665f1a2b3c4d5e6f7a8b9c0d/start').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/pickups/:id/arrive', () => {
  it('moves an En Route pickup to Arrived', async () => {
    const { pickup } = await createPickupRecord({ status: 'En Route' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/arrive`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Arrived')
  })

  it('rejects arriving from Scheduled', async () => {
    const { pickup } = await createPickupRecord({ status: 'Scheduled' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/arrive`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/pickups/665f1a2b3c4d5e6f7a8b9c0d/arrive').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

const collectionBody = {
  collectedQuantity: 480,
  collectedWeightKg: 480,
  collectionGpsCoordinates: { lat: 5.6, lng: -0.2 },
  collectionPhotos: ['https://example.com/photo.jpg'],
  collectionNotes: 'All crates in good condition',
}

describe('POST /api/v1/pickups/:id/collect', () => {
  it('records the collection confirmation and moves the pickup to Collected', async () => {
    const { pickup } = await createPickupRecord({ status: 'Arrived' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/collect`)
      .set('Authorization', `Bearer ${token}`)
      .send(collectionBody)

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Collected')
    expect(res.body.data.collectedQuantity).toBe(480)
    expect(res.body.data.collectedWeightKg).toBe(480)
    expect(res.body.data.collectionGpsCoordinates).toMatchObject({ lat: 5.6, lng: -0.2 })
    expect(res.body.data.collectedAt).not.toBeNull()
    expect(res.body.data.collectedBy).not.toBeNull()
  })

  it('emits pickup.collected', async () => {
    const { pickup, user } = await createPickupRecord({ status: 'Arrived' })
    const token = await loginAsOperations()

    const received: PickupCollectedEvent[] = []
    const listener = (event: PickupCollectedEvent) => received.push(event)
    pickupEvents.on(PICKUP_EVENTS.COLLECTED, listener)

    try {
      await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/collect`).set('Authorization', `Bearer ${token}`).send(collectionBody)
      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({ pickupId: pickup._id.toString(), farmerUserId: user._id.toString(), collectedQuantity: 480 })
    } finally {
      pickupEvents.off(PICKUP_EVENTS.COLLECTED, listener)
    }
  })

  it('rejects collecting a pickup that has not arrived', async () => {
    const { pickup } = await createPickupRecord({ status: 'En Route' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/collect`)
      .set('Authorization', `Bearer ${token}`)
      .send(collectionBody)
    expect(res.status).toBe(409)
  })

  it('rejects a non-positive collectedQuantity', async () => {
    const { pickup } = await createPickupRecord({ status: 'Arrived' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/pickups/${pickup._id.toString()}/collect`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...collectionBody, collectedQuantity: 0 })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/pickups/665f1a2b3c4d5e6f7a8b9c0d/collect')
      .set('Authorization', `Bearer ${token}`)
      .send(collectionBody)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/pickups/:id/complete', () => {
  it('completes a Collected pickup and advances the storage request to Completed', async () => {
    const { pickup, request: sr } = await createPickupRecord({ status: 'Collected' })
    await StorageRequest.updateOne({ _id: sr._id }, { $set: { status: 'Pickup Scheduled' } }).exec()
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/complete`).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Completed')
    expect(res.body.data.completedAt).not.toBeNull()

    const updatedSr = await StorageRequest.findById(sr._id).exec()
    expect(updatedSr?.status).toBe('Completed')
  })

  it('writes a "Completed" audit log entry', async () => {
    const { pickup, request: sr } = await createPickupRecord({ status: 'Collected' })
    await StorageRequest.updateOne({ _id: sr._id }, { $set: { status: 'Pickup Scheduled' } }).exec()
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/complete`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'Pickup', entityId: pickup._id.toString(), action: 'Completed' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('emits pickup.completed', async () => {
    const { pickup, request: sr, user } = await createPickupRecord({ status: 'Collected' })
    await StorageRequest.updateOne({ _id: sr._id }, { $set: { status: 'Pickup Scheduled' } }).exec()
    const token = await loginAsOperations()

    const received: PickupCompletedEvent[] = []
    const listener = (event: PickupCompletedEvent) => received.push(event)
    pickupEvents.on(PICKUP_EVENTS.COMPLETED, listener)

    try {
      await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/complete`).set('Authorization', `Bearer ${token}`)
      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({ pickupId: pickup._id.toString(), farmerUserId: user._id.toString() })
    } finally {
      pickupEvents.off(PICKUP_EVENTS.COMPLETED, listener)
    }
  })

  it('rejects completing a pickup that has not been collected', async () => {
    const { pickup } = await createPickupRecord({ status: 'Arrived' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/complete`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('rejects re-completing an already-Completed pickup', async () => {
    const { pickup } = await createPickupRecord({ status: 'Completed' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/pickups/${pickup._id.toString()}/complete`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/pickups/665f1a2b3c4d5e6f7a8b9c0d/complete').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
