import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/constants/routes'
import type { Permission } from '@/constants/permissions'

interface RequireAuthProps {
  permissions?: Permission[]
  requireAll?: boolean
}

export function RequireAuth({ permissions, requireAll = false }: RequireAuthProps) {
  const { isAuthenticated, isLoading, hasAnyPermission, hasAllPermissions } =
    useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  // Check permissions if specified
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)

    if (!hasRequiredPermissions) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Accès refusé</h1>
            <p className="mt-2 text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
          </div>
        </div>
      )
    }
  }

  return <Outlet />
}
