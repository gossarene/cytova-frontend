import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import {
  AlertTriangle, Clock, Ban, XCircle, Mail, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/lib/auth/store'
import { api } from '@/lib/api/client'
import type { ApiError } from '@/lib/api/types'

type SubscriptionStatus = 'ok' | 'loading' | 'expired' | 'suspended' | 'cancelled' | 'missing'

const STATUS_CONFIG: Record<
  Exclude<SubscriptionStatus, 'ok' | 'loading'>,
  { icon: typeof AlertTriangle; title: string; description: string; color: string }
> = {
  expired: {
    icon: Clock,
    title: 'Subscription Expired',
    description:
      'Your laboratory trial or subscription has expired. Upgrade your plan to continue using Cytova.',
    color: 'text-amber-500 bg-amber-50',
  },
  suspended: {
    icon: AlertTriangle,
    title: 'Account Suspended',
    description:
      'Your laboratory account has been suspended. Please contact support or resolve any outstanding issues to restore access.',
    color: 'text-red-500 bg-red-50',
  },
  cancelled: {
    icon: XCircle,
    title: 'Subscription Cancelled',
    description:
      'Your laboratory subscription has been cancelled. Contact sales if you would like to reactivate your account.',
    color: 'text-red-500 bg-red-50',
  },
  missing: {
    icon: Ban,
    title: 'No Active Subscription',
    description:
      'Your laboratory does not have an active subscription. Please contact your administrator or Cytova support.',
    color: 'text-slate-500 bg-slate-50',
  },
}

/**
 * Checks that the tenant has a usable subscription.
 *
 * The backend SubscriptionEnforcementMiddleware returns 403 with error codes:
 *   SUBSCRIPTION_EXPIRED | SUBSCRIPTION_SUSPENDED | SUBSCRIPTION_CANCELLED | SUBSCRIPTION_MISSING
 *
 * This guard makes a lightweight probe on mount. If the probe succeeds (any 2xx),
 * the subscription is usable. If it returns 403 with a subscription error code,
 * we show the blocked UI. Other errors are ignored (let the app proceed — the
 * middleware will block individual API calls anyway).
 */
export function SubscriptionGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [status, setStatus] = useState<SubscriptionStatus>('loading')

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus('ok')
      return
    }

    let cancelled = false

    async function checkSubscription() {
      try {
        // Use /users/me/ as the probe — it's lightweight and always available.
        // If the subscription is blocked, the middleware intercepts BEFORE the view.
        await api.get('/users/me/')
        if (!cancelled) setStatus('ok')
      } catch (err: unknown) {
        if (cancelled) return
        const axiosErr = err as {
          response?: { status?: number; data?: { errors?: ApiError[] } }
        }
        if (axiosErr.response?.status === 403) {
          const code = axiosErr.response.data?.errors?.[0]?.code
          if (code === 'SUBSCRIPTION_EXPIRED') setStatus('expired')
          else if (code === 'SUBSCRIPTION_SUSPENDED') setStatus('suspended')
          else if (code === 'SUBSCRIPTION_CANCELLED') setStatus('cancelled')
          else if (code === 'SUBSCRIPTION_MISSING') setStatus('missing')
          else setStatus('ok') // 403 for another reason — let PermissionGuard handle it
        } else {
          // Network error or 5xx — don't block the user, let them in
          setStatus('ok')
        }
      }
    }

    checkSubscription()
    return () => { cancelled = true }
  }, [isAuthenticated])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (status !== 'ok') {
    return <BlockedSubscriptionScreen status={status} />
  }

  return <Outlet />
}

function BlockedSubscriptionScreen({
  status,
}: {
  status: Exclude<SubscriptionStatus, 'ok' | 'loading'>
}) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${config.color}`}>
            <Icon className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-xl font-semibold">{config.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {config.description}
          </p>

          <div className="mt-8 flex w-full flex-col gap-3">
            {status === 'expired' && (
              <a href="mailto:support@cytova.io">
                <Button className="w-full gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Sales to Upgrade
                </Button>
              </a>
            )}
            {(status === 'suspended' || status === 'cancelled' || status === 'missing') && (
              <a href="mailto:support@cytova.io">
                <Button className="w-full gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Support
                </Button>
              </a>
            )}
            <Button variant="outline" className="w-full" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
