import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusVariant = 'request' | 'result' | 'item' | 'subscription' | 'alert' | 'po'

const STATUS_STYLES: Record<string, string> = {
  // Requests
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',

  // Results
  PENDING_VALIDATION: 'bg-amber-50 text-amber-700 border-amber-200',
  VALIDATED: 'bg-blue-50 text-blue-700 border-blue-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-600 border-red-200',

  // Items
  PENDING: 'bg-slate-100 text-slate-600 border-slate-200',

  // Subscription
  TRIAL: 'bg-amber-50 text-amber-700 border-amber-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPIRED: 'bg-red-50 text-red-600 border-red-200',
  SUSPENDED: 'bg-red-50 text-red-600 border-red-200',

  // Alerts
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
  INFO: 'bg-blue-50 text-blue-700 border-blue-200',
  ACKNOWLEDGED: 'bg-blue-50 text-blue-600 border-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-600 border-emerald-200',

  // PO
  PARTIALLY_RECEIVED: 'bg-amber-50 text-amber-700 border-amber-200',
  RECEIVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const FALLBACK_STYLE = 'bg-slate-100 text-slate-600 border-slate-200'

interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
  className?: string
}

function formatLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium text-xs',
        STATUS_STYLES[status] || FALLBACK_STYLE,
        className,
      )}
    >
      {formatLabel(status)}
    </Badge>
  )
}
