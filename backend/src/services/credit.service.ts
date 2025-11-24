import { CreditTransactionType } from '@prisma/client'
import { prisma } from '../utils/prisma.js'
import { ErrorMessages } from '../utils/response.js'
import { createAuditLog } from './audit.service.js'

interface AdjustCreditsParams {
  userId: string
  amount: number
  reason?: string
  performedBy: string
  metadata?: Record<string, any>
}

/**
 * Adjusts user credits (can be positive or negative)
 */
export const adjustCredits = async (params: AdjustCreditsParams) => {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, creditBalance: true },
  })

  if (!user) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'User' },
    }
  }

  const newBalance = user.creditBalance + params.amount

  if (newBalance < 0) {
    throw {
      statusCode: 400,
      message: 'Solde de crédits insuffisant',
      code: 'VALIDATION_ERROR',
      details: { currentBalance: user.creditBalance, requestedAmount: params.amount },
    }
  }

  const [updatedUser, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: params.userId },
      data: { creditBalance: newBalance },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: params.userId,
        amount: params.amount,
        balanceAfter: newBalance,
        type: CreditTransactionType.ADJUSTMENT,
        reason: params.reason,
        performedBy: params.performedBy,
        metadata: params.metadata,
      },
    }),
  ])

  await createAuditLog({
    userId: params.userId,
    performedBy: params.performedBy,
    action: 'CREDIT_ADJUST',
    targetType: 'CreditTransaction',
    targetId: transaction.id,
    metadata: {
      amount: params.amount,
      balanceAfter: newBalance,
      reason: params.reason,
    },
  })

  return { user: updatedUser, transaction }
}

interface GetTransactionsParams {
  userId: string
  page?: number
  limit?: number
}

/**
 * Gets credit transaction history for a user
 */
export const getUserTransactions = async (params: GetTransactionsParams) => {
  const page = params.page || 1
  const limit = params.limit || 50
  const skip = (page - 1) * limit

  const [transactions, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { userId: params.userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.creditTransaction.count({
      where: { userId: params.userId },
    }),
  ])

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Gets a single transaction by ID
 */
export const getTransactionById = async (transactionId: string) => {
  const transaction = await prisma.creditTransaction.findUnique({
    where: { id: transactionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  if (!transaction) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'CreditTransaction' },
    }
  }

  return transaction
}

/**
 * Gets user's current credit balance
 */
export const getUserBalance = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  })

  if (!user) {
    throw {
      statusCode: 404,
      message: ErrorMessages.NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource: 'User' },
    }
  }

  return user.creditBalance
}
