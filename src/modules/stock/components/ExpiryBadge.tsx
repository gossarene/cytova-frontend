import { differenceInDays, parseISO, isPast } from 'date-fns'
import { Clock, AlertTriangle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/date'

interface Props {
  expiryDate: string | null
}

export function ExpiryBadge({ expiryDate }: Props) {
  if (!expiryDate) {
    return <span className="text-xs text-muted-foreground">No expiry</span>
  }

  const date = parseISO(expiryDate)
  const daysLeft = differenceInDays(date, new Date())
  const expired = isPast(date)

  if (expired) {
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs gap-1">
        <XCircle className="h-3 w-3" />
        Expired {formatDate(expiryDate)}
      </Badge>
    )
  }

  if (daysLeft <= 30) {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs gap-1">
        <AlertTriangle className="h-3 w-3" />
        {daysLeft}d left &middot; {formatDate(expiryDate)}
      </Badge>
    )
  }

  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      {formatDate(expiryDate)}
    </span>
  )
}
