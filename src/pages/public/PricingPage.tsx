import { Link } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    name: 'Starter',
    description: 'For small laboratories getting started with digital management.',
    price: 'Free',
    priceSuffix: 'for 14 days',
    highlighted: false,
    features: [
      'Up to 5 staff users',
      'Patient management',
      'Analysis requests & results',
      'Basic exam catalog',
      'Audit trail',
      'Email support',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional',
    description: 'For growing labs that need full operational control.',
    price: 'Custom',
    priceSuffix: 'per month',
    highlighted: true,
    features: [
      'Unlimited staff users',
      'All Starter features',
      'Inventory & procurement',
      'Partner billing & pricing rules',
      'Smart alerts',
      'Analytics dashboard',
      'Role-based access (7 roles)',
      'Priority support',
    ],
    cta: 'Request a Demo',
  },
  {
    name: 'Enterprise',
    description: 'For laboratory networks requiring advanced compliance.',
    price: 'Custom',
    priceSuffix: 'annual contract',
    highlighted: false,
    features: [
      'All Professional features',
      'Multi-site management',
      'Custom integrations (API)',
      'Dedicated account manager',
      'SLA guarantee (99.9%)',
      'On-premise deployment option',
      'GDPR & ISO 15189 audit support',
      'Custom training & onboarding',
    ],
    cta: 'Contact Sales',
  },
]

export function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Plans that grow with your laboratory
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Start with a free trial. Upgrade when you're ready. No hidden fees.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  'relative flex flex-col',
                  plan.highlighted && 'border-primary shadow-lg ring-1 ring-primary/20',
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{plan.priceSuffix}</span>
                  </div>
                  <ul className="flex-1 space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={plan.name === 'Enterprise' ? ROUTES.CONTACT : ROUTES.SIGNUP}>
                    <Button
                      className="w-full gap-2"
                      variant={plan.highlighted ? 'default' : 'outline'}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-2xl font-bold">Questions about pricing?</h2>
          <p className="mt-4 text-muted-foreground">
            Every laboratory is different. Contact us for a tailored quote that matches
            your volume, team size, and compliance requirements.
          </p>
          <Link to={ROUTES.CONTACT}>
            <Button variant="outline" size="lg" className="mt-8 gap-2">
              Talk to Sales <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}
