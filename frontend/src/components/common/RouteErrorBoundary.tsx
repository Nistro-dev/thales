import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { ErrorFallback } from './ErrorFallback'

export function RouteErrorBoundary() {
  const error = useRouteError()

  // Convert route error to Error object for ErrorFallback
  let errorObject: Error

  if (isRouteErrorResponse(error)) {
    // This is a route error response (like 404)
    errorObject = new Error(error.statusText || 'Route error')
    errorObject.name = `${error.status} Error`
    errorObject.stack = error.data?.stack || `Route: ${error.statusText}`
  } else if (error instanceof Error) {
    errorObject = error
  } else {
    errorObject = new Error('Unknown error')
  }

  return <ErrorFallback error={errorObject} />
}
