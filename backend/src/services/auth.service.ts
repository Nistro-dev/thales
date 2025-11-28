import { prisma } from '../utils/prisma.js'
import { comparePassword, hashPassword } from '../utils/password.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } from '../utils/jwt.js'
import { logger } from '../utils/logger.js'
import { ErrorMessages } from '../utils/response.js'
import type { LoginInput, ChangePasswordInput } from '../schemas/auth.js'
import type { UserStatus } from '@prisma/client'

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface RoleWithPermissions {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: string[]
  createdAt: Date
  updatedAt: Date
}

interface GetMeResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  status: UserStatus
  credits: number
  cautionPaid: boolean
  roles: RoleWithPermissions[]
  createdAt: Date
  updatedAt: Date
}

export const login = async (
  data: LoginInput
): Promise<{ user: GetMeResponse; tokens: AuthTokens }> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (!user) {
    throw { statusCode: 401, message: ErrorMessages.INVALID_CREDENTIALS, code: 'INVALID_CREDENTIALS' }
  }

  const isValidPassword = await comparePassword(data.password, user.password)

  if (!isValidPassword) {
    throw { statusCode: 401, message: ErrorMessages.INVALID_CREDENTIALS, code: 'INVALID_CREDENTIALS' }
  }

  if (user.status === 'SUSPENDED') {
    throw { statusCode: 403, message: ErrorMessages.ACCOUNT_SUSPENDED, code: 'ACCOUNT_SUSPENDED' }
  }

  if (user.status === 'DISABLED') {
    throw { statusCode: 403, message: ErrorMessages.ACCOUNT_DISABLED, code: 'ACCOUNT_DISABLED' }
  }

  const tokens = await generateTokens(user.id, user.email)

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  logger.info({ userId: user.id }, 'User logged in')

  // Get complete user data with role and permissions
  const userData = await getMe(user.id)

  return {
    user: userData,
    tokens,
  }
}

export const refresh = async (refreshToken: string): Promise<AuthTokens> => {
  const payload = verifyRefreshToken(refreshToken)

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  })

  if (!storedToken) {
    throw { statusCode: 401, message: ErrorMessages.INVALID_TOKEN, code: 'INVALID_TOKEN' }
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } })
    throw { statusCode: 401, message: ErrorMessages.TOKEN_EXPIRED, code: 'TOKEN_EXPIRED' }
  }

  if (storedToken.user.status !== 'ACTIVE') {
    throw { statusCode: 403, message: ErrorMessages.FORBIDDEN, code: 'FORBIDDEN' }
  }

  await prisma.refreshToken.delete({ where: { id: storedToken.id } })

  const tokens = await generateTokens(payload.userId, payload.email)

  logger.info({ userId: payload.userId }, 'Token refreshed')

  return tokens
}

export const logout = async (refreshToken: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  })

  logger.info('User logged out')
}

export const logoutAll = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  })

  logger.info({ userId }, 'User logged out from all devices')
}

export const getMe = async (userId: string): Promise<GetMeResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              isSystem: true,
              permissions: {
                select: {
                  permission: {
                    select: {
                      key: true,
                    },
                  },
                },
              },
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    throw { statusCode: 404, message: ErrorMessages.USER_NOT_FOUND, code: 'NOT_FOUND' }
  }

  // Map all roles with their permissions as flat arrays
  const mappedRoles: RoleWithPermissions[] = user.roles.map(userRole => ({
    id: userRole.role.id,
    name: userRole.role.name,
    description: userRole.role.description,
    isSystem: userRole.role.isSystem,
    permissions: userRole.role.permissions.map((p: any) => p.permission.key),
    createdAt: userRole.role.createdAt,
    updatedAt: userRole.role.updatedAt,
  }))

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    credits: user.creditBalance,
    cautionPaid: user.cautionStatus === 'VALIDATED',
    roles: mappedRoles,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

const generateTokens = async (userId: string, email: string): Promise<AuthTokens> => {
  const accessToken = generateAccessToken({ userId, email })
  const refreshToken = generateRefreshToken({ userId, email })

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: getRefreshTokenExpiry(),
    },
  })

  return { accessToken, refreshToken }
}

export const changePassword = async (userId: string, data: ChangePasswordInput): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw { statusCode: 404, message: ErrorMessages.USER_NOT_FOUND, code: 'NOT_FOUND' }
  }

  const isValidPassword = await comparePassword(data.currentPassword, user.password)

  if (!isValidPassword) {
    throw { statusCode: 400, message: 'Mot de passe actuel incorrect', code: 'INVALID_PASSWORD' }
  }

  const hashedPassword = await hashPassword(data.newPassword)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })

  // Invalidate all refresh tokens to force re-login on other devices
  await prisma.refreshToken.deleteMany({
    where: { userId },
  })

  logger.info({ userId }, 'Password changed')
}
