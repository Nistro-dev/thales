import crypto from 'crypto'
import { prisma } from '../utils/prisma.js'
import { hashPassword } from '../utils/password.js'
import { sendPasswordResetEmail } from './email.service.js'
import { logger } from '../utils/logger.js'
import { ErrorMessages } from '../utils/response.js'

const RESET_TOKEN_EXPIRY_HOURS = 1

export const requestPasswordReset = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, email: true },
  })

  if (!user) {
    logger.info({ email }, 'Password reset requested for non-existent email')
    return
  }

  await prisma.passwordReset.deleteMany({
    where: { userId: user.id },
  })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  await prisma.passwordReset.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  })

  await sendPasswordResetEmail(user.email, token, user.firstName)

  logger.info({ userId: user.id }, 'Password reset email sent')
}

export const validateResetToken = async (token: string): Promise<{ valid: boolean; email?: string }> => {
  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: { select: { email: true } } },
  })

  if (!resetRecord) {
    return { valid: false }
  }

  if (resetRecord.usedAt) {
    return { valid: false }
  }

  if (resetRecord.expiresAt < new Date()) {
    return { valid: false }
  }

  return { valid: true, email: resetRecord.user.email }
}

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!resetRecord) {
    throw { statusCode: 400, message: ErrorMessages.RESET_TOKEN_INVALID, code: 'VALIDATION_ERROR' }
  }

  if (resetRecord.usedAt) {
    throw { statusCode: 400, message: ErrorMessages.RESET_TOKEN_USED, code: 'VALIDATION_ERROR' }
  }

  if (resetRecord.expiresAt < new Date()) {
    throw { statusCode: 400, message: ErrorMessages.RESET_TOKEN_EXPIRED, code: 'VALIDATION_ERROR' }
  }

  const hashedPassword = await hashPassword(newPassword)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.deleteMany({
      where: { userId: resetRecord.userId },
    }),
  ])

  logger.info({ userId: resetRecord.userId }, 'Password reset completed')
}