import { BaseRepository } from './base.repository'
import { Role, type IRole } from '../models/role.model'

export class RoleRepository extends BaseRepository<IRole> {
  constructor() {
    super(Role)
  }

  async findByName(name: string): Promise<IRole | null> {
    return this.findOne({ name })
  }
}

export const roleRepository = new RoleRepository()
