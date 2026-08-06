import { BaseRepository } from './base.repository'
import { Notification, type INotification } from '../models/notification.model'

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification)
  }

  async countUnread(userId: string): Promise<number> {
    return this.count({ userId, isRead: false })
  }

  async markAllAsRead(userId: string, readAt: Date): Promise<number> {
    const result = await Notification.updateMany({ userId, isDeleted: false, isRead: false }, { $set: { isRead: true, readAt } }).exec()
    return result.modifiedCount
  }
}

export const notificationRepository = new NotificationRepository()
