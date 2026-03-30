import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Microscope, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Product', href: '/#product' },
  { label: 'Features', href: '/#features' },
  { label: 'Security', href: '/#security' },
  { label: 'About', href: ROUTES.ABOUT },
  { label: 'Contact', href: ROUTES.CONTACT },
]

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  function scrollToSection(href: string) {
    setMobileOpen(false)
    if (href.startsWith('/#')) {
      const id = href.slice(2)
      if (location.pathname === '/') {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      } else {
        window.location.href = href
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Microscope className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">Cytova</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) =>
            link.href.startsWith('/#') ? (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link to={ROUTES.LOGIN}>
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to={ROUTES.SIGNUP}>
            <Button size="sm">Request a Demo</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden rounded-md p-2 text-muted-foreground hover:text-foreground"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 md:hidden',
          mobileOpen ? 'max-h-96 border-t' : 'max-h-0',
        )}
      >
        <div className="space-y-1 px-6 py-4">
          {NAV_LINKS.map((link) =>
            link.href.startsWith('/#') ? (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ),
          )}
          <div className="flex flex-col gap-2 pt-3 border-t mt-3">
            <Link to={ROUTES.LOGIN} onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full">Sign in</Button>
            </Link>
            <Link to={ROUTES.SIGNUP} onClick={() => setMobileOpen(false)}>
              <Button className="w-full">Request a Demo</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
