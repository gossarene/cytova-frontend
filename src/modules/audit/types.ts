export interface AuditLogEntry {
  id: string
  actor_type: string
  actor_id: string | null
  actor_email: string | null
  action: string
  entity_type: string
  entity_id: string | null
  diff: Record<string, unknown> | null
  ip_address: string | null
  timestamp: string
}
