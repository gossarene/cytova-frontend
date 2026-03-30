import { format, formatDistanceToNow, parseISO } from 'date-fns'

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value
}

/** Format as "Mar 29, 2026" */
export function formatDate(value: string | Date): string {
  return format(toDate(value), 'MMM d, yyyy')
}

/** Format as "Mar 29, 2026 at 2:30 PM" */
export function formatDateTime(value: string | Date): string {
  return format(toDate(value), "MMM d, yyyy 'at' h:mm a")
}

/** Format as "2 hours ago", "3 days ago" */
export function formatRelative(value: string | Date): string {
  return formatDistanceToNow(toDate(value), { addSuffix: true })
}

/** Format as "2026-03-29" (ISO date only) */
export function formatISODate(value: string | Date): string {
  return format(toDate(value), 'yyyy-MM-dd')
}
