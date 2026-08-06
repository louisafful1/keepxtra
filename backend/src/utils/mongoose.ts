import { Types } from 'mongoose'

/** `AuthenticatedUser.id` (and similar request-scoped ids) are plain strings; Mongoose ref fields expect a real ObjectId. */
export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id)
}
