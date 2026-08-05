import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { authService, type RequestMeta } from '../services/auth.service'
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/cookies'
import { REFRESH_COOKIE_NAME } from '../constants/auth'
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '../validators/auth.validators'

function requestMeta(req: Request): RequestMeta {
  return { userAgent: req.headers['user-agent'] ?? null, ip: req.ip ?? null }
}

function readRefreshCookie(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, string | undefined> | undefined
  return cookies?.[REFRESH_COOKIE_NAME]
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LoginInput
  const { result, refreshToken, refreshTokenTtlMs } = await authService.login(body, requestMeta(req))
  setRefreshTokenCookie(res, refreshToken, refreshTokenTtlMs)
  ApiResponse.ok(res, result, 'Logged in successfully')
})

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(readRefreshCookie(req))
  clearRefreshTokenCookie(res)
  ApiResponse.ok(res, null, 'Logged out successfully')
})

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { result, refreshToken, refreshTokenTtlMs } = await authService.refresh(readRefreshCookie(req), requestMeta(req))
  setRefreshTokenCookie(res, refreshToken, refreshTokenTtlMs)
  ApiResponse.ok(res, result, 'Access token refreshed')
})

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ForgotPasswordInput
  await authService.forgotPassword(body.email)
  ApiResponse.ok(res, null, 'If an account with that email exists, a password reset link has been sent.')
})

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ResetPasswordInput
  await authService.resetPassword(body.token, body.newPassword)
  ApiResponse.ok(res, null, 'Your password has been reset. Please log in with your new password.')
})

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ChangePasswordInput
  await authService.changePassword(req.user!.id, body.currentPassword, body.newPassword)
  clearRefreshTokenCookie(res)
  ApiResponse.ok(res, null, 'Your password has been changed. Please log in again.')
})

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as VerifyEmailInput
  await authService.verifyEmail(body.token)
  ApiResponse.ok(res, null, 'Your email has been verified. You can now log in.')
})

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ResendVerificationInput
  await authService.resendVerification(body.email)
  ApiResponse.ok(res, null, 'If an account with that email exists and is unverified, a new verification link has been sent.')
})

// No async work here — `authenticate` already did it — so this is a plain handler, not wrapped in asyncHandler.
export function getCurrentUser(req: Request, res: Response): void {
  ApiResponse.ok(res, req.user)
}
