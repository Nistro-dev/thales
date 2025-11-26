import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from './ErrorFallback'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('Error caught by ErrorBoundary:', error)
      console.error('Component stack:', errorInfo.componentStack)
    }

    // TODO: En production, envoyer à un service de monitoring (Sentry, etc.)
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      {children}
    </ReactErrorBoundary>
  )
}
