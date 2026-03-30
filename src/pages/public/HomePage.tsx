import { Link } from 'react-router-dom'
import {
  Microscope, Users, ClipboardList, FileCheck, Package, ShieldCheck,
  BarChart3, Zap, Globe, Lock, Server, ArrowRight, CheckCircle2,
  FlaskConical, Truck, Bell, UserCog, Building2, Receipt,
  ChevronRight, Mail, Phone, MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/config/routes'

/* ================================================================
   HERO
   ================================================================ */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,_theme(colors.primary/0.03)_1px,_transparent_1px),linear-gradient(to_bottom,_theme(colors.primary/0.03)_1px,_transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 sm:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <FlaskConical className="h-3.5 w-3.5 text-primary" />
            Laboratory Information Management System
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Precision lab management,{' '}
            <span className="text-primary">delivered with clarity</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Cytova is the cloud-based LIMS built for medical laboratories. From patient
            registration to result publication, manage your entire workflow with
            confidence, traceability, and compliance.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to={ROUTES.SIGNUP}>
              <Button size="lg" className="gap-2 text-base px-6">
                Request a Demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#product">
              <Button variant="outline" size="lg" className="gap-2 text-base px-6">
                Discover the Platform
                <ChevronRight className="h-4 w-4" />
              </Button>
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary/70" /> ISO 15189 Ready</span>
            <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary/70" /> GDPR Compliant</span>
            <span className="flex items-center gap-1.5"><Server className="h-4 w-4 text-primary/70" /> 99.9% Uptime SLA</span>
            <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-primary/70" /> Multi-Tenant Cloud</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   PRODUCT OVERVIEW
   ================================================================ */

const PRODUCT_PILLARS = [
  {
    icon: Zap,
    title: 'Streamlined Workflows',
    description: 'From sample reception to result publication, every step is guided by clear status transitions and role-based actions.',
  },
  {
    icon: ShieldCheck,
    title: 'Built-In Compliance',
    description: 'Immutable audit trails, traceability records, and role-based access control ensure regulatory readiness from day one.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Visibility',
    description: 'Dashboards, alerts, and analytics give lab managers instant insight into operations, inventory, and performance.',
  },
]

function ProductSection() {
  return (
    <section id="product" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">The Platform</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your laboratory needs, in one place
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Cytova replaces fragmented tools with a single, integrated platform designed
            exclusively for medical laboratories.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {PRODUCT_PILLARS.map((pillar) => (
            <Card key={pillar.title} className="border-0 bg-slate-50 shadow-none">
              <CardContent className="p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <pillar.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   CORE MODULES / FEATURES
   ================================================================ */

const FEATURES = [
  {
    icon: Users,
    title: 'Patient Management',
    description: 'Register patients, manage demographics, and provide portal access for result consultation.',
  },
  {
    icon: ClipboardList,
    title: 'Analysis Requests',
    description: 'Create, track, and manage requests with full pricing resolution, partner billing, and status workflows.',
  },
  {
    icon: FileCheck,
    title: 'Results & Validation',
    description: 'Enter results, validate with biologist sign-off, and publish with irreversible audit trails.',
  },
  {
    icon: Microscope,
    title: 'Exam Catalog',
    description: 'Define exam categories, sample types, pricing rules, and per-lab customizations.',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track reagent stock, lots, expiration dates, and movements with real-time alerts.',
  },
  {
    icon: Truck,
    title: 'Procurement',
    description: 'Manage suppliers, create purchase orders, and record receptions with automatic stock updates.',
  },
  {
    icon: Building2,
    title: 'Partner Network',
    description: 'Manage referring clinics and hospitals with dedicated billing modes and referral tracking.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Automated low-stock, expiration, and out-of-stock alerts with acknowledgment workflows.',
  },
  {
    icon: UserCog,
    title: 'Role-Based Access',
    description: 'Seven granular roles with 40+ permissions. Delegate safely with per-user overrides.',
  },
  {
    icon: Receipt,
    title: 'Billing & Pricing',
    description: 'Flexible pricing rules by exam, partner, and source type. Full price traceability on every item.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time KPIs across patients, requests, results, inventory, and partner performance.',
  },
  {
    icon: Lock,
    title: 'Audit Trail',
    description: 'Immutable, append-only logs for every action. Full traceability for compliance audits.',
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Core Modules</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Designed for every role in your lab
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Each module is purpose-built for laboratory operations, from front desk to quality control.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
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
    title: 'Onboard Your Laboratory',
    description: 'Sign up, configure your exam catalog, invite your staff, and customize settings. Your isolated environment is provisioned in seconds.',
  },
  {
    number: '02',
    title: 'Register & Receive',
    description: 'Front desk registers patients, creates analysis requests, and receives samples. Prices are resolved automatically from your pricing rules.',
  },
  {
    number: '03',
    title: 'Process & Validate',
    description: 'Technicians enter results, biologists validate, and the system enforces every step of the quality workflow before publication.',
  },
  {
    number: '04',
    title: 'Publish & Grow',
    description: 'Results are published to patients via a secure portal. Dashboard analytics help you optimize operations and grow your laboratory.',
  },
]

function HowItWorksSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">How It Works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Up and running in four steps
          </h2>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Connector line (desktop) */}
              {i < STEPS.length - 1 && (
                <div className="absolute right-0 top-8 hidden h-px w-8 bg-border lg:block" style={{ transform: 'translateX(100%)' }} />
              )}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                {step.number}
              </div>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
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
   SECURITY & TRUST
   ================================================================ */

const SECURITY_POINTS = [
  {
    icon: Lock,
    title: 'Tenant Isolation',
    description: 'Each laboratory operates in its own PostgreSQL schema. Data never crosses tenant boundaries.',
  },
  {
    icon: ShieldCheck,
    title: 'Immutable Audit Trail',
    description: 'Every action is logged with actor, timestamp, IP, and diff. Records cannot be modified or deleted.',
  },
  {
    icon: UserCog,
    title: 'Granular Permissions',
    description: '40+ fine-grained permission codes with role-based defaults and per-user overrides.',
  },
  {
    icon: Server,
    title: 'Encrypted at Rest & Transit',
    description: 'TLS 1.3 in transit, AES-256 at rest. JWT tokens with short lifetimes and rotation.',
  },
]

function SecuritySection() {
  return (
    <section id="security" className="bg-slate-950 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-400">Security & Compliance</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Trust built into every layer
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Healthcare data demands the highest standards. Cytova is designed for
            compliance from the ground up.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {SECURITY_POINTS.map((point) => (
            <div key={point.title} className="flex gap-5 rounded-xl bg-white/5 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-400/10">
                <point.icon className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{point.title}</h3>
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
   VISION / WHY CYTOVA
   ================================================================ */

const DIFFERENTIATORS = [
  'Purpose-built for medical laboratories — not generic project management',
  'Multi-tenant architecture with true data isolation per laboratory',
  'Complete exam lifecycle: request, trace, result, validate, publish',
  'Role-aware interface that adapts to each staff member\'s responsibilities',
  'Real-time inventory management with automated alerts',
  'Partner billing and contextual pricing built in, not bolted on',
  'Immutable audit trails meeting ISO 15189 traceability requirements',
  'Open API with OpenAPI schema for custom integrations',
]

function VisionSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Why Cytova</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Built by lab professionals, for lab professionals
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Most laboratory software was designed decades ago and adapted for the cloud.
              Cytova was born in the cloud, with modern standards for security, usability,
              and scalability from the very first line of code.
            </p>
            <Separator className="my-8" />
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Our Mission</p>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              To give every medical laboratory access to world-class digital tools —
              regardless of size or location — so they can focus on what matters: delivering
              accurate, timely results that improve patient outcomes.
            </p>
          </div>

          <div className="space-y-3">
            {DIFFERENTIATORS.map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg bg-slate-50 px-5 py-3.5"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
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
    <section className="bg-gradient-to-br from-primary to-teal-700 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to modernize your laboratory?
        </h2>
        <p className="mt-4 text-lg text-teal-100">
          Join laboratories that trust Cytova for their daily operations.
          Get started with a free trial — no credit card required.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to={ROUTES.SIGNUP}>
            <Button
              size="lg"
              className="gap-2 bg-white text-primary hover:bg-white/90 text-base px-8"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={ROUTES.CONTACT}>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-white/30 text-white hover:bg-white/10 text-base px-8"
            >
              Contact Sales
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
    <section id="contact" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Get in Touch</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            We'd love to hear from you
          </h2>
          <p className="mt-4 text-muted-foreground">
            Have questions about Cytova? Our team is here to help.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-xl gap-6 sm:grid-cols-3">
          {[
            { icon: Mail, label: 'Email', value: 'contact@cytova.io' },
            { icon: Phone, label: 'Phone', value: '+33 1 00 00 00 00' },
            { icon: MapPin, label: 'Office', value: 'Paris, France' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center rounded-xl bg-white p-6 text-center shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.value}</p>
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
      <FeaturesSection />
      <HowItWorksSection />
      <SecuritySection />
      <VisionSection />
      <CTASection />
      <ContactSection />
    </>
  )
}
