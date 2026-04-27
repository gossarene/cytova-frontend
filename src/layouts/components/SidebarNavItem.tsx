import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarNavItemProps {
  href: string
  icon: LucideIcon
  label: string
  badge?: number
  collapsed?: boolean
  /** Exact-match mode — prevents prefix matching from activating parent routes. */
  end?: boolean
}

export function SidebarNavItem({ href, icon: Icon, label, badge, collapsed, end }: SidebarNavItemProps) {
  return (
    <NavLink
      to={href}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
          isActive
            ? 'bg-[#2563EB]/10 text-white ring-1 ring-inset ring-[#2563EB]/25 shadow-[inset_2px_0_0_0_#2563EB,0_0_24px_-12px_rgba(37,99,235,0.55)]'
            : 'text-sidebar-foreground/65 hover:bg-white/[0.04] hover:text-white',
          collapsed && 'justify-center px-2',
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-[10px] font-semibold text-sidebar-primary-foreground">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
