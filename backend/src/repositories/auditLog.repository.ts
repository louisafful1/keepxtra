import { AuditLog, type IAuditLog } from '../models/auditLog.model'

export interface CreateAuditLogInput {
  userId: string | null
  userName: string
  action: string
  entityType: string
  entityId: string
  affectedRecord: string
  previousValue?: string | null
  newValue?: string | null
  ip?: string | null
}

/** Append-only — no soft delete, no updates, so this doesn't extend `BaseRepository`. */
export class AuditLogRepository {
  async create(input: CreateAuditLogInput): Promise<IAuditLog> {
    return AuditLog.create({ ...input, previousValue: input.previousValue ?? null, newValue: input.newValue ?? null, ip: input.ip ?? null })
  }
}

export const auditLogRepository = new AuditLogRepository()
