import { AuditAction } from '@prisma/client'
import { prisma } from '../utils/prisma.js'

interface CreateAuditLogParams {
  userId?: string
  performedBy?: string
  action: AuditAction
  targetType?: string
  targetId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export const createAuditLog = async (params: CreateAuditLogParams) => {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      performedBy: params.performedBy,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  })
}

interface GetAuditLogsParams {
  userId?: string
  performedBy?: string
  action?: AuditAction
  targetType?: string
  targetId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

export const getAuditLogs = async (params: GetAuditLogsParams) => {
  const page = params.page || 1
  const limit = params.limit || 50
  const skip = (page - 1) * limit

  const where: any = {}

  if (params.userId) {
    where.userId = params.userId
  }

  if (params.performedBy) {
    where.performedBy = params.performedBy
  }

  if (params.action) {
    where.action = params.action
  }

  if (params.targetType) {
    where.targetType = params.targetType
  }

  if (params.targetId) {
    where.targetId = params.targetId
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) {
      where.createdAt.gte = params.startDate
    }
    if (params.endDate) {
      where.createdAt.lte = params.endDate
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        performer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export const getAuditLogById = async (id: string) => {
  return prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      performer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

// Alias pour compatibilité
export const logAudit = createAuditLog
