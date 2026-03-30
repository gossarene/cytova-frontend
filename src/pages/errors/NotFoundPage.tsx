import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-6">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted-foreground max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to={ROUTES.DASHBOARD}>
        <Button className="mt-6">Go to Dashboard</Button>
      </Link>
    </div>
  )
}
