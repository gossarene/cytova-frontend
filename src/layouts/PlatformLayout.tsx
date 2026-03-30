import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, CreditCard, Layers, LogOut, Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

import { usePlatformAuthStore } from '@/lib/auth/platform-store'
import { useIsPlatformOwner } from '@/lib/permissions/platform-hooks'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', href: ROUTES.PLATFORM_DASHBOARD, icon: LayoutDashboard },
  { label: 'Laboratories', href: ROUTES.PLATFORM_TENANTS, icon: Building2 },
  { label: 'Subscriptions', href: ROUTES.PLATFORM_SUBSCRIPTIONS, icon: CreditCard },
  { label: 'Plans', href: ROUTES.PLATFORM_PLANS, icon: Layers },
]

export function PlatformLayout() {
  const navigate = useNavigate()
  const user = usePlatformAuthStore((s) => s.user)
  const logout = usePlatformAuthStore((s) => s.logout)
  const isOwner = useIsPlatformOwner()

  function handleLogout() {
    logout()
    navigate(ROUTES.PLATFORM_LOGIN)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-slate-950 text-slate-300">
        {/* Brand */}
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-800 px-5">
          <Shield className="h-5 w-5 text-amber-400" />
          <span className="text-lg font-semibold text-white">Platform</span>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-slate-800 hover:text-white',
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-400',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        {/* User info */}
        <div className="border-t border-slate-800 p-4 space-y-3">
          <div className="text-xs">
            <p className="font-medium text-white truncate">{user?.email}</p>
            <p className="text-slate-500 mt-0.5">
              {isOwner ? 'Platform Owner' : 'Platform Staff'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          <span className="text-sm font-medium text-muted-foreground">
            Cytova Platform Administration
          </span>
          {isOwner && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Owner
            </span>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
