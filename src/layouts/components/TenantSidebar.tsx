import { useState } from 'react'
import { Microscope, PanelLeftClose, PanelLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
        'flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-14 items-center border-b border-sidebar-border px-4', collapsed && 'justify-center px-2')}>
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2 text-sidebar-foreground">
          <Microscope className="h-6 w-6 text-sidebar-primary shrink-0" />
          {!collapsed && <span className="text-lg font-semibold tracking-tight">Cytova</span>}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {sections.map((section, i) => (
            <div key={section.title}>
              {i > 0 && <Separator className="my-2 bg-sidebar-border" />}
              {!collapsed && (
                <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
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
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </aside>
  )
}
