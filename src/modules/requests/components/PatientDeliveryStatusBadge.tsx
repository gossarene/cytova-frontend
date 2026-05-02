import {
  Clock, Mail, Send, Share2, ShieldOff,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAccessTokenState, useCytovaShareStatus } from '../api'

interface Props {
  requestId: string
  /** Mirrors ``request.has_report``. The badge hides itself when
   *  false — there's no delivery state to show before the report
   *  exists. Same gate the bottom card used to apply. */
  hasReport: boolean
  /** Drives the "Email sent" branch. Lives on the request detail
   *  payload, so the page passes it as a prop instead of forcing a
   *  third React Query subscription here. */
  notificationCount: number
}

/**
 * Read-only status badge surfacing where the patient stands in the
 * delivery lifecycle. Sits in the page header next to the existing
 * Issued/Delivered/Archived badges so the operator gets the
 * delivery state at a glance without scrolling to a bottom panel
 * or opening the drawer.
 *
 * Channel-focused, NOT lifecycle-focused
 * --------------------------------------
 * The existing ``Issued`` badge already conveys
 * ``status === RESULT_ISSUED``. This badge intentionally does NOT
 * duplicate that signal — it surfaces the channel state instead so
 * the two badges complement each other when both apply
 * (e.g. ``Issued`` + ``Shared with Cytova``).
 *
 * Reads only — no mutations live here. The action surface is the
 * "Manage delivery" header button + ``<PatientDeliveryDrawer>``;
 * this component is purely informational and hooks into the same
 * cached React Query data the drawer uses, so opening the drawer
 * never re-fetches what the badge already loaded.
 */
export function PatientDeliveryStatusBadge({
  requestId, hasReport, notificationCount,
}: Props) {
  const { data: tokenState } = useAccessTokenState(requestId)
  const cytovaShareQuery = useCytovaShareStatus(requestId, hasReport)
  const cytovaShareStatus = cytovaShareQuery.data?.status ?? null

  if (!hasReport) return null

  const status = _resolveDeliveryStatus({
    tokenStateStatus: tokenState?.status,
    cytovaShareStatus,
    notificationCount,
  })
  const Icon = status.icon

  return (
    <Badge variant="outline" className={status.className}>
      <Icon className="h-3 w-3" />
      {status.label}
      {status.label === 'Email sent' && notificationCount > 1 && (
        <span className="text-muted-foreground/80">
          (×{notificationCount})
        </span>
      )}
    </Badge>
  )
}


/**
 * Resolution rules — checked in priority order, first match wins:
 *
 *   1. Cytova share REVOKED   → loud rose state. The patient lost
 *      access; surface this so an operator never assumes the share
 *      is still active.
 *   2. Cytova share ACTIVE    → emerald "Shared with Cytova".
 *   3. ``notificationCount > 0`` → blue "Email sent".
 *   4. Secure link active     → indigo "Secure link active".
 *   5. otherwise              → muted slate "Not delivered".
 *
 * The existing ``Issued`` badge in the header is independent and
 * conveys lifecycle state — both badges can render side-by-side
 * with no information overlap.
 */
interface ResolveInput {
  tokenStateStatus: string | undefined
  cytovaShareStatus: string | null
  notificationCount: number
}

interface ResolvedDelivery {
  label: string
  icon: React.ComponentType<{ className?: string }>
  className: string
}

function _resolveDeliveryStatus(input: ResolveInput): ResolvedDelivery {
  const { tokenStateStatus, cytovaShareStatus, notificationCount } = input
  if (cytovaShareStatus === 'REVOKED') {
    return {
      label: 'Sharing revoked',
      icon: ShieldOff,
      className: 'gap-1 border-rose-200 bg-rose-50 text-rose-700',
    }
  }
  if (cytovaShareStatus === 'ACTIVE') {
    return {
      label: 'Shared with Cytova',
      icon: Share2,
      className: 'gap-1 border-emerald-200 bg-emerald-50 text-emerald-700',
    }
  }
  if (notificationCount > 0) {
    return {
      label: 'Email sent',
      icon: Mail,
      className: 'gap-1 border-blue-200 bg-blue-50 text-blue-700',
    }
  }
  if (tokenStateStatus === 'active') {
    return {
      label: 'Secure link active',
      icon: Send,
      className: 'gap-1 border-indigo-200 bg-indigo-50 text-indigo-700',
    }
  }
  return {
    label: 'Not delivered',
    icon: Clock,
    className: 'gap-1 border-slate-200 bg-slate-50 text-slate-600',
  }
}
