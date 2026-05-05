import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Check, User, ArrowLeft } from 'lucide-react'
import cytovaLogo from '@/assets/images/branding/cytova-logo.png'
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
 * Two responsive layouts share the same data:
 *   - On mobile (<md): each option is a single horizontal row
 *     (icon · title+description · arrow). Whole row is the click
 *     target — no separate CTA — so the thumb has the entire card to
 *     hit.
 *   - On md+: vertical cards with eyebrow, bullets, and a small CTA
 *     button. The whole card stays clickable (the wrapping Link),
 *     and the inner button is decorative-with-arrow so the call to
 *     action remains explicit on a wider viewport.
 */

interface ChoiceItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  cta: string
}

const CHOICES: ChoiceItem[] = [
  {
    to: ROUTES.SIGNUP_LAB,
    icon: Building2,
    eyebrow: 'For organizations',
    title: 'Laboratory account',
    description: 'Run a lab, manage patients, requests, and results.',
    bullets: [
      'Multi-user team workspace',
      'Patients, requests & traceable results',
      'Built-in invoicing and reports',
    ],
    cta: 'Get started',
  },
  {
    to: ROUTES.SIGNUP_PATIENT,
    icon: User,
    eyebrow: 'For patients',
    title: 'Personal account',
    description: 'View your lab results from one secure space.',
    bullets: [
      'One Cytova ID across labs',
      'Results delivered straight to you',
      'Free, takes under a minute',
    ],
    cta: 'Create account',
  },
]

export function SignupChoicePage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/60 via-white to-white"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 hidden h-[24rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl sm:block"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="mb-10 text-center sm:mb-14">
          <Link to={ROUTES.HOME} className="inline-flex items-center justify-center">
            <img src={cytovaLogo} alt="Cytova" className="h-8" />
          </Link>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:mt-8 sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Choose how you want to use Cytova.
          </p>
        </div>

        {/* Mobile: compact list rows. Each row is a single tap target;
            no inner CTA, no bullets — the row's title + description
            already say everything we need at this width, and the
            chevron telegraphs the action. */}
        <ul className="flex flex-col gap-2 sm:hidden">
          {CHOICES.map((c) => (
            <li key={c.to}>
              <Link
                to={c.to}
                className="group flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white p-4 transition-all active:scale-[0.99] hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-tight">{c.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop: vertical cards with bullets + small explicit CTA. */}
        <div className="hidden gap-6 sm:grid sm:grid-cols-2">
          {CHOICES.map((c) => (
            <ChoiceCard key={c.to} {...c} />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 text-sm text-muted-foreground sm:mt-14">
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

function ChoiceCard({ to, icon: Icon, eyebrow, title, description, bullets, cta }: ChoiceItem) {
  return (
    <Link
      to={to}
      // The whole card is the click target — the button is visual and
      // keeps the tab-stop on the same node thanks to the Link wrapper.
      // ``focus-visible`` outline on the wrapper keeps keyboard users
      // covered even though the inner button has no onClick.
      className="group relative flex flex-col rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/[0.02] transition-all hover:scale-[1.01] hover:border-primary/30 hover:shadow-md hover:shadow-slate-900/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>

      <ul className="mt-4 space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {/* Decorative CTA — the wrapper Link is the actual click
          target. We render a styled span (not a <button>) to keep
          the markup valid: a real <button> nested in an <a> is
          invalid HTML and trips a11y tooling. The span picks up
          the same visual treatment as our small primary button. */}
      <span
        aria-hidden="true"
        className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-transform group-hover:translate-x-0.5"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}
