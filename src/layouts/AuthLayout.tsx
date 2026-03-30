import { Outlet, Link } from 'react-router-dom'
import { Microscope, ShieldCheck, Lock, Server } from 'lucide-react'
import { ROUTES } from '@/config/routes'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-slate-950 p-10 text-white">
        <div>
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Microscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Cytova</span>
          </Link>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold leading-tight">
            Modern laboratory management,<br />
            built for precision.
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Manage patients, analysis requests, results, inventory,
            and staff — all from a single, secure platform designed
            exclusively for medical laboratories.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            {[
              { icon: ShieldCheck, text: 'ISO 15189 ready traceability' },
              { icon: Lock, text: 'Tenant-isolated data architecture' },
              { icon: Server, text: '99.9% uptime SLA' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-slate-400">
                <Icon className="h-4 w-4 text-teal-400 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Cytova Technologies
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Microscope className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Cytova</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-[400px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
