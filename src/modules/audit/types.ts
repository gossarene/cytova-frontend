export interface AuditLogEntry {
  id: string
  actor_type: string
  actor_id: string | null
  actor_email: string | null
  /** Backend-resolved fallback chain: live StaffUser display name → stored
   *  email → "System" for system events → "Unknown". Always populated. */
  actor_display_name: string
  action: string
  entity_type: string
  entity_id: string | null
  /** Sensitive values (passwords, tokens, codes, secrets) are replaced
   *  with "***" by the backend before serialization. */
  diff: Record<string, unknown> | null
  ip_address: string | null
  timestamp: string
}

/** Backend pagination envelope (PageNumberPagination). The page hook
 *  exposes this directly so the UI can drive page controls + count. */
export interface AuditLogPage {
  count: number
  next: string | null
  previous: string | null
  results: AuditLogEntry[]
}
