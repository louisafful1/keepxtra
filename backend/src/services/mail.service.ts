import { logger } from '../config/logger'

const mailLogger = logger.child({ module: 'mail' })

/**
 * Stand-in for a real transactional email provider (SES/Postmark/SendGrid —
 * see the SAD §8 Email Queue Worker). Every call just logs what *would*
 * have been sent, at `info` level, so the auth flows are fully exercisable
 * and testable today. Swapping in a real provider later is a one-file
 * change — nothing that calls `mailService` needs to know.
 */
function send(to: string, subject: string, body: string): Promise<void> {
  mailLogger.info({ to, subject, body }, 'Mock email sent')
  return Promise.resolve()
}

async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
  await send(to, 'Verify your KeepXtra account', `Verify your email by visiting: ${verificationUrl}`)
}

async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await send(to, 'Reset your KeepXtra password', `Reset your password by visiting: ${resetUrl}`)
}

export const mailService = {
  sendVerificationEmail,
  sendPasswordResetEmail,
}
