// src/services/movement.service.ts

import { prisma } from '../utils/prisma.js'
import type { ProductCondition, MovementType } from '@prisma/client'

interface MovementPhotoData {
  s3Key: string
  filename: string
  mimeType: string
  size: number
  caption?: string
}

interface CreateMovementParams {
  productId: string
  reservationId?: string
  type: MovementType
  condition?: ProductCondition
  notes?: string
  photos?: MovementPhotoData[]
  performedBy: string
}

export const createMovement = async (params: CreateMovementParams) => {
  const { productId, reservationId, type, condition = 'OK', notes, photos, performedBy } = params

  const [movement] = await prisma.$transaction([
    prisma.productMovement.create({
      data: {
        productId,
        reservationId,
        type,
        condition,
        notes,
        performedBy,
        performedAt: new Date(),
        photos: photos
          ? {
              create: photos.map((photo, index) => ({
                s3Key: photo.s3Key,
                filename: photo.filename,
                mimeType: photo.mimeType,
                size: photo.size,
                sortOrder: index,
                caption: photo.caption,
              })),
            }
          : undefined,
      },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
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
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
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
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  const movements = await prisma.productMovement.findMany({
    where: { productId },
    include: {
      photos: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { performedAt: 'desc' },
    take: 50,
  })

  // Récupérer les infos des utilisateurs qui ont effectué les mouvements (performedBy)
  const performedByIds = [...new Set(movements.map(m => m.performedBy).filter(Boolean))]
  const performedByUsers = await prisma.user.findMany({
    where: { id: { in: performedByIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  const performedByMap = new Map(performedByUsers.map(u => [u.id, u]))

  // Récupérer les réservations liées aux mouvements
  const reservationIds = [...new Set(movements.map(m => m.reservationId).filter((id): id is string => !!id))]
  const reservations = reservationIds.length > 0
    ? await prisma.reservation.findMany({
        where: { id: { in: reservationIds } },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })
    : []
  const reservationMap = new Map(reservations.map(r => [r.id, r]))

  return movements.map(m => ({
    ...m,
    performedByUser: performedByMap.get(m.performedBy) || null,
    reservation: m.reservationId ? reservationMap.get(m.reservationId) || null : null,
  }))
}
