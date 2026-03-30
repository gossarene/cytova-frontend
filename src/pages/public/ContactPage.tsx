import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const CONTACT_INFO = [
  { icon: Mail, label: 'Email', value: 'contact@cytova.io', href: 'mailto:contact@cytova.io' },
  { icon: Phone, label: 'Phone', value: '+33 1 00 00 00 00', href: 'tel:+33100000000' },
  { icon: MapPin, label: 'Address', value: 'Paris, France', href: undefined },
  { icon: Clock, label: 'Hours', value: 'Mon-Fri, 9am-6pm CET', href: undefined },
]

export function ContactPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Contact</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Get in touch with our team
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Have questions about Cytova? Want to schedule a demo? We're here to help.
          </p>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Contact info */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold">Contact Information</h2>
              <p className="text-muted-foreground">
                Reach out and we'll get back to you within 24 hours.
              </p>
              <div className="space-y-4 pt-2">
                {CONTACT_INFO.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact form */}
            <Card className="lg:col-span-3">
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold mb-6">Send us a message</h3>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="space-y-5"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input id="firstName" placeholder="Claire" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input id="lastName" placeholder="Moreau" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@laboratory.io" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labName">Laboratory name</Label>
                    <Input id="labName" placeholder="Your laboratory" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" rows={4} placeholder="Tell us about your needs..." />
                  </div>
                  <Button type="submit" className="w-full sm:w-auto">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  )
}
