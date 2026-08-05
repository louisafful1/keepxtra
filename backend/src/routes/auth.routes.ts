import { Router } from 'express'
import { validateRequest } from '../middlewares/validateRequest'
import { authenticate } from '../middlewares/authenticate'
import {
  changePassword,
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  refresh,
  resendVerification,
  resetPassword,
  verifyEmail,
} from '../controllers/auth.controller'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validators'

export const authRouter = Router()

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     description: >
 *       Only **Active** users with a verified email may log in. On success, issues a short-lived access
 *       token in the response body and sets a long-lived, httpOnly refresh-token cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: farmer@keepxtra.com }
 *               password: { type: string, format: password, example: Password123 }
 *               rememberMe: { type: boolean, example: true, description: "false shortens the refresh session to 7 days" }
 *     responses:
 *       200:
 *         description: Logged in successfully.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       401:
 *         description: Invalid email or password.
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ApiErrorBody' } }
 *       403:
 *         description: Account suspended, pending review, or email not yet verified.
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ApiErrorBody' } }
 *       422:
 *         description: Request body failed validation.
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ApiErrorBody' } }
 */
authRouter.post('/login', validateRequest({ body: loginSchema }), login)

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the current session
 *     description: Revokes the refresh token behind the request's cookie (if any) and clears the cookie. Always succeeds.
 *     responses:
 *       200:
 *         description: Logged out successfully.
 */
authRouter.post('/logout', logout)

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate the refresh token and issue a new access token
 *     description: >
 *       Reads the refresh token from its httpOnly cookie — no request body. Every call rotates the
 *       refresh token; presenting an already-rotated (used) token is treated as a replay attack and
 *       revokes the entire session family, forcing a fresh login.
 *     responses:
 *       200:
 *         description: A new access token (and rotated refresh cookie) was issued.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     expiresAt: { type: integer }
 *       401:
 *         description: Missing, invalid, expired, or reused refresh token.
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ApiErrorBody' } }
 */
authRouter.post('/refresh', refresh)

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     description: >
 *       Always responds 200 with the same generic message, whether or not the email belongs to an
 *       account — this prevents callers from using this endpoint to enumerate registered emails.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: farmer@keepxtra.com }
 *     responses:
 *       200:
 *         description: Generic confirmation — check the (mocked) email log for the actual link.
 *       422:
 *         description: Request body failed validation.
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ApiErrorBody' } }
 */
authRouter.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), forgotPassword)

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset a password using a reset token
 *     description: On success, every existing session for the account is revoked — the user must log in again.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string, description: "The raw token from the reset-password email link" }
 *               newPassword: { type: string, format: password, example: NewPassword123 }
 *     responses:
 *       200:
 *         description: Password reset — all sessions revoked.
 *       400:
 *         description: The reset token is invalid, already used, or expired.
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ApiErrorBody' } }
 *       422:
 *         description: Request body failed validation (e.g. weak password).
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ApiErrorBody' } }
 */
authRouter.post('/reset-password', validateRequest({ body: resetPasswordSchema }), resetPassword)

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change the current user's password
 *     security: [{ bearerAuth: [] }]
 *     description: Requires the current password. On success, every session (including this one) is revoked.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password, example: NewPassword123 }
 *     responses:
 *       200:
 *         description: Password changed — all sessions revoked.
 *       401:
 *         description: Not authenticated, or the current password is incorrect.
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ApiErrorBody' } }
 *       422:
 *         description: Request body failed validation.
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ApiErrorBody' } }
 */
authRouter.post('/change-password', authenticate, validateRequest({ body: changePasswordSchema }), changePassword)

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify an email address using a verification token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string, description: "The raw token from the verification email link" }
 *     responses:
 *       200:
 *         description: Email verified — the account can now log in.
 *       400:
 *         description: The verification token is invalid, already used, or expired.
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ApiErrorBody' } }
 */
authRouter.post('/verify-email', validateRequest({ body: verifyEmailSchema }), verifyEmail)

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend the email verification link
 *     description: Always responds 200 with the same generic message, whether or not the email exists or is already verified.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: farmer@keepxtra.com }
 *     responses:
 *       200:
 *         description: Generic confirmation — check the (mocked) email log for the actual link.
 *       422:
 *         description: Request body failed validation.
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ApiErrorBody' } }
 */
authRouter.post('/resend-verification', validateRequest({ body: resendVerificationSchema }), resendVerification)

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: The current user, with their role and effective permissions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/AuthenticatedUser' }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ApiErrorBody' } }
 */
authRouter.get('/me', authenticate, getCurrentUser)
