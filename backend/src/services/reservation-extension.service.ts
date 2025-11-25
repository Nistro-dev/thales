// src/services/reservation-extension.service.ts

import { prisma } from '../utils/prisma.js'
import { logAudit } from './audit.service.js'
import * as notificationHelper from './notification-helper.service.js'
import { FastifyRequest } from 'fastify'

const startOfDay = (date: Date): Date => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// ============================================
// CHECK IF EXTENSION IS POSSIBLE
// ============================================

interface CheckExtensionParams {
  reservationId: string
  newEndDate: string
}

export const checkExtensionPossible = async (params: CheckExtensionParams) => {
  const { reservationId, newEndDate } = params

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          priceCredits: true,
          section: {
            select: {
              allowedDaysOut: true,
            },
          },
        },
      },
      user: { select: { id: true, creditBalance: true } },
    },
  })

  if (!reservation) {
    return {
      possible: false,
      reason: 'Réservation introuvable',
      code: 'NOT_FOUND',
    }
  }

  if (reservation.status !== 'CHECKED_OUT') {
    return {
      possible: false,
      reason: 'Seules les réservations en cours peuvent être prolongées',
      code: 'INVALID_STATUS',
    }
  }

  const newEnd = startOfDay(new Date(newEndDate))
  const currentEnd = startOfDay(reservation.endDate)

  if (newEnd <= currentEnd) {
    return {
      possible: false,
      reason: 'La nouvelle date doit être après la date de fin actuelle',
      code: 'INVALID_DATE',
    }
  }

  // Check if new end date day is allowed for returns
  const newEndDayOfWeek = newEnd.getDay()
  const allowedDaysOut = reservation.product.section.allowedDaysOut

  if (allowedDaysOut && allowedDaysOut.length > 0) {
    if (!allowedDaysOut.includes(newEndDayOfWeek)) {
      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
      const allowedDayNames = allowedDaysOut.map((day) => dayNames[day]).join(', ')
      return {
        possible: false,
        reason: `La date de fin doit être un ${allowedDayNames}`,
        code: 'INVALID_RETURN_DAY',
        allowedDays: allowedDaysOut,
      }
    }
  }

  // Calculate extension duration and cost
  const extensionDays = Math.ceil((newEnd.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24))
  const extensionCost = reservation.product.priceCredits * extensionDays

  // Check user has enough credits
  if (reservation.user.creditBalance < extensionCost) {
    return {
      possible: false,
      reason: `Crédits insuffisants`,
      code: 'INSUFFICIENT_CREDITS',
      cost: extensionCost,
      balance: reservation.user.creditBalance,
      missing: extensionCost - reservation.user.creditBalance,
    }
  }

  // Check no conflict with other reservations
  const conflicts = await prisma.reservation.findMany({
    where: {
      productId: reservation.productId,
      status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
      id: { not: reservationId },
      OR: [
        {
          startDate: { lte: newEnd },
          endDate: { gte: currentEnd },
        },
      ],
    },
  })

  if (conflicts.length > 0) {
    return {
      possible: false,
      reason: 'Le produit est déjà réservé sur cette période',
      code: 'RESERVATION_CONFLICT',
      conflicts: conflicts.map((c) => ({
        startDate: c.startDate,
        endDate: c.endDate,
      })),
    }
  }

  return {
    possible: true,
    cost: extensionCost,
    days: extensionDays,
    newEndDate: newEnd,
  }
}

// ============================================
// EXTEND RESERVATION (Automatic)
// ============================================

interface ExtendReservationParams {
  reservationId: string
  userId: string
  newEndDate: string
  request?: FastifyRequest
}

export const extendReservation = async (params: ExtendReservationParams) => {
  const { reservationId, userId, newEndDate } = params

  // First check if extension is possible
  const check = await checkExtensionPossible({ reservationId, newEndDate })

  if (!check.possible) {
    throw {
      statusCode: check.code === 'NOT_FOUND' ? 404 : 400,
      message: check.reason,
      code: check.code,
      details: check,
    }
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      product: { select: { id: true, name: true, priceCredits: true } },
      user: { select: { id: true, creditBalance: true, email: true, firstName: true, lastName: true } },
    },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Réservation introuvable', code: 'NOT_FOUND' }
  }

  if (reservation.userId !== userId) {
    throw {
      statusCode: 403,
      message: 'Vous ne pouvez prolonger que vos propres réservations',
      code: 'FORBIDDEN',
    }
  }

  const extensionCost = check.cost!
  const newBalance = reservation.user.creditBalance - extensionCost
  const newEnd = check.newEndDate!

  // Apply extension immediately
  const [updated] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: {
        endDate: newEnd,
        creditsCharged: reservation.creditsCharged + extensionCost,
        totalExtensionCost: reservation.totalExtensionCost + extensionCost,
        extensionCount: reservation.extensionCount + 1,
      },
      include: {
        product: { select: { name: true, reference: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.user.update({
      where: { id: reservation.userId },
      data: { creditBalance: newBalance },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: reservation.userId,
        amount: -extensionCost,
        balanceAfter: newBalance,
        type: 'RESERVATION',
        reason: `Prolongation de réservation: ${reservation.product.name}`,
        performedBy: userId,
        reservationId,
      },
    }),
  ])

  await logAudit({
    userId: reservation.userId,
    performedBy: userId,
    action: 'RESERVATION_EXTEND',
    targetType: 'Reservation',
    targetId: reservationId,
    metadata: {
      originalEndDate: reservation.endDate.toISOString(),
      newEndDate: newEnd.toISOString(),
      extensionDays: check.days,
      extensionCost,
    },
  })

  // Send notification
  await notificationHelper.sendExtensionConfirmedNotification(
    reservation.userId,
    reservationId,
    reservation.product.name,
    newEnd.toLocaleDateString('fr-FR'),
    extensionCost
  )

  return updated
}
