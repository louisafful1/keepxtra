import { randomUUID } from 'node:crypto'
import { userRepository } from '../repositories/user.repository'
import { refreshTokenRepository } from '../repositories/refreshToken.repository'
import { passwordResetTokenRepository } from '../repositories/passwordResetToken.repository'
import { emailVerificationTokenRepository } from '../repositories/emailVerificationToken.repository'
import { mailService } from './mail.service'
import { auditService } from './audit.service'
import { loadActor } from '../utils/systemActor'
import { hashPassword, comparePassword } from '../utils/password'
import { generateOpaqueToken, hashToken } from '../utils/crypto'
import { signAccessToken, getTokenExpiryMs } from '../utils/jwt'
import { ApiError } from '../utils/ApiError'
import { authLogger } from '../config/logger'
import { env } from '../config/env'
import {
  REFRESH_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_REMEMBER_ME_FALSE_MS,
  PASSWORD_RESET_TOKEN_TTL_MS,
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
} from '../constants/auth'
import type { IUser } from '../models/user.model'
import type { IRole } from '../models/role.model'
import type { IPermission } from '../models/permission.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { LoginResultDto, RefreshResultDto, SafeUserDto } from '../types/auth.dto'

export interface RequestMeta {
  userAgent?: string | null
  ip?: string | null
}

export interface IssuedTokens<T> {
  result: T
  refreshToken: string
  refreshTokenTtlMs: number
}

function toSafeUserDto(user: IUser): SafeUserDto {
  const role = user.roleId as unknown as IRole
  const permissions = (role.permissions as unknown as IPermission[]).map((permission) => permission.key)

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarInitials: user.avatarInitials,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    role: { id: role._id.toString(), name: role.name, permissions },
  }
}

/** Builds the audit-log actor view from a user document already populated with its role (as `findByEmailForLogin` returns) — avoids a second DB round trip via `loadActor`. */
function actorFromUser(user: IUser): AuthenticatedUser {
  const role = user.roleId as unknown as IRole
  const permissions = (role.permissions as unknown as IPermission[]).map((permission) => permission.key)

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatarInitials: user.avatarInitials,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    roleId: role._id.toString(),
    roleName: role.name,
    permissions,
  }
}

function assertLoginEligible(user: IUser) {
  if (user.status === 'Suspended') {
    throw ApiError.forbidden('Your account has been suspended. Contact support for help.')
  }
  if (user.status === 'Pending Review') {
    throw ApiError.forbidden('Your account is still pending review.')
  }
  if (!user.emailVerifiedAt) {
    throw ApiError.forbidden('Please verify your email address before logging in.')
  }
}

async function issueRefreshToken(
  userId: string,
  family: string,
  meta: RequestMeta,
  ttlMs = REFRESH_TOKEN_TTL_MS,
): Promise<{ raw: string; expiresAt: Date }> {
  const raw = generateOpaqueToken()
  const expiresAt = new Date(Date.now() + ttlMs)

  await refreshTokenRepository.create({
    userId,
    tokenHash: hashToken(raw),
    family,
    expiresAt,
    userAgent: meta.userAgent ?? null,
    ip: meta.ip ?? null,
  })

  return { raw, expiresAt }
}

async function login(
  input: { email: string; password: string; rememberMe?: boolean },
  meta: RequestMeta,
): Promise<IssuedTokens<LoginResultDto>> {
  const user = await userRepository.findByEmailForLogin(input.email)

  if (!user) {
    // No matching account at all — nothing to attribute a lockout/audit entry to; the generic warning below is all there is to log.
    authLogger.warn({ email: input.email }, 'Login failed — no matching account')
    throw ApiError.unauthorized('Invalid email or password')
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await auditService.record({
      actor: actorFromUser(user),
      action: 'Login Blocked — Account Locked',
      entityType: 'User',
      entityId: user._id.toString(),
      affectedRecord: user.email,
      newValue: `Locked until ${user.lockedUntil.toISOString()}`,
      ip: meta.ip,
    })
    throw ApiError.forbidden('Too many failed login attempts. Please try again later.')
  }

  // A lock that has already expired is a clean slate — clear it before evaluating this attempt.
  if (user.lockedUntil) {
    await userRepository.resetLoginAttempts(user._id.toString())
    user.failedLoginAttempts = 0
    user.lockedUntil = null
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash)

  if (!passwordMatches) {
    const { count, justLocked } = await userRepository.registerFailedLogin(user._id.toString(), env.LOGIN_MAX_ATTEMPTS, env.LOGIN_LOCKOUT_MINUTES)
    authLogger.warn({ userId: user._id.toString(), attempts: count, locked: justLocked }, 'Login failed — invalid password')
    await auditService.record({
      actor: actorFromUser(user),
      action: justLocked ? 'Account Locked (too many failed logins)' : 'Login Failed — Invalid Password',
      entityType: 'User',
      entityId: user._id.toString(),
      affectedRecord: user.email,
      newValue: `Attempt ${count} of ${env.LOGIN_MAX_ATTEMPTS}`,
      ip: meta.ip,
    })
    throw ApiError.unauthorized('Invalid email or password')
  }

  assertLoginEligible(user)

  if (user.failedLoginAttempts > 0) {
    await userRepository.resetLoginAttempts(user._id.toString())
  }

  const accessToken = signAccessToken({ sub: user._id.toString(), tokenVersion: user.tokenVersion })
  const ttlMs = input.rememberMe === false ? REFRESH_TOKEN_TTL_REMEMBER_ME_FALSE_MS : REFRESH_TOKEN_TTL_MS
  const { raw: refreshToken } = await issueRefreshToken(user._id.toString(), randomUUID(), meta, ttlMs)

  await userRepository.touchLastLogin(user._id.toString())
  authLogger.info({ userId: user._id.toString() }, 'Login succeeded')
  await auditService.record({
    actor: actorFromUser(user),
    action: 'Login Succeeded',
    entityType: 'User',
    entityId: user._id.toString(),
    affectedRecord: user.email,
    ip: meta.ip,
  })

  return {
    result: { user: toSafeUserDto(user), accessToken, expiresAt: getTokenExpiryMs(accessToken) },
    refreshToken,
    refreshTokenTtlMs: ttlMs,
  }
}

