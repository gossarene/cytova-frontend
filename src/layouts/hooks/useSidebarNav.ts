import {
  LayoutDashboard, Users, ClipboardList, FileCheck, BookOpen,
  Package, Truck, ShoppingCart, Building2, Bell, UserCog,
  ScrollText, Settings, Beaker,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore } from '@/lib/auth/store'
import { P } from '@/lib/permissions/constants'
import { ROUTES } from '@/config/routes'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  permission: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard, permission: P.DASHBOARD_VIEW },
    ],
  },
  {
    title: 'Laboratory',
    items: [
      { label: 'Patients', href: ROUTES.PATIENTS, icon: Users, permission: P.PATIENTS_VIEW },
      { label: 'Requests', href: ROUTES.REQUESTS, icon: ClipboardList, permission: P.REQUESTS_VIEW },
      { label: 'Results', href: ROUTES.RESULTS, icon: FileCheck, permission: P.RESULTS_VIEW },
      { label: 'Catalog', href: ROUTES.CATALOG, icon: BookOpen, permission: P.CATALOG_VIEW },
    ],
  },
  {
    title: 'Supply Chain',
    items: [
      { label: 'Stock', href: ROUTES.STOCK, icon: Package, permission: P.STOCK_VIEW },
      { label: 'Suppliers', href: ROUTES.SUPPLIERS, icon: Truck, permission: P.SUPPLIERS_VIEW },
      { label: 'Procurement', href: ROUTES.PROCUREMENT, icon: ShoppingCart, permission: P.PROCUREMENT_VIEW },
    ],
  },
  {
    title: 'Network',
    items: [
      { label: 'Partners', href: ROUTES.PARTNERS, icon: Building2, permission: P.PARTNERS_VIEW },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Alerts', href: ROUTES.ALERTS, icon: Bell, permission: P.ALERTS_VIEW },
      { label: 'Users', href: ROUTES.USERS, icon: UserCog, permission: P.USERS_VIEW },
      { label: 'Audit Log', href: ROUTES.AUDIT, icon: ScrollText, permission: P.AUDIT_VIEW },
      { label: 'Settings', href: ROUTES.SETTINGS, icon: Settings, permission: P.SETTINGS_VIEW },
      { label: 'Lab Settings', href: ROUTES.LAB_SETTINGS, icon: Beaker, permission: P.SETTINGS_VIEW },
    ],
  },
]

export function useSidebarNav(): NavSection[] {
  const permissions = useAuthStore((s) => s.permissions)
  return NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => permissions.has(item.permission)),
    }))
    .filter((section) => section.items.length > 0)
}
