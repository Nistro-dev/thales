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
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { ProductDetailPage } from '@/features/products/pages/ProductDetailPage'
import { MyReservationsPage } from '@/features/reservations/pages/MyReservationsPage'
import { ReservationDetailPage } from '@/features/reservations/pages/ReservationDetailPage'
import { AdminReservationsPage } from '@/features/reservations/pages/AdminReservationsPage'
import { AdminReservationDetailPage } from '@/features/reservations/pages/AdminReservationDetailPage'
import { QRScannerPage } from '@/features/reservations/pages/QRScannerPage'
import {
  HomePage,
  ProfilePage,
  AdminUsersPage,
  AdminRolesPage,
  AdminSectionsPage,
  AdminProductsPage,
  AdminStatisticsPage,
} from './placeholders'

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
            path: ROUTES.PRODUCT_DETAIL,
            element: <ProductDetailPage />,
          },
          {
            path: ROUTES.MY_RESERVATIONS,
            element: <MyReservationsPage />,
          },
          {
            path: ROUTES.RESERVATION_DETAIL,
            element: <ReservationDetailPage />,
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
              {
                path: ROUTES.ADMIN_RESERVATION_DETAIL,
                element: <AdminReservationDetailPage />,
              },
              {
                path: ROUTES.ADMIN_QR_SCANNER,
                element: <QRScannerPage />,
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
