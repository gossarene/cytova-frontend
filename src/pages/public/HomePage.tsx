import { Link } from 'react-router-dom'
import {
  Users, FileCheck, Package, ShieldCheck,
  BarChart3, Lock, Server, ArrowRight,
  Bell, UserCog, Receipt,
  ChevronRight, Mail, Phone, MapPin,
  Workflow, Smartphone, Sparkles, MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

/* ================================================================
   HERO
   ================================================================ */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/60 via-white to-white">
      {/* Layered ambient lighting for depth — two soft glows from opposite corners */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(37,99,235,0.10),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-[32rem] w-[32rem] rounded-full bg-blue-400/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-28 sm:pt-36">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <h1 className="text-balance text-5xl font-semibold tracking-tighter text-foreground sm:text-6xl lg:text-7xl">
            Run your laboratory{' '}
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              with confidence
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">
            From patient registration to secure result delivery, Cytova helps laboratories
            streamline operations, reduce errors, and deliver better care.
          </p>

          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to={ROUTES.SIGNUP}>
              <Button size="lg" className="gap-2 px-7 text-base shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">
                Request a Demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#product">
              <Button variant="outline" size="lg" className="gap-2 px-7 text-base">
                Discover the Platform
                <ChevronRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   PRODUCT — "Everything your lab needs"
   ================================================================ */

const PRODUCT_PILLARS = [
  {
    icon: Workflow,
    title: 'Streamlined Workflows',
    description: 'From sample reception to result delivery, every step flows naturally — guided, traceable, effortless.',
  },
  {
    icon: ShieldCheck,
    title: 'Built-In Trust',
    description: 'Immutable audit trails, role-based access, and traceability that meet regulatory standards by default.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Clarity',
    description: 'Live dashboards and smart alerts give your team instant insight into operations and performance.',
  },
]

function ProductSection() {
  return (
    <section id="product" className="bg-white py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">The Platform</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
            Everything your lab needs
          </h2>
          <p className="mt-5 text-balance text-lg leading-relaxed text-muted-foreground">
            One integrated platform that brings every part of your laboratory together —
            from front desk to final report.
          </p>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {PRODUCT_PILLARS.map((pillar, i) => (
            <div
              key={pillar.title}
              className={`group relative rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm shadow-slate-900/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 animate-fade-in animation-delay-${(i + 1) * 100}`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/10 transition-all duration-300 group-hover:from-primary/20 group-hover:ring-primary/20">
                <pillar.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">{pillar.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   MODULES — grouped (Lab / Business / Intelligence), max 6 cards
   ================================================================ */

const MODULE_GROUPS = [
  {
    label: 'Lab Operations',
    items: [
      {
        icon: Users,
        title: 'Patient Management',
        description: 'Register patients, manage records, and give them secure access to their own results.',
      },
      {
        icon: FileCheck,
        title: 'Results & Validation',
        description: 'Enter results, validate with biologist sign-off, and publish with full traceability.',
      },
    ],
  },
  {
    label: 'Business & Logistics',
    items: [
      {
        icon: Package,
        title: 'Inventory & Procurement',
        description: 'Track stock, lots, and expiration dates. Manage suppliers and orders in one place.',
      },
      {
        icon: Receipt,
        title: 'Partners & Billing',
        description: 'Manage referring partners with flexible pricing and clear, contextual invoicing.',
      },
    ],
  },
  {
    label: 'Intelligence & Compliance',
    items: [
      {
        icon: BarChart3,
        title: 'Analytics Dashboard',
        description: 'See live KPIs across patients, requests, results, and inventory at a glance.',
      },
      {
        icon: Bell,
        title: 'Alerts & Audit',
        description: 'Smart notifications for what matters, with an immutable audit trail behind every action.',
      },
    ],
  },
]

function ModulesSection() {
  return (
    <section id="features" className="bg-slate-50 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Modules</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
            Built for every part of your lab
          </h2>
          <p className="mt-5 text-balance text-lg leading-relaxed text-muted-foreground">
            Six focused modules, three clear domains. Everything connects — nothing gets in the way.
          </p>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-3">
          {MODULE_GROUPS.map((group, gi) => (
            <div key={group.label} className={`animate-fade-in animation-delay-${(gi + 1) * 100}`}>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {group.label}
                </p>
                <span className="h-px flex-1 bg-gradient-to-l from-primary/40 to-transparent" />
              </div>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div
                    key={item.title}
                    className="group rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/10 transition-all duration-300 group-hover:from-primary/20 group-hover:ring-primary/20">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold tracking-tight">{item.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   HOW IT WORKS
   ================================================================ */

const STEPS = [
  {
    number: '01',
    title: 'Onboard your laboratory',
    description: 'Sign up, configure your catalog, and invite your team. Your environment is ready in minutes.',
  },
  {
    number: '02',
    title: 'Register & receive',
    description: 'Front desk registers patients and creates requests. Pricing resolves automatically.',
  },
  {
    number: '03',
    title: 'Process & validate',
    description: 'Technicians enter results, biologists validate. Quality checks at every step.',
  },
  {
    number: '04',
    title: 'Publish & grow',
    description: 'Deliver results securely to patients. Analytics help you optimize and scale.',
  },
]

function HowItWorksSection() {
  return (
    <section className="bg-white py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">How It Works</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
            Up and running in four steps
          </h2>
        </div>

        <div className="mt-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              {i < STEPS.length - 1 && (
                <div className="absolute right-0 top-8 hidden h-px w-10 bg-gradient-to-r from-primary/30 to-transparent lg:block" style={{ transform: 'translateX(100%)' }} />
              )}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-2xl font-semibold tracking-tighter text-primary">
                {step.number}
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   VISION — forward-looking pillars
   ================================================================ */

const VISION_PILLARS = [
  {
    icon: Workflow,
    title: 'Lab Automation',
    description: 'A laboratory that runs itself, so your team can focus on science — not on shuffling paperwork.',
  },
  {
    icon: Smartphone,
    title: 'Results, Anywhere',
    description: 'Patients access their results securely from any device, the moment they are ready.',
  },
  {
    icon: Sparkles,
    title: 'AI for Biologists',
    description: 'Intelligent assistance that highlights anomalies, suggests interpretations, and saves time.',
  },
  {
    icon: MessageCircle,
    title: 'AI Assistant for Patients',
    description: 'A friendly companion that answers questions and guides patients through their journey.',
  },
]

function VisionSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(37,99,235,0.06),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Our Vision</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
            The future of laboratory work
          </h2>
          <p className="mt-5 text-balance text-lg leading-relaxed text-muted-foreground">
            We're building a laboratory experience where technology stays in the background —
            and people stay at the center.
          </p>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VISION_PILLARS.map((pillar, i) => (
            <div
              key={pillar.title}
              className={`group relative rounded-2xl border border-slate-200/70 bg-white/70 p-7 shadow-sm shadow-slate-900/[0.03] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-white hover:shadow-2xl hover:shadow-primary/10 animate-fade-in animation-delay-${(i + 1) * 100}`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/10 transition-all duration-300 group-hover:from-primary/20 group-hover:ring-primary/20">
                <pillar.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-6 font-semibold tracking-tight">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   SECURITY & TRUST
   ================================================================ */

const SECURITY_POINTS = [
  {
    icon: Lock,
    title: 'Confidentiality first',
    description: 'Patient data is handled with the highest level of care and privacy at every step.',
  },
  {
    icon: ShieldCheck,
    title: 'Activity History',
    description: 'See exactly who did what and when. A clear, permanent record you can always trust.',
  },
  {
    icon: UserCog,
    title: 'Access Control',
    description: 'Give each team member just the right level of access. Simple to set up, easy to adjust.',
  },
  {
    icon: Server,
    title: 'Encrypted by Default',
    description: 'Your data is protected at every step, whether it is moving or at rest. No setup required.',
  },
]

function SecuritySection() {
  return (
    <section id="security" className="bg-slate-950 py-28 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">Security & Trust</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
            Trust built into every layer
          </h2>
          <p className="mt-5 text-balance text-lg leading-relaxed text-slate-400">
            Your patients trust you. We make it easy to keep that trust — with protection that just works.
          </p>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-2">
          {SECURITY_POINTS.map((point) => (
            <div key={point.title} className="group flex gap-5 rounded-2xl border border-white/5 bg-white/[0.04] p-6 transition-all duration-300 hover:border-blue-400/20 hover:bg-white/[0.06]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-400/10">
                <point.icon className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold tracking-tight text-white">{point.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   CTA
   ================================================================ */

function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-700 to-blue-900 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,255,255,0.15),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-balance text-4xl font-semibold tracking-tighter text-white sm:text-5xl">
          Take your laboratory further
        </h2>
        <p className="mt-5 text-balance text-lg text-blue-100">
          Discover how Cytova helps laboratories work faster, deliver better care,
          and grow with confidence.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to={ROUTES.SIGNUP}>
            <Button
              size="lg"
              className="gap-2 bg-white px-8 text-base font-semibold text-blue-700 shadow-xl shadow-blue-950/40 ring-1 ring-white/40 hover:bg-white hover:text-blue-800 hover:-translate-y-0.5 transition-all"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={ROUTES.CONTACT}>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-white/40 bg-white/5 px-8 text-base text-white hover:bg-white/15 hover:border-white/60"
            >
              Talk to Sales
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   CONTACT
   ================================================================ */

function ContactSection() {
  return (
    <section id="contact" className="bg-slate-50 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Get in Touch</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
            Talk to our team
          </h2>
          <p className="mt-5 text-balance text-lg text-muted-foreground">
            See how Cytova can fit your laboratory. We'll walk you through it personally.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to={ROUTES.SIGNUP}>
              <Button size="lg" className="gap-2 px-7 text-base shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">
                Request a Demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={ROUTES.CONTACT}>
              <Button variant="outline" size="lg" className="gap-2 px-7 text-base">
                Schedule a Call
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-3xl gap-5 sm:grid-cols-3">
          {[
            { icon: Mail, label: 'Email', value: 'contact@cytova.io' },
            { icon: Phone, label: 'Phone', value: '+33 1 00 00 00 00' },
            { icon: MapPin, label: 'Office', value: 'Paris, France' },
          ].map((item) => (
            <div key={item.label} className="group flex flex-col items-center rounded-2xl border border-slate-200/70 bg-white p-7 text-center shadow-sm shadow-slate-900/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/10 transition-all duration-300 group-hover:ring-primary/20">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-5 text-sm font-semibold tracking-tight">{item.label}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   PAGE EXPORT
   ================================================================ */

export function HomePage() {
  return (
    <>
      <HeroSection />
      <ProductSection />
      <ModulesSection />
      <HowItWorksSection />
      <VisionSection />
      <SecuritySection />
      <CTASection />
      <ContactSection />
    </>
  )
}
