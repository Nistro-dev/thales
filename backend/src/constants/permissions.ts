export const PERMISSIONS = {
  // Users
  VIEW_USERS: 'VIEW_USERS',
  MANAGE_USERS: 'MANAGE_USERS',

  // Credits
  VIEW_CREDITS: 'VIEW_CREDITS',
  MANAGE_CREDITS: 'MANAGE_CREDITS',

  // Cautions
  MANAGE_CAUTIONS: 'MANAGE_CAUTIONS',

  // Roles
  VIEW_ROLES: 'VIEW_ROLES',
  MANAGE_ROLES: 'MANAGE_ROLES',

  // Sections
  MANAGE_SECTIONS: 'MANAGE_SECTIONS',

  // Products
  VIEW_PRODUCTS: 'VIEW_PRODUCTS',
  MANAGE_PRODUCTS: 'MANAGE_PRODUCTS',

  // Reservations
  VIEW_RESERVATIONS: 'VIEW_RESERVATIONS',
  MANAGE_RESERVATIONS: 'MANAGE_RESERVATIONS',

  // Statistics
  VIEW_STATISTICS: 'VIEW_STATISTICS',

  // Settings
  VIEW_SETTINGS: 'VIEW_SETTINGS',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',

  // Maintenance
  BYPASS_MAINTENANCE: 'BYPASS_MAINTENANCE',
  BACKUP_DATABASE: 'BACKUP_DATABASE',
} as const

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export const PERMISSION_HIERARCHY: Record<string, string> = {
  // MANAGE implies VIEW
  MANAGE_USERS: 'VIEW_USERS',
  MANAGE_CREDITS: 'VIEW_CREDITS',
  MANAGE_ROLES: 'VIEW_ROLES',
  MANAGE_PRODUCTS: 'VIEW_PRODUCTS',
  MANAGE_RESERVATIONS: 'VIEW_RESERVATIONS',
  MANAGE_SETTINGS: 'VIEW_SETTINGS',
}

export const PERMISSION_CATEGORIES = {
  users: 'users',
  credits: 'credits',
  cautions: 'cautions',
  roles: 'roles',
  sections: 'sections',
  products: 'products',
  reservations: 'reservations',
  statistics: 'statistics',
  settings: 'settings',
  maintenance: 'maintenance',
} as const

export type PermissionCategory = typeof PERMISSION_CATEGORIES[keyof typeof PERMISSION_CATEGORIES]

export const PERMISSIONS_BY_CATEGORY: Record<PermissionCategory, PermissionKey[]> = {
  users: ['VIEW_USERS', 'MANAGE_USERS'],
  credits: ['VIEW_CREDITS', 'MANAGE_CREDITS'],
  cautions: ['MANAGE_CAUTIONS'],
  roles: ['VIEW_ROLES', 'MANAGE_ROLES'],
  sections: ['MANAGE_SECTIONS'],
  products: ['VIEW_PRODUCTS', 'MANAGE_PRODUCTS'],
  reservations: ['VIEW_RESERVATIONS', 'MANAGE_RESERVATIONS'],
  statistics: ['VIEW_STATISTICS'],
  settings: ['VIEW_SETTINGS', 'MANAGE_SETTINGS'],
  maintenance: ['BYPASS_MAINTENANCE', 'BACKUP_DATABASE'],
}
