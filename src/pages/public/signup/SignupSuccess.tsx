import { CheckCircle2, ArrowRight, ExternalLink, Clock, UserCog, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { SignupResponse } from './api'

interface SignupSuccessProps {
  data: SignupResponse
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
    description: 'Your free trial starts now. You have full access to all features.',
  },
]

export function SignupSuccess({ data }: SignupSuccessProps) {
  const labUrl = `https://${data.domain}`

  return (
    <div className="mx-auto max-w-lg space-y-8">
      {/* Success header */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          Your laboratory is ready
        </h1>
        <p className="mt-2 text-muted-foreground">
          <span className="font-medium text-foreground">{data.laboratory_name}</span>{' '}
          has been created successfully.
        </p>
      </div>

      {/* Lab details card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Workspace URL</span>
              <a
                href={labUrl}
                className="flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {data.domain}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admin email</span>
              <span className="font-medium">{data.admin_email}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                <Clock className="h-3 w-3" />
                Free Trial
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next steps */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Next Steps
        </h2>
        <div className="space-y-3">
          {NEXT_STEPS.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-lg bg-slate-50 p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <a href={labUrl}>
        <Button size="lg" className="w-full gap-2 text-base">
          Go to Your Laboratory
          <ArrowRight className="h-4 w-4" />
        </Button>
      </a>
    </div>
  )
}
