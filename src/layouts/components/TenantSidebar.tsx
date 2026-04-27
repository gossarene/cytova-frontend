import { useState } from 'react'
import { PanelLeftClose, PanelLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import cytovaLogo from '@/assets/images/branding/cytova-logo.png'
import cytovaIcon from '@/assets/images/branding/cytova-icon.png'
import { Button } from '@/components/ui/button'
import { SidebarNavItem } from './SidebarNavItem'
import { useSidebarNav } from '../hooks/useSidebarNav'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

export function TenantSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const sections = useSidebarNav()

  return (
    <aside
      className={cn(
        'flex h-full flex-col text-sidebar-foreground transition-all duration-200',
        'bg-[linear-gradient(180deg,#020617_0%,#0F172A_100%)]',
        'border-r border-sidebar-border/70',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo — fixed at top */}
      <div className={cn(
        'flex h-14 shrink-0 items-center border-b border-sidebar-border/60 px-4',
        collapsed && 'justify-center px-2',
      )}>
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
          {collapsed ? (
            <img src={cytovaIcon} alt="Cytova" className="h-7 w-7 shrink-0" />
          ) : (
            <img src={cytovaLogo} alt="Cytova" className="h-7 shrink-0 brightness-0 invert" />
          )}
        </Link>
      </div>

      {/* Navigation — scrollable, hidden scrollbar.
          min-h-0 is required so this flex child can shrink below its content
          height and the overflow-y-auto actually engages. */}
      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden py-3 px-2 space-y-0.5">
        {sections.map((section, i) => (
          <div key={section.title}>
            {i > 0 && (
              <div className="my-2 mx-2 h-px bg-sidebar-border/60" />
            )}
            {!collapsed && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                end={item.end}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse toggle — fixed at bottom */}
      <div className="shrink-0 border-t border-sidebar-border/60 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/5"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  )
}
