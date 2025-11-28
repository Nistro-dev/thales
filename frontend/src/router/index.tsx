import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth } from '@/features/auth/guards/RequireAuth'
import { RequireGuest } from '@/features/auth/guards/RequireGuest'
import { AppLayout } from '@/layouts/AppLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { CompleteRegistrationPage } from '@/features/auth/pages/CompleteRegistrationPage'
import { TermsOfServicePage, PrivacyPolicyPage } from '@/features/legal/pages'
import { RouteErrorBoundary } from '@/components/common/RouteErrorBoundary'
import { LazyPage } from '@/components/common/LazyPage'
import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/constants/permissions'
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { ProductDetailPage } from '@/features/products/pages/ProductDetailPage'
import { MyReservationsPage } from '@/features/reservations/pages/MyReservationsPage'
import { ReservationDetailPage } from '@/features/reservations/pages/ReservationDetailPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage'
import {
  HomePage,
  AdminRolesPage,
  AdminSectionsPage,
  AdminProductsPage,
} from './placeholders'

// Lazy loaded admin pages for better code splitting
const AdminUsersPage = lazy(() => import('@/features/users/pages/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })))
const AdminUserDetailPage = lazy(() => import('@/features/users/pages/AdminUserDetailPage').then(m => ({ default: m.AdminUserDetailPage })))
const AdminReservationsPage = lazy(() => import('@/features/reservations/pages/AdminReservationsPage').then(m => ({ default: m.AdminReservationsPage })))
const AdminReservationDetailPage = lazy(() => import('@/features/reservations/pages/AdminReservationDetailPage').then(m => ({ default: m.AdminReservationDetailPage })))
const QRScannerPage = lazy(() => import('@/features/reservations/pages/QRScannerPage').then(m => ({ default: m.QRScannerPage })))
const AdminDashboardPage = lazy(() => import('@/features/stats').then(m => ({ default: m.AdminDashboardPage })))
const AdminStatsPage = lazy(() => import('@/features/stats').then(m => ({ default: m.AdminStatsPage })))

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
            path: ROUTES.FORGOT_PASSWORD,
            element: <ForgotPasswordPage />,
          },
          {
            path: ROUTES.RESET_PASSWORD,
            element: <ResetPasswordPage />,
          },
          {
            path: ROUTES.COMPLETE_REGISTRATION,
            element: <CompleteRegistrationPage />,
          },
          {
            path: ROUTES.TERMS_OF_SERVICE,
            element: <TermsOfServicePage />,
          },
          {
            path: ROUTES.PRIVACY_POLICY,
            element: <PrivacyPolicyPage />,
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
          {
            path: ROUTES.NOTIFICATIONS,
            element: <NotificationsPage />,
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
                element: <LazyPage><AdminUsersPage /></LazyPage>,
              },
              {
                path: ROUTES.ADMIN_USER_DETAIL,
                element: <LazyPage><AdminUserDetailPage /></LazyPage>,
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
                element: <LazyPage><AdminReservationsPage /></LazyPage>,
              },
              {
                path: ROUTES.ADMIN_RESERVATION_DETAIL,
                element: <LazyPage><AdminReservationDetailPage /></LazyPage>,
              },
              {
                path: ROUTES.ADMIN_QR_SCANNER,
                element: <LazyPage><QRScannerPage /></LazyPage>,
              },
            ],
          },
          {
            element: <RequireAuth permissions={[PERMISSIONS.VIEW_STATISTICS]} />,
            children: [
              {
                path: ROUTES.ADMIN_DASHBOARD,
                element: <LazyPage><AdminDashboardPage /></LazyPage>,
              },
              {
                path: ROUTES.ADMIN_STATISTICS,
                element: <LazyPage><AdminStatsPage /></LazyPage>,
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
