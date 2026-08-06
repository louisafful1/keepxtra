import { describe, expect, it, vi, afterEach } from 'vitest'
import { authService } from '../../src/services/auth.service'
import { userRepository } from '../../src/repositories/user.repository'

/** Same category as coldRoom.service.defensive.test.ts / warehouse.service.defensive.test.ts — races that don't occur in real HTTP traffic (the authenticated caller's own account is deleted between authentication and this call). */

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AuthService.changePassword defensive branches', () => {
  it('throws not-found if the account no longer exists', async () => {
    vi.spyOn(userRepository, 'findByIdWithPassword').mockResolvedValueOnce(null)

    await expect(authService.changePassword('665f1a2b3c4d5e6f7a8b9c0d', 'whatever', 'NewPassword123')).rejects.toThrow('User not found')
  })
})
