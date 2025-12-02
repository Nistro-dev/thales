import { prisma } from '../utils/prisma.js'
import { ErrorMessages } from '../utils/response.js'
import { createAuditLog } from './audit.service.js'

interface CreateRoleParams {
  name: string
  description?: string
  permissionKeys: string[]
  performedBy: string
}

export const createRole = async (params: CreateRoleParams) => {
  const existingRole = await prisma.role.findUnique({
    where: { name: params.name },
  })

  if (existingRole) {
    throw {
      statusCode: 409,
      message: ErrorMessages.ALREADY_EXISTS,
      code: 'ALREADY_EXISTS',
      details: { field: 'name' },
    }
  }

  // Convert permission keys to IDs
  const permissions = await prisma.permission.findMany({
    where: {
      key: {
        in: params.permissionKeys,
      },
    },
    select: { id: true, key: true },
  })

  if (permissions.length !== params.permissionKeys.length) {
    const foundKeys = permissions.map(p => p.key)
    const missingKeys = params.permissionKeys.filter(k => !foundKeys.includes(k))
    throw {
      statusCode: 400,
      message: 'Certaines clés de permission sont invalides',
      code: 'VALIDATION_ERROR',
      details: { invalidKeys: missingKeys },
    }
  }

  const permissionIds = permissions.map(p => p.id)

  const role = await prisma.role.create({
    data: {
      name: params.name,
      description: params.description,
      isSystem: false,
      permissions: {
        create: permissionIds.map((permissionId) => ({
          permissionId,
        })),
      },
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  })

  await createAuditLog({
    performedBy: params.performedBy,
    action: 'ROLE_CREATE',
    targetType: 'Role',
    targetId: role.id,
    metadata: {
      name: role.name,
      permissionKeys: params.permissionKeys,
    },
  })

  return role
}

interface UpdateRoleParams {
  roleId: string
  name?: string
  description?: string
  permissionKeys?: string[]
  performedBy: string
}

export const updateRole = async (params: UpdateRoleParams) => {
  const role = await prisma.role.findUnique({
    where: { id: params.roleId },
  })

  if (!role) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'Role' },
    }
  }

  if (role.isSystem) {
    throw {
      statusCode: 403,
      message: 'Impossible de modifier un rôle système',
      code: 'FORBIDDEN',
    }
  }

  if (params.name && params.name !== role.name) {
    const existingRole = await prisma.role.findUnique({
      where: { name: params.name },
    })

    if (existingRole) {
      throw {
        statusCode: 409,
        message: ErrorMessages.ALREADY_EXISTS,
        code: 'ALREADY_EXISTS',
        details: { field: 'name' },
      }
    }
  }

  // Convert permission keys to IDs if provided
  let permissionIds: string[] | undefined
  if (params.permissionKeys) {
    const permissions = await prisma.permission.findMany({
      where: {
        key: {
          in: params.permissionKeys,
        },
      },
      select: { id: true, key: true },
    })

    if (permissions.length !== params.permissionKeys.length) {
      const foundKeys = permissions.map(p => p.key)
      const missingKeys = params.permissionKeys.filter(k => !foundKeys.includes(k))
      throw {
        statusCode: 400,
        message: 'Certaines clés de permission sont invalides',
        code: 'VALIDATION_ERROR',
        details: { invalidKeys: missingKeys },
      }
    }

    permissionIds = permissions.map(p => p.id)
  }

  const updatedRole = await prisma.role.update({
    where: { id: params.roleId },
    data: {
      name: params.name,
      description: params.description,
      ...(permissionIds && {
        permissions: {
          deleteMany: {},
          create: permissionIds.map((permissionId) => ({
            permissionId,
          })),
        },
      }),
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  })

  await createAuditLog({
    performedBy: params.performedBy,
    action: 'ROLE_UPDATE',
    targetType: 'Role',
    targetId: params.roleId,
    metadata: {
      changes: {
        name: params.name,
        description: params.description,
        permissionKeys: params.permissionKeys,
      },
    },
  })

  return updatedRole
}

