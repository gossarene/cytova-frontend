import { Link } from 'react-router-dom'
import { Target, Heart, Eye, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ROUTES } from '@/config/routes'

const VALUES = [
  {
    icon: Target,
    title: 'Precision',
    description: 'Every feature is designed for accuracy. From result validation workflows to stock traceability, we leave no room for ambiguity.',
  },
  {
    icon: Heart,
    title: 'Patient Impact',
    description: 'Behind every analysis request is a patient. We build tools that help laboratories deliver timely, accurate results that improve lives.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    description: 'Immutable audit trails, clear status transitions, and role-based access ensure every action is traceable and accountable.',
  },
]

export function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">About Cytova</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Empowering laboratories with modern tools
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Cytova was founded with a clear mission: to give every medical laboratory
            access to the digital infrastructure they deserve. We build cloud-native
            software that is secure, intuitive, and built for the realities of laboratory work.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Our Values</h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {VALUES.map((value) => (
              <Card key={value.title} className="border-0 bg-slate-50 shadow-none">
                <CardContent className="p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Join us on our mission</h2>
          <p className="mt-4 text-muted-foreground">
            Whether you're a laboratory looking for better tools or a professional who
            shares our vision, we'd love to connect.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to={ROUTES.CONTACT}>
              <Button size="lg" className="gap-2">
                Contact Us <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
