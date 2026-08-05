import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createFarmerRecord, createTestRole } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys = ['farmers.update']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', 'Password123')
}

async function createFarmerUser() {
  const role = await createTestRole({ scope: 'farmer', permissions: [] })
  return createActiveUser({ roleId: role._id })
}

describe('PATCH /api/v1/farmers/:id', () => {
  it('lets an Operations user update any field, including notes', async () => {
    const { farmer } = await createFarmerRecord({ farmName: 'Old Farm Name' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ farmName: 'New Farm Name', notes: 'Reliable supplier' })

    expect(res.status).toBe(200)
    expect(res.body.data.farmName).toBe('New Farm Name')
    expect(res.body.data.notes).toBe('Reliable supplier')
  })

  it('leaves preferredPickupDays untouched when a PATCH omits it (regression: a bare Zod default must not resurrect an omitted field)', async () => {
    const { farmer } = await createFarmerRecord({ preferredPickupDays: ['Monday', 'Thursday'] })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ farmName: 'Unrelated Change' })

    expect(res.status).toBe(200)
    expect(res.body.data.preferredPickupDays).toEqual(['Monday', 'Thursday'])
  })

  it('lets a farmer update their own record', async () => {
    const { user, password } = await createFarmerUser()
    const { farmer } = await createFarmerRecord({ userId: user._id, farmName: 'Old Farm Name' })
    const token = await loginAndGetToken(user.email, password)

    const res = await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ farmName: 'Updated By Owner' })

    expect(res.status).toBe(200)
    expect(res.body.data.farmName).toBe('Updated By Owner')
  })

  it("silently strips `notes` from a farmer's self-update", async () => {
    const { user, password } = await createFarmerUser()
    const { farmer } = await createFarmerRecord({ userId: user._id, notes: 'Original ops note' })
    const token = await loginAndGetToken(user.email, password)

    const res = await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'Farmer trying to overwrite ops notes' })

    expect(res.status).toBe(200)
    expect(res.body.data.notes).toBe('Original ops note')
  })

  it('forbids a farmer from updating a different farmer’s record', async () => {
    const { farmer } = await createFarmerRecord()
    const { user, password } = await createFarmerUser()
    const token = await loginAndGetToken(user.email, password)

    const res = await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ farmName: 'Hijacked' })

    expect(res.status).toBe(403)
  })

  it('rejects farmerNumber, userId, or status in the update body', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Inactive' })

    expect(res.status).toBe(422)
  })

  it('rejects an invalid email on update', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-an-email' })

    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/farmers/665f1a2b3c4d5e6f7a8b9c0d')
      .set('Authorization', `Bearer ${token}`)
      .send({ farmName: 'Anything' })
    expect(res.status).toBe(404)
  })

  it('writes a "Farmer Updated" audit log entry with before/after values', async () => {
    const { farmer } = await createFarmerRecord({ farmName: 'Old Farm Name' })
    const token = await loginAsOperations()

    await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ farmName: 'New Farm Name' })

    const entries = await AuditLog.find({ entityType: 'Farmer', entityId: farmer._id.toString(), action: 'Farmer Updated' }).exec()
    expect(entries).toHaveLength(1)
    expect(entries[0]!.previousValue).toContain('Old Farm Name')
    expect(entries[0]!.newValue).toContain('New Farm Name')
  })
})

describe('PATCH /api/v1/farmers/:id/status', () => {
  it('deactivates and reactivates a farmer, writing an audit entry each time', async () => {
    const { farmer } = await createFarmerRecord({ status: 'Active' })
    const token = await loginAsOperations()

    const deactivateRes = await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Inactive' })
    expect(deactivateRes.status).toBe(200)
    expect(deactivateRes.body.data.status).toBe('Inactive')

    const reactivateRes = await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Active' })
    expect(reactivateRes.status).toBe(200)
    expect(reactivateRes.body.data.status).toBe('Active')

    const entries = await AuditLog.find({ entityType: 'Farmer', entityId: farmer._id.toString() }).sort({ createdAt: 1 }).exec()
    expect(entries.map((e) => e.action)).toEqual(['Farmer Deactivated', 'Farmer Reactivated'])
  })

  it('rejects the request without the farmers.update permission', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations(['farmers.read'])

    const res = await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Inactive' })
    expect(res.status).toBe(403)
  })

  it('is not exposed to a farmer for their own record (no self-service status change)', async () => {
    const { user, password } = await createFarmerUser()
    const { farmer } = await createFarmerRecord({ userId: user._id })
    const token = await loginAndGetToken(user.email, password)

    const res = await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Inactive' })
    expect(res.status).toBe(403)
  })

  it('rejects an invalid status value', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/farmers/${farmer._id.toString()}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Retired' })
    expect(res.status).toBe(422)
  })
})
