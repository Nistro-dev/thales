// src/services/invitation.service.ts

import crypto from 'crypto'
import { prisma } from '../utils/prisma.js'
import { logger } from '../utils/logger.js'
import { sendInvitationEmail } from './email.service.js'
import { ErrorMessages } from '../utils/response.js'

const INVITATION_EXPIRY_DAYS = 7

export const createInvitation = async (
  email: string,
  invitedById: string
): Promise<{ id: string; email: string }> => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw { statusCode: 409, message: ErrorMessages.USER_ALREADY_EXISTS, code: 'ALREADY_EXISTS' }
  }

  const existingInvitation = await prisma.invitation.findUnique({
    where: { email },
  })

  if (existingInvitation && !existingInvitation.usedAt) {
    await prisma.invitation.delete({ where: { id: existingInvitation.id } })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  const invitation = await prisma.invitation.create({
    data: {
      email,
      token,
      invitedBy: invitedById,
      expiresAt,
    },
  })

  await sendInvitationEmail(email, token)

  logger.info({ email, invitedById }, 'Invitation sent')

  return { id: invitation.id, email: invitation.email }
}

export const validateInvitationToken = async (
  token: string
): Promise<{ valid: boolean; email?: string }> => {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  })

  if (!invitation) {
    return { valid: false }
  }

  if (invitation.usedAt) {
    return { valid: false }
  }

  if (invitation.expiresAt < new Date()) {
    return { valid: false }
  }

  return { valid: true, email: invitation.email }
}

export const completeRegistration = async (
  token: string,
  data: {
    firstName: string
    lastName: string
    password: string
    gdprConsent: boolean
  }
): Promise<{ id: string; email: string; firstName: string; lastName: string }> => {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  })

  if (!invitation) {
    throw { statusCode: 400, message: ErrorMessages.INVITATION_INVALID, code: 'VALIDATION_ERROR' }
  }

  if (invitation.usedAt) {
    throw { statusCode: 400, message: ErrorMessages.INVITATION_ALREADY_USED, code: 'VALIDATION_ERROR' }
  }

  if (invitation.expiresAt < new Date()) {
    throw { statusCode: 400, message: ErrorMessages.INVITATION_EXPIRED, code: 'VALIDATION_ERROR' }
  }

  if (!data.gdprConsent) {
    throw { statusCode: 400, message: ErrorMessages.GDPR_CONSENT_REQUIRED, code: 'VALIDATION_ERROR' }
  }

  const { hashPassword } = await import('../utils/password.js')
  const { env } = await import('../config/env.js')

  const hashedPassword = await hashPassword(data.password)

  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: invitation.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        status: 'ACTIVE',
        gdprConsentAt: new Date(),
        gdprVersion: env.GDPR_VERSION,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    }),
  ])

  logger.info({ userId: user.id, email: user.email }, 'User registered via invitation')

  return user
}

export const listPendingInvitations = async (): Promise<
  Array<{
    id: string
    email: string
    createdAt: Date
    expiresAt: Date
  }>
> => {
  return prisma.invitation.findMany({
    where: {
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export const cancelInvitation = async (id: string): Promise<void> => {
  const invitation = await prisma.invitation.findUnique({
    where: { id },
  })

  if (!invitation) {
    throw { statusCode: 404, message: ErrorMessages.INVITATION_NOT_FOUND, code: 'NOT_FOUND' }
  }

  if (invitation.usedAt) {
    throw { statusCode: 400, message: ErrorMessages.CANNOT_CANCEL_USED_INVITATION, code: 'VALIDATION_ERROR' }
  }

  await prisma.invitation.delete({ where: { id } })

  logger.info({ id, email: invitation.email }, 'Invitation cancelled')
}
