import { BaseRepository } from './base.repository'
import { NotificationPreference, type INotificationPreference } from '../models/notificationPreference.model'

export class NotificationPreferenceRepository extends BaseRepository<INotificationPreference> {
  constructor() {
    super(NotificationPreference)
  }

  async findByUserId(userId: string): Promise<INotificationPreference | null> {
    return this.findOne({ userId })
  }
}

export const notificationPreferenceRepository = new NotificationPreferenceRepository()
