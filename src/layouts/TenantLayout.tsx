import { Outlet } from 'react-router-dom'
import { TenantSidebar } from './components/TenantSidebar'
import { TenantTopbar } from './components/TenantTopbar'
import { OnboardingBanner } from './components/OnboardingBanner'
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
        {/* Onboarding banner sits below the header. It self-hides when:
            - the user is not LAB_ADMIN/BIOLOGIST,
            - prerequisites are already met,
            - or the user has dismissed it via localStorage. */}
        <OnboardingBanner />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
