// src/services/movement.service.ts

import { prisma } from '../utils/prisma.js'
import type { ProductCondition, MovementType } from '@prisma/client'

interface CreateMovementParams {
  productId: string
  reservationId: string
  type: MovementType
  condition?: ProductCondition
  notes?: string
  photoKey?: string
  performedBy: string
}

export const createMovement = async (params: CreateMovementParams) => {
  const { productId, reservationId, type, condition = 'OK', notes, photoKey, performedBy } = params

  const [movement] = await prisma.$transaction([
    prisma.productMovement.create({
      data: {
        productId,
        reservationId,
        type,
        condition,
        notes,
        photoKey,
        performedBy,
        performedAt: new Date(),
      },
    }),
    prisma.product.update({
      where: { id: productId },
      data: {
        lastCondition: condition,
        lastMovementAt: new Date(),
      },
    }),
  ])

  return movement
}

interface ListMovementsParams {
  page: number
  limit: number
  productId?: string
  reservationId?: string
  type?: MovementType
  sortOrder?: 'asc' | 'desc'
}

export const listMovements = async (params: ListMovementsParams) => {
  const { page, limit, productId, reservationId, type, sortOrder = 'desc' } = params

  const where: any = {}

  if (productId) where.productId = productId
  if (reservationId) where.reservationId = reservationId
  if (type) where.type = type

  const [movements, total] = await Promise.all([
    prisma.productMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, reference: true } },
      },
      orderBy: { performedAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.productMovement.count({ where }),
  ])

  return { movements, total }
}

export const getProductMovements = async (productId: string) => {
  const product = await prisma.product.findUnique({ where: { id: productId } })

  if (!product) {
    throw { statusCode: 404, message: 'Product not found', code: 'NOT_FOUND' }
  }

  return prisma.productMovement.findMany({
    where: { productId },
    orderBy: { performedAt: 'desc' },
    take: 50,
  })
}
