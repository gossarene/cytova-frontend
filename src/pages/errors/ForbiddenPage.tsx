import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-6">
      <ShieldX className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="mt-2 text-muted-foreground max-w-sm">
        You don't have permission to access this page. Contact your lab administrator if you believe this is an error.
      </p>
      <Link to={ROUTES.DASHBOARD}>
        <Button className="mt-6">Go to Dashboard</Button>
      </Link>
    </div>
  )
}
