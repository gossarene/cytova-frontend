import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { useAuthStore } from '@/lib/auth/store'
import { ROLE_LABELS } from '@/lib/auth/types'
import { ROUTES } from '@/config/routes'
import { api } from '@/lib/api/client'
import { queryClient } from '@/lib/api/query-client'

export function TenantTopbar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const logout = useAuthStore((s) => s.logout)

  async function handleLogout() {
    try {
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh_token: refreshToken })
      }
    } catch {
      // Best-effort — don't block logout on server failure
    }
    logout()
    queryClient.clear()
    navigate(ROUTES.LOGIN)
  }

  if (!user) return null

  return (
    <header className="flex h-14 items-center justify-end border-b bg-card px-6 gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" className="gap-2 px-2">
            <UserAvatar firstName={user.firstName || user.email.charAt(0)} lastName={user.lastName || ''} size="sm" />
            <span className="text-sm font-medium hidden sm:inline">{user.firstName || user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
