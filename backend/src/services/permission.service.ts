import { prisma } from '../utils/prisma.js'
import { PERMISSION_HIERARCHY, type PermissionKey } from '../constants/permissions.js'

/**
 * Resolves all permissions for a user, including inherited permissions from hierarchy
 */
export const getUserPermissions = async (
  userId: string,
  sectionId?: string
): Promise<Set<PermissionKey>> => {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      ...(sectionId && { sectionId }),
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  })

  const directPermissions = new Set<PermissionKey>()

  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.permissions) {
      directPermissions.add(rolePermission.permission.key as PermissionKey)
    }
  }

  return expandPermissions(directPermissions)
}

/**
 * Expands permissions by resolving the hierarchy
 */
export const expandPermissions = (permissions: Set<PermissionKey>): Set<PermissionKey> => {
  const expanded = new Set<PermissionKey>(permissions)
  const toProcess = Array.from(permissions)

  while (toProcess.length > 0) {
    const current = toProcess.pop()!
    const children = PERMISSION_HIERARCHY[current] || []

    for (const child of children) {
      if (!expanded.has(child as PermissionKey)) {
        expanded.add(child as PermissionKey)
        toProcess.push(child as PermissionKey)
      }
    }
  }

  return expanded
}

/**
 * Checks if a user has a specific permission
 */
export const hasPermission = async (
  userId: string,
  permission: PermissionKey,
  sectionId?: string
): Promise<boolean> => {
  const userPermissions = await getUserPermissions(userId, sectionId)
  return userPermissions.has(permission)
}

/**
 * Checks if a user has ALL of the specified permissions
 */
export const hasAllPermissions = async (
  userId: string,
  permissions: PermissionKey[],
  sectionId?: string
): Promise<boolean> => {
  const userPermissions = await getUserPermissions(userId, sectionId)
  return permissions.every((p) => userPermissions.has(p))
}

/**
 * Checks if a user has ANY of the specified permissions
 */
export const hasAnyPermission = async (
  userId: string,
  permissions: PermissionKey[],
  sectionId?: string
): Promise<boolean> => {
  const userPermissions = await getUserPermissions(userId, sectionId)
  return permissions.some((p) => userPermissions.has(p))
}

/**
 * Gets all permissions (from database)
 */
export const getAllPermissions = async () => {
  return prisma.permission.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: {
      parent: true,
      children: true,
    },
  })
}

/**
 * Gets permissions by category
 */
export const getPermissionsByCategory = async (category: string) => {
  return prisma.permission.findMany({
    where: { category },
    orderBy: { name: 'asc' },
    include: {
      parent: true,
      children: true,
    },
  })
}

/**
 * Gets a permission by its key
 */
export const getPermissionByKey = async (key: string) => {
  return prisma.permission.findUnique({
    where: { key },
    include: {
      parent: true,
      children: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  })
}