export const deleteRole = async (roleId: string, performedBy: string) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      users: true,
    },
  })

  if (!role) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'Role' },
    }
  }

  if (role.isSystem) {
    throw {
      statusCode: 403,
      message: 'Impossible de supprimer un rôle système',
      code: 'FORBIDDEN',
    }
  }

  if (role.users.length > 0) {
    throw {
      statusCode: 400,
      message: 'Impossible de supprimer un rôle assigné à des utilisateurs',
      code: 'VALIDATION_ERROR',
      details: { usersCount: role.users.length },
    }
  }

  await prisma.role.delete({
    where: { id: roleId },
  })

  await createAuditLog({
    performedBy,
    action: 'ROLE_DELETE',
    targetType: 'Role',
    targetId: roleId,
    metadata: {
      name: role.name,
    },
  })
}

export const getRoles = async (includeSystem: boolean = true) => {
  return prisma.role.findMany({
    where: includeSystem ? undefined : { isSystem: false },
    orderBy: { name: 'asc' },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      users: {
        select: {
          userId: true,
        },
      },
    },
  })
}

export const getRoleById = async (roleId: string) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      users: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          section: true,
        },
      },
    },
  })

  if (!role) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'Role' },
    }
  }

  return role
}

interface AssignRoleParams {
  userId: string
  roleId: string
  sectionId?: string
  performedBy: string
}

export const assignRole = async (params: AssignRoleParams) => {
  const [user, role] = await Promise.all([
    prisma.user.findUnique({ where: { id: params.userId } }),
    prisma.role.findUnique({ where: { id: params.roleId } }),
  ])

  if (!user) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'User' },
    }
  }

  if (!role) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'Role' },
    }
  }

  const existingUserRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: params.userId,
        roleId: params.roleId,
      },
    },
  })

  if (existingUserRole) {
    throw {
      statusCode: 409,
      message: 'Ce rôle est déjà assigné à cet utilisateur',
      code: 'ALREADY_EXISTS',
    }
  }

  const userRole = await prisma.userRole.create({
    data: {
      userId: params.userId,
      roleId: params.roleId,
      sectionId: params.sectionId,
    },
    include: {
      role: true,
      section: true,
    },
  })

  await createAuditLog({
    userId: params.userId,
    performedBy: params.performedBy,
    action: 'ROLE_ASSIGN',
    targetType: 'UserRole',
    targetId: `${params.userId}-${params.roleId}`,
    metadata: {
      roleId: params.roleId,
      roleName: role.name,
      sectionId: params.sectionId,
    },
  })

  return userRole
}

interface RevokeRoleParams {
  userId: string
  roleId: string
  performedBy: string
}

export const revokeRole = async (params: RevokeRoleParams) => {
  const userRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: params.userId,
        roleId: params.roleId,
      },
    },
    include: {
      role: true,
    },
  })

  if (!userRole) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'UserRole' },
    }
  }

  // Prevent revocation of the default "Utilisateur" role (system role)
  if (userRole.role.name === 'Utilisateur' || (userRole.role.isSystem && userRole.role.name.toLowerCase() === 'utilisateur')) {
    throw {
      statusCode: 403,
      message: 'Impossible de révoquer le rôle Utilisateur. Tous les utilisateurs doivent avoir ce rôle.',
      code: 'CANNOT_REVOKE_DEFAULT_ROLE',
    }
  }

  // Ensure user has at least one role remaining
  const userRoleCount = await prisma.userRole.count({
    where: { userId: params.userId },
  })

  if (userRoleCount <= 1) {
    throw {
      statusCode: 403,
      message: 'Impossible de révoquer le dernier rôle d\'un utilisateur.',
      code: 'CANNOT_REVOKE_LAST_ROLE',
    }
  }

  await prisma.userRole.delete({
    where: {
      userId_roleId: {
        userId: params.userId,
        roleId: params.roleId,
      },
    },
  })

  await createAuditLog({
    userId: params.userId,
    performedBy: params.performedBy,
    action: 'ROLE_REVOKE',
    targetType: 'UserRole',
    targetId: `${params.userId}-${params.roleId}`,
    metadata: {
      roleId: params.roleId,
      roleName: userRole.role.name,
    },
  })
}

export const getUserRoles = async (userId: string) => {
  return prisma.userRole.findMany({
    where: { userId },
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
      section: true,
    },
  })
}