async function logout(refreshTokenRaw: string | undefined): Promise<void> {
  if (!refreshTokenRaw) return
  await refreshTokenRepository.revokeByTokenHash(hashToken(refreshTokenRaw))
}

async function refresh(refreshTokenRaw: string | undefined, meta: RequestMeta): Promise<IssuedTokens<RefreshResultDto>> {
  if (!refreshTokenRaw) throw ApiError.unauthorized('No refresh token provided')

  const presentedHash = hashToken(refreshTokenRaw)
  const existing = await refreshTokenRepository.findByTokenHash(presentedHash)

  if (!existing) throw ApiError.unauthorized('Invalid refresh token')

  if (existing.revokedAt) {
    // The same refresh token was presented twice — it was already rotated
    // away once, so this is either a replay attack or a stale client. Kill
    // the whole session family rather than just this one token.
    authLogger.warn({ userId: existing.userId, family: existing.family }, 'Refresh token reuse detected — revoking session family')
    await refreshTokenRepository.revokeFamily(existing.family)
    throw ApiError.unauthorized('Session invalidated — please log in again')
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    throw ApiError.unauthorized('Refresh token has expired — please log in again')
  }

  const user = await userRepository.findById(existing.userId.toString())
  if (!user || user.status !== 'Active') {
    await refreshTokenRepository.revokeFamily(existing.family)
    throw ApiError.unauthorized('Account is no longer active')
  }

  const { raw: newRefreshToken } = await issueRefreshToken(user._id.toString(), existing.family, meta)
  await refreshTokenRepository.revokeByTokenHash(presentedHash, hashToken(newRefreshToken))

  const accessToken = signAccessToken({ sub: user._id.toString(), tokenVersion: user.tokenVersion })

  return {
    result: { accessToken, expiresAt: getTokenExpiryMs(accessToken) },
    refreshToken: newRefreshToken,
    refreshTokenTtlMs: REFRESH_TOKEN_TTL_MS,
  }
}

async function forgotPassword(email: string): Promise<void> {
  const user = await userRepository.findByEmail(email)
  // Always behave the same whether or not the account exists — the
  // controller returns one generic message either way, so no timing/
  // response difference reveals account existence.
  if (!user) return

  const raw = generateOpaqueToken()
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS)
  await passwordResetTokenRepository.create(user._id.toString(), hashToken(raw), expiresAt)

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${raw}`
  await mailService.sendPasswordResetEmail(user.email, resetUrl)
}

async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenDoc = await passwordResetTokenRepository.findValidByTokenHash(hashToken(rawToken))
  if (!tokenDoc) throw ApiError.badRequest('This password reset link is invalid or has expired.')

  const userId = tokenDoc.userId.toString()
  await userRepository.setPassword(userId, await hashPassword(newPassword))
  await passwordResetTokenRepository.markUsed(tokenDoc._id.toString())
  await refreshTokenRepository.revokeAllForUser(userId)
  await userRepository.resetLoginAttempts(userId)
  authLogger.info({ userId }, 'Password reset — all sessions revoked')

  const actor = await loadActor(userId)
  await auditService.record({
    actor,
    action: 'Password Reset',
    entityType: 'User',
    entityId: userId,
    affectedRecord: actor.email,
    newValue: 'All sessions revoked',
  })
}

async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await userRepository.findByIdWithPassword(userId)
  if (!user) throw ApiError.notFound('User not found')

  const isMatch = await comparePassword(currentPassword, user.passwordHash)
  if (!isMatch) throw ApiError.unauthorized('Current password is incorrect')

  await userRepository.setPassword(userId, await hashPassword(newPassword))
  await refreshTokenRepository.revokeAllForUser(userId)
  authLogger.info({ userId }, 'Password changed — all sessions revoked')

  const actor = await loadActor(userId)
  await auditService.record({
    actor,
    action: 'Password Changed',
    entityType: 'User',
    entityId: userId,
    affectedRecord: actor.email,
    newValue: 'All sessions revoked',
  })
}

async function verifyEmail(rawToken: string): Promise<void> {
  const tokenDoc = await emailVerificationTokenRepository.findValidByTokenHash(hashToken(rawToken))
  if (!tokenDoc) throw ApiError.badRequest('This verification link is invalid or has expired.')

  await userRepository.markEmailVerified(tokenDoc.userId.toString())
  await emailVerificationTokenRepository.markUsed(tokenDoc._id.toString())
}

async function resendVerification(email: string): Promise<void> {
  const user = await userRepository.findByEmail(email)
  if (!user || user.emailVerifiedAt) return

  const raw = generateOpaqueToken()
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS)
  await emailVerificationTokenRepository.create(user._id.toString(), hashToken(raw), expiresAt)

  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${raw}`
  await mailService.sendVerificationEmail(user.email, verificationUrl)
}

export const authService = {
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
}
