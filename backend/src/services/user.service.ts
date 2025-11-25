import { UserStatus, CautionStatus } from '@prisma/client'
import { prisma } from '../utils/prisma.js'
import { hashPassword } from '../utils/password.js'
import { ErrorMessages } from '../utils/response.js'
import { createAuditLog } from './audit.service.js'

interface CreateUserParams {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  performedBy: string
}

export const createUser = async (params: CreateUserParams) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: params.email },
  })

  if (existingUser) {
    throw {
      statusCode: 409,
      message: ErrorMessages.ALREADY_EXISTS,
      code: 'ALREADY_EXISTS',
      details: { field: 'email' },
    }
  }

  const hashedPassword = await hashPassword(params.password)

  // Get the default "User" role
  const userRole = await prisma.role.findUnique({
    where: { name: 'User' },
  })

  if (!userRole) {
    throw {
      statusCode: 500,
      message: 'Le rôle User par défaut est introuvable',
      code: 'INTERNAL_ERROR',
    }
  }

  const user = await prisma.user.create({
    data: {
      email: params.email,
      password: hashedPassword,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      status: UserStatus.ACTIVE,
      creditBalance: 0,
      cautionStatus: CautionStatus.PENDING,
      roles: {
        create: {
          roleId: userRole.id,
        },
      },
    },
  })

  await createAuditLog({
    userId: user.id,
    performedBy: params.performedBy,
    action: 'USER_CREATE',
    targetType: 'User',
    targetId: user.id,
    metadata: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  })

  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

interface UpdateUserParams {
  userId: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  performedBy: string
}

export const updateUser = async (params: UpdateUserParams) => {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
  })

  if (!user) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'User' },
    }
  }

  if (params.email && params.email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: params.email },
    })

    if (existingUser) {
      throw {
        statusCode: 409,
        message: ErrorMessages.ALREADY_EXISTS,
        code: 'ALREADY_EXISTS',
        details: { field: 'email' },
      }
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: params.userId },
    data: {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
    },
  })

  await createAuditLog({
    userId: params.userId,
    performedBy: params.performedBy,
    action: 'USER_UPDATE',
    targetType: 'User',
    targetId: params.userId,
    metadata: {
      changes: {
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        phone: params.phone,
      },
    },
  })

  const { password: _, ...userWithoutPassword } = updatedUser
  return userWithoutPassword
}

export const deleteUser = async (userId: string, performedBy: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'User' },
    }
  }

  // Soft delete: set status to DISABLED instead of deleting
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: UserStatus.DISABLED },
  })

  await createAuditLog({
    userId,
    performedBy,
    action: 'USER_DELETE',
    targetType: 'User',
    targetId: userId,
    metadata: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      previousStatus: user.status,
    },
  })

  const { password: _, ...userWithoutPassword } = updatedUser
  return userWithoutPassword
}

interface GetUsersParams {
  status?: UserStatus
  cautionStatus?: CautionStatus
  search?: string
  page?: number
  limit?: number
}

export const getUsers = async (params: GetUsersParams) => {
  const page = params.page || 1
  const limit = params.limit || 50
  const skip = (page - 1) * limit

  const where: any = {}

  if (params.status) {
    where.status = params.status
  }

  if (params.cautionStatus) {
    where.cautionStatus = params.cautionStatus
  }

  if (params.search) {
    where.OR = [
      { email: { contains: params.search, mode: 'insensitive' } },
      { firstName: { contains: params.search, mode: 'insensitive' } },
      { lastName: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        creditBalance: true,
        cautionStatus: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      status: true,
      creditBalance: true,
      cautionStatus: true,
      gdprConsentAt: true,
      gdprVersion: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      password: false, // Explicitly exclude password
      roles: {
        include: {
          role: true,
          section: true,
        },
      },
    },
  })

  if (!user) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'User' },
    }
  }

  return user
}

export const changeUserStatus = async (
  userId: string,
  status: UserStatus,
  performedBy: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'User' },
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status },
  })

  await createAuditLog({
    userId,
    performedBy,
    action: 'USER_STATUS_CHANGE',
    targetType: 'User',
    targetId: userId,
    metadata: {
      previousStatus: user.status,
      newStatus: status,
    },
  })

  const { password: _, ...userWithoutPassword } = updatedUser
  return userWithoutPassword
}

export const validateCaution = async (userId: string, performedBy: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'User' },
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { cautionStatus: CautionStatus.VALIDATED },
  })

  await createAuditLog({
    userId,
    performedBy,
    action: 'CAUTION_VALIDATE',
    targetType: 'User',
    targetId: userId,
    metadata: {
      previousStatus: user.cautionStatus,
    },
  })

  const { password: _, ...userWithoutPassword } = updatedUser
  return userWithoutPassword
}

export const exemptCaution = async (userId: string, performedBy: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'User' },
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { cautionStatus: CautionStatus.EXEMPTED },
  })

  await createAuditLog({
    userId,
    performedBy,
    action: 'CAUTION_EXEMPT',
    targetType: 'User',
    targetId: userId,
    metadata: {
      previousStatus: user.cautionStatus,
    },
  })

  const { password: _, ...userWithoutPassword } = updatedUser
  return userWithoutPassword
}

export const resetCaution = async (userId: string, performedBy: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'User' },
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { cautionStatus: CautionStatus.PENDING },
  })

  await createAuditLog({
    userId,
    performedBy,
    action: 'CAUTION_RESET',
    targetType: 'User',
    targetId: userId,
    metadata: {
      previousStatus: user.cautionStatus,
    },
  })

  const { password: _, ...userWithoutPassword } = updatedUser
  return userWithoutPassword
}
