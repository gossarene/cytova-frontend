import { CheckCircle2, ArrowRight, ExternalLink, Clock, UserCog, FlaskConical, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { SignupResponse } from './api'

interface SignupSuccessProps {
  data: SignupResponse
  /** Optional override — when present, used instead of a plain anchor.
      Lets the caller drive the cross-host redirect (e.g. to keep the
      protocol consistent with the current page in dev). */
  onGoToLab?: () => void
}

const NEXT_STEPS = [
  {
    icon: UserCog,
    title: 'Sign in to your workspace',
    description: 'Use the admin email and password you just created to log in.',
  },
  {
    icon: FlaskConical,
    title: 'Configure your catalog',
    description: 'Set up exam categories, definitions, and pricing rules for your laboratory.',
  },
  {
    icon: Clock,
    title: 'Explore during your trial',
    description: 'You have full access to every feature for the entire trial period.',
  },
]

function formatTrialEnd(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function daysUntil(iso: string): number | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const ms = d.getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

export function SignupSuccess({ data, onGoToLab }: SignupSuccessProps) {
  const labUrl = `https://${data.domain}`
  const trialEnd = data.trial_end_date
  const trialDaysLeft = trialEnd ? daysUntil(trialEnd) : null

  return (
    <div className="mx-auto max-w-lg space-y-8">
      {/* Success header — subtle scale-in for delight without being noisy */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60 animate-fade-in-scale">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tighter animate-fade-in animation-delay-100">
          Your laboratory is ready
        </h1>
        <p className="mt-2 text-muted-foreground animate-fade-in animation-delay-200">
          <span className="font-medium text-foreground">{data.laboratory_name}</span>{' '}
          has been created successfully.
        </p>
      </div>

      {/* Lab details + trial summary */}
      <Card className="border-slate-200/70 shadow-xl shadow-slate-900/[0.04] animate-fade-in animation-delay-200">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Workspace URL</span>
              <a
                href={labUrl}
                className="flex min-w-0 items-center gap-1.5 truncate font-medium text-primary hover:underline"
              >
                <span className="truncate">{data.domain}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Admin email</span>
              <span className="truncate font-medium">{data.admin_email}</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Plan</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200/60">
                <Clock className="h-3 w-3" />
                Free Trial
              </span>
            </div>

            {trialEnd && (
              <>
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Trial ends
                  </span>
                  <span className="text-right">
                    <span className="font-medium">{formatTrialEnd(trialEnd)}</span>
                    {trialDaysLeft !== null && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} left)
                      </span>
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Next steps */}
      <div className="space-y-4 animate-fade-in animation-delay-300">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Next Steps
        </h2>
        <div className="space-y-3">
          {NEXT_STEPS.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/[0.03]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">{step.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      {onGoToLab ? (
        <div className="animate-fade-in animation-delay-400">
          <Button
            size="lg"
            type="button"
            onClick={onGoToLab}
            className="w-full gap-2 text-base shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
          >
            Go to your laboratory
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <a href={labUrl} className="block animate-fade-in animation-delay-400">
          <Button size="lg" className="w-full gap-2 text-base shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">
            Go to your laboratory
            <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
      )}
    </div>
  )
}
