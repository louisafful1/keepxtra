import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema } from '../validators/common.validators'
import { notificationListQuerySchema, sendNotificationSchema, updateNotificationPreferencesSchema } from '../validators/notification.validators'
import {
  deleteNotification,
  getNotificationPreferences,
  getUnreadCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  sendNotification,
  updateNotificationPreferences,
} from '../controllers/notification.controller'

export const notificationRouter = Router()

notificationRouter.use(authenticate)

/**
 * @openapi
 * /notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Send a notification to a user
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **notifications.send**. Silently skipped (200, `data: null`) if the recipient has muted the category."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, category, title, message]
 *             properties:
 *               userId: { type: string }
 *               category: { type: string, enum: [Storage Request, Pickup, Inventory, Quality Inspection, Fleet, Sales, Payment, System] }
 *               channel: { type: string, enum: [In-App, Email, SMS, WhatsApp, Push], default: In-App }
 *               title: { type: string, example: "Pickup completed" }
 *               message: { type: string, example: "Your pickup PU-00042 has been completed." }
 *               relatedEntityType: { type: string, example: "Pickup" }
 *               relatedEntityId: { type: string }
 *     responses:
 *       201: { description: The created notification. }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the notifications.send permission." }
 *       422: { description: Request body failed validation. }
 *   get:
 *     tags: [Notifications]
 *     summary: List the current user's notifications
 *     security: [{ bearerAuth: [] }]
 *     description: Self-scoped — always filtered to the authenticated user. Supports search, filtering, sorting, and pagination.
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [Storage Request, Pickup, Inventory, Quality Inspection, Fleet, Sales, Payment, System] }
 *       - in: query
 *         name: isRead
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 25 }
 *     responses:
 *       200: { description: A page of notifications. }
 *       401: { description: Not authenticated. }
 */
notificationRouter.post('/', requirePermission('notifications.send'), validateRequest({ body: sendNotificationSchema }), sendNotification)
notificationRouter.get('/', validateRequest({ query: notificationListQuerySchema }), listNotifications)

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: The current user's unread notification count
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: The unread count. }
 *       401: { description: Not authenticated. }
 */
notificationRouter.get('/unread-count', getUnreadCount)

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all of the current user's notifications as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Number of notifications updated. }
 *       401: { description: Not authenticated. }
 */
notificationRouter.patch('/read-all', markAllNotificationsAsRead)

/**
 * @openapi
 * /notifications/preferences:
 *   get:
 *     tags: [Notifications]
 *     summary: Get the current user's notification preferences
 *     security: [{ bearerAuth: [] }]
 *     description: Lazily created with default values on first access.
 *     responses:
 *       200: { description: The preferences. }
 *       401: { description: Not authenticated. }
 *   patch:
 *     tags: [Notifications]
 *     summary: Update the current user's notification preferences
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inAppEnabled: { type: boolean }
 *               emailEnabled: { type: boolean }
 *               smsEnabled: { type: boolean }
 *               whatsappEnabled: { type: boolean }
 *               pushEnabled: { type: boolean }
 *               mutedCategories:
 *                 type: array
 *                 items: { type: string, enum: [Storage Request, Pickup, Inventory, Quality Inspection, Fleet, Sales, Payment, System] }
 *     responses:
 *       200: { description: The updated preferences. }
 *       401: { description: Not authenticated. }
 *       422: { description: Request body failed validation. }
 */
notificationRouter.get('/preferences', getNotificationPreferences)
notificationRouter.patch('/preferences', validateRequest({ body: updateNotificationPreferencesSchema }), updateNotificationPreferences)

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     security: [{ bearerAuth: [] }]
 *     description: Only the owning user may mark their own notification as read.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The updated notification. }
 *       401: { description: Not authenticated. }
 *       403: { description: Not the owner of this notification. }
 *       404: { description: Notification not found. }
 */
notificationRouter.patch('/:id/read', validateRequest({ params: mongoIdParamSchema }), markNotificationAsRead)

/**
 * @openapi
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     security: [{ bearerAuth: [] }]
 *     description: Only the owning user may delete their own notification.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted. }
 *       401: { description: Not authenticated. }
 *       403: { description: Not the owner of this notification. }
 *       404: { description: Notification not found. }
 */
notificationRouter.delete('/:id', validateRequest({ params: mongoIdParamSchema }), deleteNotification)
