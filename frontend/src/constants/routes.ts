export const ROUTES = {
  // Public
  LOGIN: '/login',
  REGISTER: '/register',

  // App
  HOME: '/',
  PROFILE: '/profile',

  // Products & Reservations
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  MY_RESERVATIONS: '/my-reservations',
  RESERVATION_DETAIL: '/my-reservations/:id',

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_INVITATIONS: '/admin/invitations',
  ADMIN_SECTIONS: '/admin/sections',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_RESERVATIONS: '/admin/reservations',
  ADMIN_RESERVATION_DETAIL: '/admin/reservations/:id',
  ADMIN_QR_SCANNER: '/admin/qr-scanner',
  ADMIN_STATISTICS: '/admin/statistics',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_FILES: '/admin/files',
} as const

export type Route = (typeof ROUTES)[keyof typeof ROUTES]
