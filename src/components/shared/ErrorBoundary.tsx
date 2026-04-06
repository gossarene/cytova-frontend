import { Component, type ReactNode } from 'react'
import { Microscope, RefreshCw, ArrowLeft, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React class component error boundary.
 * Catches rendering errors anywhere in the child tree and displays
 * a professional fallback UI instead of a blank screen or raw stack trace.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Cytova] Uncaught rendering error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false, error: null })} />
    }
    return this.props.children
  }
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
          <Microscope className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. This has been logged and our team will look into it.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" className="gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button variant="outline" className="gap-2" onClick={onReset}>
            <RefreshCw className="h-4 w-4" />
            Try Again
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
