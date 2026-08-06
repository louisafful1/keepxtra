import { describe, expect, it } from 'vitest'
import { loadActor } from '../../src/utils/systemActor'
import { createActiveUser } from '../utils/factories'

describe('loadActor', () => {
  it('rebuilds the AuthenticatedUser view for a given userId', async () => {
    const { user } = await createActiveUser({ permissionKeys: ['warehouses.manage'] })

    const actor = await loadActor(user._id.toString())

    expect(actor.id).toBe(user._id.toString())
    expect(actor.email).toBe(user.email)
    expect(actor.permissions).toContain('warehouses.manage')
  })

  it('throws not-found for a userId that does not exist', async () => {
    await expect(loadActor('665f1a2b3c4d5e6f7a8b9c0d')).rejects.toThrow('User not found')
  })
})
