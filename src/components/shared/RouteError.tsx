import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Microscope, RefreshCw, ArrowLeft, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * React Router errorElement — displayed when a route loader/action throws
 * or a rendering error bubbles up through the route tree.
 * Replaces the default React Router error screen with a Cytova-branded fallback.
 */
export function RouteError() {
  const error = useRouteError()

  let title = 'Something went wrong'
  let message = 'An unexpected error occurred. Please try again or return to the dashboard.'

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page not found'
      message = "The page you're looking for doesn't exist or has been moved."
    } else if (error.status === 403) {
      title = 'Access denied'
      message = "You don't have permission to access this page."
    } else if (error.status >= 500) {
      title = 'Server error'
      message = 'Something went wrong on our end. Please try again later.'
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
          <Microscope className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" className="gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
          <Button className="gap-2" onClick={() => { window.location.href = '/dashboard' }}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
