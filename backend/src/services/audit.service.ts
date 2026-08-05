import { auditLogRepository } from '../repositories/auditLog.repository'
import type { AuthenticatedUser } from '../interfaces/auth.interface'

export interface RecordAuditEntryInput {
  actor: AuthenticatedUser
  action: string
  entityType: string
  entityId: string
  affectedRecord: string
  previousValue?: string | null
  newValue?: string | null
  ip?: string | null
}

/**
 * The single choke point every mutating service call routes through to
 * write an audit trail entry — mirrors the SAD's `AuditService.record(...)`
 * design. Never called directly from a controller; each business service
 * calls this alongside its own repository writes.
 */
async function record(input: RecordAuditEntryInput): Promise<void> {
  await auditLogRepository.create({
    userId: input.actor.id,
    userName: input.actor.name,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    affectedRecord: input.affectedRecord,
    previousValue: input.previousValue,
    newValue: input.newValue,
    ip: input.ip,
  })
}

export const auditService = { record }
