import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { notificationService, type RequestMeta } from '../services/notification.service'
import type { NotificationListQuery, SendNotificationInput, UpdateNotificationPreferencesInput } from '../validators/notification.validators'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema` before any handler here runs.
function paramId(req: Request): string {
  return req.params.id as string
}

export const sendNotification = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as SendNotificationInput
  const notification = await notificationService.send(body, req.user!, requestMeta(req))
  if (!notification) {
    ApiResponse.ok(res, null, 'Recipient has muted this category — notification not created')
    return
  }
  ApiResponse.created(res, notification, 'Notification sent')
})

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as NotificationListQuery
  const { data, meta } = await notificationService.list(req.user!, query)
  ApiResponse.paginated(res, data, meta)
})

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.getUnreadCount(req.user!)
  ApiResponse.ok(res, result)
})

export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationService.markAsRead(paramId(req), req.user!)
  ApiResponse.ok(res, notification, 'Notification marked as read')
})

export const markAllNotificationsAsRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.markAllAsRead(req.user!)
  ApiResponse.ok(res, result, 'All notifications marked as read')
})

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.remove(paramId(req), req.user!)
  ApiResponse.noContent(res)
})

export const getNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
  const preferences = await notificationService.getPreferences(req.user!)
  ApiResponse.ok(res, preferences)
})

export const updateNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateNotificationPreferencesInput
  const preferences = await notificationService.updatePreferences(body, req.user!)
  ApiResponse.ok(res, preferences, 'Notification preferences updated')
})
