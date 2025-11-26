import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth } from '@/features/auth/guards/RequireAuth'
import { RequireGuest } from '@/features/auth/guards/RequireGuest'
import { AppLayout } from '@/layouts/AppLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { RouteErrorBoundary } from '@/components/common/RouteErrorBoundary'
import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/constants/permissions'

// Placeholder pages - will be implemented in next phases
const HomePage = () => <div className="text-2xl font-bold">Page d'accueil</div>
const ProductsPage = () => <div className="text-2xl font-bold">Produits</div>
const MyReservationsPage = () => <div className="text-2xl font-bold">Mes Réservations</div>
const ProfilePage = () => <div className="text-2xl font-bold">Profil</div>

// Admin pages placeholders
const AdminUsersPage = () => <div className="text-2xl font-bold">Administration - Utilisateurs</div>
const AdminRolesPage = () => <div className="text-2xl font-bold">Administration - Rôles</div>
const AdminSectionsPage = () => <div className="text-2xl font-bold">Administration - Sections</div>
const AdminProductsPage = () => <div className="text-2xl font-bold">Administration - Produits</div>
const AdminReservationsPage = () => <div className="text-2xl font-bold">Administration - Réservations</div>
const AdminStatisticsPage = () => <div className="text-2xl font-bold">Administration - Statistiques</div>

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    element: <RequireGuest />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            path: ROUTES.LOGIN,
            element: <LoginPage />,
          },
          {
            path: ROUTES.REGISTER,
            element: <RegisterPage />,
          },
        ],
      },
    ],
  },
  {
    errorElement: <RouteErrorBoundary />,
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: ROUTES.HOME,
            element: <HomePage />,
          },
          {
            path: ROUTES.PRODUCTS,
            element: <ProductsPage />,
          },
          {
            path: ROUTES.MY_RESERVATIONS,
            element: <MyReservationsPage />,
          },
          {
            path: ROUTES.PROFILE,
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
  {
    errorElement: <RouteErrorBoundary />,
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            element: <RequireAuth permissions={[PERMISSIONS.VIEW_USERS]} />,
            children: [
              {
                path: ROUTES.ADMIN_USERS,
                element: <AdminUsersPage />,
              },
            ],
          },
          {
            element: <RequireAuth permissions={[PERMISSIONS.VIEW_ROLES]} />,
            children: [
              {
                path: ROUTES.ADMIN_ROLES,
                element: <AdminRolesPage />,
              },
            ],
          },
          {
            element: <RequireAuth permissions={[PERMISSIONS.VIEW_SECTIONS]} />,
            children: [
              {
                path: ROUTES.ADMIN_SECTIONS,
                element: <AdminSectionsPage />,
              },
            ],
          },
          {
            element: <RequireAuth permissions={[PERMISSIONS.MANAGE_PRODUCTS]} />,
            children: [
              {
                path: ROUTES.ADMIN_PRODUCTS,
                element: <AdminProductsPage />,
              },
            ],
          },
          {
            element: <RequireAuth permissions={[PERMISSIONS.VIEW_RESERVATIONS]} />,
            children: [
              {
                path: ROUTES.ADMIN_RESERVATIONS,
                element: <AdminReservationsPage />,
              },
            ],
          },
          {
            element: <RequireAuth permissions={[PERMISSIONS.VIEW_STATISTICS]} />,
            children: [
              {
                path: ROUTES.ADMIN_STATISTICS,
                element: <AdminStatisticsPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.HOME} replace />,
  },
])
