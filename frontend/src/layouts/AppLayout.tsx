import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Home,
  Package,
  Calendar,
  Users,
  Shield,
  FileText,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  User,
  Settings,
} from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { MaintenancePage } from '@/features/maintenance/pages/MaintenancePage'
import { settingsApi } from '@/api/settings.api'
import { ROUTES } from '@/constants/routes'
import { PERMISSIONS, Permission } from '@/constants/permissions'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  path: string
  icon: React.ElementType
  permission?: Permission
}

const navItems: NavItem[] = [
  { name: 'Accueil', path: ROUTES.HOME, icon: Home },
  { name: 'Produits', path: ROUTES.PRODUCTS, icon: Package },
  { name: 'Mes Réservations', path: ROUTES.MY_RESERVATIONS, icon: Calendar },
]

const adminNavItems: NavItem[] = [
  { name: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard, permission: PERMISSIONS.VIEW_STATISTICS },
  { name: 'Statistiques', path: ROUTES.ADMIN_STATISTICS, icon: BarChart3, permission: PERMISSIONS.VIEW_STATISTICS },
  { name: 'Utilisateurs', path: ROUTES.ADMIN_USERS, icon: Users, permission: PERMISSIONS.VIEW_USERS },
  { name: 'Rôles', path: ROUTES.ADMIN_ROLES, icon: Shield, permission: PERMISSIONS.VIEW_ROLES },
  { name: 'Sections', path: ROUTES.ADMIN_SECTIONS, icon: FileText, permission: PERMISSIONS.VIEW_SECTIONS },
  { name: 'Produits', path: ROUTES.ADMIN_PRODUCTS, icon: Package, permission: PERMISSIONS.MANAGE_PRODUCTS },
  { name: 'Réservations', path: ROUTES.ADMIN_RESERVATIONS, icon: Calendar, permission: PERMISSIONS.VIEW_RESERVATIONS },
  { name: 'Paramètres', path: ROUTES.ADMIN_SETTINGS, icon: Settings, permission: PERMISSIONS.VIEW_SETTINGS },
]

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const { hasPermission } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { logout } = useAuth()

  const canBypassMaintenance = hasPermission(PERMISSIONS.BYPASS_MAINTENANCE)

  // Check maintenance status - only if user cannot bypass
  const { data: maintenanceData } = useQuery({
    queryKey: ['settings', 'maintenance', 'status'],
    queryFn: () => settingsApi.getMaintenanceStatus(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: false, // Don't retry on error
    staleTime: 10000, // Consider data fresh for 10 seconds
    enabled: !canBypassMaintenance, // Skip query if user can bypass
  })

  const isActive = (path: string) => location.pathname === path

  const hasAdminAccess = hasPermission(PERMISSIONS.VIEW_ADMIN_PANEL)

  const filteredAdminItems = adminNavItems.filter((item) =>
    item.permission ? hasPermission(item.permission) : true
  )

  // Show maintenance page if maintenance is enabled and user doesn't have bypass permission
  const maintenanceEnabled = maintenanceData?.data?.data?.maintenanceEnabled
  const maintenanceMessage = maintenanceData?.data?.data?.maintenanceMessage

  if (maintenanceEnabled && !canBypassMaintenance) {
    return <MaintenancePage message={maintenanceMessage} />
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-bold">Thales App</h1>
          <NotificationBell />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {hasAdminAccess && filteredAdminItems.length > 0 && (
            <>
              <div className="my-4 border-t" />
              <div className="space-y-1">
                <p className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  Administration
                </p>
                {filteredAdminItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive(item.path)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </nav>

        <div className="border-t p-4">
          <Link
            to={ROUTES.PROFILE}
            className="mb-4 flex items-center gap-3 rounded-lg bg-muted px-3 py-2 hover:bg-accent transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{user?.credits} crédits</p>
            </div>
          </Link>

          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start" asChild size="sm">
              <Link to={ROUTES.PROFILE}>
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={toggleTheme}
              size="sm"
            >
              {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              Thème
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => logout()}
              size="sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 flex-col border-r bg-card lg:hidden">
            <div className="flex h-16 items-center justify-between border-b px-6">
              <h1 className="text-xl font-bold">Thales App</h1>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive(item.path)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>

              {hasAdminAccess && filteredAdminItems.length > 0 && (
                <>
                  <div className="my-4 border-t" />
                  <div className="space-y-1">
                    <p className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      Administration
                    </p>
                    {filteredAdminItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                            isActive(item.path)
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}
            </nav>

            <div className="border-t p-4">
              <Link
                to={ROUTES.PROFILE}
                onClick={() => setSidebarOpen(false)}
                className="mb-4 flex items-center gap-3 rounded-lg bg-muted px-3 py-2 hover:bg-accent transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.credits} crédits</p>
                </div>
              </Link>

              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start" asChild size="sm">
                  <Link to={ROUTES.PROFILE} onClick={() => setSidebarOpen(false)}>
                    <User className="mr-2 h-4 w-4" />
                    Mon profil
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={toggleTheme}
                  size="sm"
                >
                  {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  Thème
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setSidebarOpen(false)
                    logout()
                  }}
                  size="sm"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 items-center justify-between border-b px-4 lg:hidden">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="ml-4 text-xl font-bold">Thales App</h1>
          </div>
          <NotificationBell />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/40">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
