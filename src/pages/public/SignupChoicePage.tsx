import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, User, ArrowLeft } from 'lucide-react'
import cytovaLogo from '@/assets/images/branding/cytova-logo.png'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

/**
 * Account-type chooser surfaced at ``/signup``.
 *
 * Two paths diverge from this page:
 *   - **Laboratory / Organization** → ``/signup/lab``: the existing
 *     4-step tenant onboarding flow (creates a real Cytova lab tenant).
 *   - **Personal account** → ``/signup/patient``: the new global
 *     patient identity flow (creates a PatientAccount in the public
 *     schema, no tenant involved).
 *
 * The two flows are deliberately separate. Lab onboarding provisions a
 * tenant + admin user + trial subscription; patient signup creates a
 * single global account with a Cytova Patient ID. Mixing them would
 * blur very different lifecycles, billing models, and audit
 * requirements.
 */
export function SignupChoicePage() {
  const navigate = useNavigate()

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-white"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <div className="mb-10 text-center">
          <Link to={ROUTES.HOME} className="inline-flex items-center justify-center">
            <img src={cytovaLogo} alt="Cytova" className="h-8" />
          </Link>
          <h1 className="mt-8 text-3xl font-semibold tracking-tighter sm:text-4xl">
            Create your account
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Choose how you want to use Cytova.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <ChoiceCard
            icon={Building2}
            eyebrow="For organizations"
            title="Laboratory / Organization"
            description="Manage requests, patients, results, and laboratory operations."
            cta="Create laboratory account"
            onClick={() => navigate(ROUTES.SIGNUP_LAB)}
          />
          <ChoiceCard
            icon={User}
            eyebrow="For patients"
            title="Personal account"
            description="Access your lab results securely from one patient space."
            cta="Create personal account"
            onClick={() => navigate(ROUTES.SIGNUP_PATIENT)}
          />
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-1.5 text-xs hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Cytova home
          </Link>
        </div>
      </div>
    </div>
  )
}

interface ChoiceCardProps {
  icon: React.ComponentType<{ className?: string }>
  eyebrow: string
  title: string
  description: string
  cta: string
  onClick: () => void
}

function ChoiceCard({ icon: Icon, eyebrow, title, description, cta, onClick }: ChoiceCardProps) {
  return (
    <Card className="group relative cursor-pointer border-slate-200/70 shadow-xl shadow-slate-900/[0.04] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/[0.08]">
      <CardContent className="flex h-full flex-col p-7 sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{description}</p>
        <Button
          type="button"
          onClick={onClick}
          className="mt-6 w-full justify-between gap-2"
        >
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </CardContent>
    </Card>
  )
}
