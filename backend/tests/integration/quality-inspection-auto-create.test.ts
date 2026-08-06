import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createInventoryRecord, createWarehouseRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { QualityInspection } from '../../src/models/qualityInspection.model'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['inventory.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

async function waitForInspection(inventoryId: string) {
  return vi.waitFor(async () => {
    const found = await QualityInspection.findOne({ inventoryId }).exec()
    if (!found) throw new Error('inspection not yet created')
    return found
  })
}

describe('Quality Inspection auto-creation on Inventory receipt', () => {
  it('creates a Pending inspection denormalized from the received inventory', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouse = await createWarehouseRecord({ name: 'Nsawam Cold Store' })
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouse._id.toString(), shelfLifeDays: 14 })

    const inspection = await waitForInspection(inventory._id.toString())

    expect(inspection.status).toBe('Pending')
    expect(inspection.inspectionCode).toMatch(/^QI-\d{5}$/)
    expect(inspection.inventoryCode).toBe(inventory.inventoryCode)
    expect(inspection.produceType).toBe(inventory.produceType)
    expect(inspection.warehouseCode).toBe(warehouse.warehouseCode)

    const entries = await vi.waitFor(async () => {
      const found = await AuditLog.find({
        entityType: 'QualityInspection',
        entityId: inspection._id.toString(),
        action: 'Quality Inspection Auto-Created',
      }).exec()
      if (found.length === 0) throw new Error('audit log entry not yet written')
      return found
    })
    expect(entries).toHaveLength(1)
  })
})
