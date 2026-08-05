import { Permission, type IPermission } from '../models/permission.model'

/**
 * Permissions are a small, fixed catalogue seeded from
 * `constants/permissions.ts` — no soft delete, no pagination, so this
 * doesn't extend `BaseRepository` (which assumes soft-deletable documents).
 */
export class PermissionRepository {
  async findByKey(key: string): Promise<IPermission | null> {
    return Permission.findOne({ key }).exec()
  }

  async findByKeys(keys: string[]): Promise<IPermission[]> {
    return Permission.find({ key: { $in: keys } }).exec()
  }

  async findAll(): Promise<IPermission[]> {
    return Permission.find().sort({ module: 1, key: 1 }).exec()
  }
}

export const permissionRepository = new PermissionRepository()
