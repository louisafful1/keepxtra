import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createPickupRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['pickups.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('PATCH /api/v1/pickups/:id/route-notes', () => {
  it('updates route notes regardless of status', async () => {
    const { pickup } = await createPickupRecord({ status: 'Completed' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/pickups/${pickup._id.toString()}/route-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ routeNotes: 'Use the back gate — front gate under repair' })

    expect(res.status).toBe(200)
    expect(res.body.data.routeNotes).toBe('Use the back gate — front gate under repair')
  })

  it('writes a "Route Notes Updated" audit log entry', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    await request(testApp)
      .patch(`/api/v1/pickups/${pickup._id.toString()}/route-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ routeNotes: 'Call ahead' })

    const entries = await AuditLog.find({ entityType: 'Pickup', entityId: pickup._id.toString(), action: 'Route Notes Updated' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects empty route notes', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/pickups/${pickup._id.toString()}/route-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ routeNotes: '' })
    expect(res.status).toBe(422)
  })

  it('rejects without the pickups.manage permission', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const token = await loginAsOperations([])

    const res = await request(testApp)
      .patch(`/api/v1/pickups/${pickup._id.toString()}/route-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ routeNotes: 'Call ahead' })
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/pickups/665f1a2b3c4d5e6f7a8b9c0d/route-notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ routeNotes: 'Call ahead' })
    expect(res.status).toBe(404)
  })
})
