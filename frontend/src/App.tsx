import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from './lib/react-query'
import { AuthProvider } from './features/auth/components/AuthProvider'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Toaster } from './components/ui/toaster'
import { router } from './router'

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}

export default App
