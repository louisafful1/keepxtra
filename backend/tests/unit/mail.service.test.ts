import { describe, expect, it } from 'vitest'
import { mailService } from '../../src/services/mail.service'

describe('mailService (mock sender)', () => {
  it('sendVerificationEmail resolves without throwing', async () => {
    await expect(mailService.sendVerificationEmail('farmer@keepxtra.com', 'http://localhost/verify-email?token=abc')).resolves.toBeUndefined()
  })

  it('sendPasswordResetEmail resolves without throwing', async () => {
    await expect(
      mailService.sendPasswordResetEmail('farmer@keepxtra.com', 'http://localhost/reset-password?token=abc'),
    ).resolves.toBeUndefined()
  })
})
