export interface AuditLogEntry {
  id: string
  user: string
  action: string
  affectedRecord: string
  previousValue?: string
  newValue?: string
  timestamp: string
}
