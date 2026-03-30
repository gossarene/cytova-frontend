import { Outlet } from 'react-router-dom'
import { TenantSidebar } from './components/TenantSidebar'
import { TenantTopbar } from './components/TenantTopbar'
import { useCurrentUser } from '@/lib/auth/hooks'

export function TenantLayout() {
  // Fetch fresh user data + permissions from the server.
  // Populates full name (missing from JWT) and refreshes permissions on tab focus.
  useCurrentUser()

  return (
    <div className="flex h-screen overflow-hidden">
      <TenantSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TenantTopbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
