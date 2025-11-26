// src/services/reservation.service.ts

import { prisma } from '../utils/prisma.js'
import { logAudit } from './audit.service.js'
import { createMovement } from './movement.service.js'
import { generateReservationQRCode } from '../utils/qrCode.js'
import { FastifyRequest } from 'fastify'
import type { ReservationStatus, ProductCondition } from '@prisma/client'
import * as notificationHelper from './notification-helper.service.js'

// ============================================
// HELPERS
// ============================================

const startOfDay = (date: Date): Date => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const getDayOfWeek = (date: Date): number => {
  return date.getDay()
}

const daysBetween = (start: Date, end: Date): number => {
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// ============================================
// VALIDATION
// ============================================

interface ValidationResult {
  valid: boolean
  error?: string
  code?: string
}

export const validateUserCanReserve = async (userId: string): Promise<ValidationResult> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, cautionStatus: true, creditBalance: true },
  })

  if (!user) {
    return { valid: false, error: 'Utilisateur introuvable', code: 'NOT_FOUND' }
  }

  if (user.status !== 'ACTIVE') {
    return { valid: false, error: 'Votre compte n\'est pas actif', code: 'FORBIDDEN' }
  }

  if (user.cautionStatus !== 'VALIDATED' && user.cautionStatus !== 'EXEMPTED') {
    return {
      valid: false,
      error: 'Votre caution doit être validée pour effectuer des réservations',
      code: 'FORBIDDEN',
    }
  }

  return { valid: true }
}

export const validateProductAvailable = async (productId: string): Promise<ValidationResult> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, status: true, name: true },
  })

  if (!product) {
    return { valid: false, error: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  if (product.status !== 'AVAILABLE') {
    return {
      valid: false,
      error: `Le produit "${product.name}" n'est pas disponible pour la réservation`,
      code: 'VALIDATION_ERROR',
    }
  }

  return { valid: true }
}

export const validateDates = async (
  productId: string,
  startDate: Date,
  endDate: Date,
  isAdmin: boolean = false
): Promise<ValidationResult> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { section: true },
  })

  if (!product) {
    return { valid: false, error: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  const today = startOfDay(new Date())

  if (!isAdmin && startDate < today) {
    return { valid: false, error: 'La date de sortie ne peut pas être dans le passé', code: 'VALIDATION_ERROR' }
  }

  if (endDate < startDate) {
    return { valid: false, error: 'La date de retour doit être après la date de sortie', code: 'VALIDATION_ERROR' }
  }

  const duration = daysBetween(startDate, endDate) + 1

  if (duration < product.minDuration) {
    return {
      valid: false,
      error: `La durée minimale de réservation est de ${product.minDuration} jour(s)`,
      code: 'VALIDATION_ERROR',
    }
  }

  if (duration > product.maxDuration) {
    return {
      valid: false,
      error: `La durée maximale de réservation est de ${product.maxDuration} jour(s)`,
      code: 'VALIDATION_ERROR',
    }
  }

  const startDayOfWeek = getDayOfWeek(startDate)
  const endDayOfWeek = getDayOfWeek(endDate)

  if (!product.section.allowedDaysOut.includes(startDayOfWeek)) {
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    return {
      valid: false,
      error: `Le retrait n'est pas autorisé le ${dayNames[startDayOfWeek]} pour ce produit`,
      code: 'VALIDATION_ERROR',
    }
  }

  if (!product.section.allowedDaysIn.includes(endDayOfWeek)) {
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    return {
      valid: false,
      error: `Le retour n'est pas autorisé le ${dayNames[endDayOfWeek]} pour ce produit`,
      code: 'VALIDATION_ERROR',
    }
  }

  return { valid: true }
}

export const validateNoConflict = async (
  productId: string,
  startDate: Date,
  endDate: Date,
  excludeReservationId?: string
): Promise<ValidationResult> => {
  const conflictWhere: any = {
    productId,
    status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
    OR: [
      {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    ],
  }

  if (excludeReservationId) {
    conflictWhere.id = { not: excludeReservationId }
  }

  const conflict = await prisma.reservation.findFirst({ where: conflictWhere })

  if (conflict) {
    return {
      valid: false,
      error: 'Le produit est déjà réservé pour cette période',
      code: 'CONFLICT',
    }
  }

  return { valid: true }
}

export const validateUserCredits = async (
  userId: string,
  amount: number
): Promise<ValidationResult> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  })

  if (!user) {
    return { valid: false, error: 'Utilisateur introuvable', code: 'NOT_FOUND' }
  }

  if (user.creditBalance < amount) {
    return {
      valid: false,
      error: `Crédits insuffisants. Vous avez ${user.creditBalance} crédits mais ${amount} sont nécessaires`,
      code: 'VALIDATION_ERROR',
    }
  }

  return { valid: true }
}

// ============================================
// CREATE RESERVATION
// ============================================

interface CreateReservationParams {
  userId: string
  productId: string
  startDate: string
  endDate: string
  notes?: string
  adminNotes?: string
  createdBy: string
  isAdmin?: boolean
  request?: FastifyRequest
}

export const createReservation = async (params: CreateReservationParams) => {
  const {
    userId,
    productId,
    startDate,
    endDate,
    notes,
    adminNotes,
    createdBy,
    isAdmin = false,
    request: _request,
  } = params

  const start = startOfDay(new Date(startDate))
  const end = startOfDay(new Date(endDate))

  const userValidation = await validateUserCanReserve(userId)
  if (!userValidation.valid) {
    throw { statusCode: 403, message: userValidation.error, code: userValidation.code }
  }

  const productValidation = await validateProductAvailable(productId)
  if (!productValidation.valid) {
    throw { statusCode: 400, message: productValidation.error, code: productValidation.code }
  }

  const dateValidation = await validateDates(productId, start, end, isAdmin)
  if (!dateValidation.valid) {
    throw { statusCode: 400, message: dateValidation.error, code: dateValidation.code }
  }

  const conflictValidation = await validateNoConflict(productId, start, end)
  if (!conflictValidation.valid) {
    throw { statusCode: 409, message: conflictValidation.error, code: conflictValidation.code }
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { priceCredits: true, name: true },
  })

  if (!product) {
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  const creditValidation = await validateUserCredits(userId, product.priceCredits)
  if (!creditValidation.valid) {
    throw { statusCode: 400, message: creditValidation.error, code: creditValidation.code }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  })

  const newBalance = user!.creditBalance - product.priceCredits

  const [reservation] = await prisma.$transaction([
    prisma.reservation.create({
      data: {
        userId,
        productId,
        startDate: start,
        endDate: end,
        status: 'CONFIRMED',
        creditsCharged: product.priceCredits,
        notes,
        adminNotes,
        createdBy,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        product: { select: { id: true, name: true, reference: true } },
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { creditBalance: newBalance },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: -product.priceCredits,
        balanceAfter: newBalance,
        type: 'RESERVATION',
        reason: `Reservation: ${product.name}`,
        performedBy: createdBy,
      },
    }),
  ])

  // Generate and save QR code for the reservation
  const qrCode = generateReservationQRCode(reservation.id, userId)
  const reservationWithQR = await prisma.reservation.update({
    where: { id: reservation.id },
    data: { qrCode },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      product: { select: { id: true, name: true, reference: true } },
    },
  })

  await logAudit({
    userId,
    performedBy: createdBy,
    action: 'RESERVATION_CREATE',
    targetType: 'Reservation',
    targetId: reservation.id,
    metadata: {
      productId,
      productName: product.name,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      creditsCharged: product.priceCredits,
    },
  })

  // Send notifications
  await notificationHelper.sendReservationConfirmedNotification(
    userId,
    reservation.id,
    product.name,
    start.toLocaleDateString('fr-FR'),
    end.toLocaleDateString('fr-FR')
  )

  return reservationWithQR
}

// ============================================
// LIST RESERVATIONS
// ============================================

interface ListReservationsParams {
  page: number
  limit: number
  status?: ReservationStatus
  userId?: string
  productId?: string
  startDateFrom?: string
  startDateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const listReservations = async (params: ListReservationsParams, forUserId?: string) => {
  const {
    page,
    limit,
    status,
    userId,
    productId,
    startDateFrom,
    startDateTo,
    sortBy = 'startDate',
    sortOrder = 'asc',
  } = params

  const where: any = {}

  if (forUserId) {
    where.userId = forUserId
  } else if (userId) {
    where.userId = userId
  }

  if (status) {
    where.status = status
  }

  if (productId) {
    where.productId = productId
  }

  if (startDateFrom || startDateTo) {
    where.startDate = {}
    if (startDateFrom) where.startDate.gte = new Date(startDateFrom)
    if (startDateTo) where.startDate.lte = new Date(startDateTo)
  }

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        product: {
          select: {
            id: true,
            name: true,
            reference: true,
            section: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reservation.count({ where }),
  ])

  return { reservations, total }
}

// ============================================
// GET RESERVATION
// ============================================

export const getReservationById = async (id: string, userId?: string) => {
  const where: any = { id }

  if (userId) {
    where.userId = userId
  }

  const reservation = await prisma.reservation.findFirst({
    where,
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      product: {
        include: {
          section: { select: { id: true, name: true } },
          subSection: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Réservation introuvable', code: 'NOT_FOUND' }
  }

  return reservation
}

// ============================================
// CANCEL RESERVATION
// ============================================

interface CancelReservationParams {
  reservationId: string
  userId: string
  isAdmin: boolean
  reason?: string
  request?: FastifyRequest
}

export const cancelReservation = async (params: CancelReservationParams) => {
  const { reservationId, userId, isAdmin, reason, request: _request } = params

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { product: { select: { name: true } } },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Reservation not found', code: 'NOT_FOUND' }
  }

  if (!isAdmin && reservation.userId !== userId) {
    throw {
      statusCode: 403,
      message: 'You can only cancel your own reservations',
      code: 'FORBIDDEN',
    }
  }

  if (reservation.status === 'CANCELLED') {
    throw { statusCode: 400, message: 'Reservation is already cancelled', code: 'VALIDATION_ERROR' }
  }

  if (reservation.status === 'RETURNED') {
    throw {
      statusCode: 400,
      message: 'Cannot cancel a completed reservation',
      code: 'VALIDATION_ERROR',
    }
  }

  if (!isAdmin && reservation.status === 'CHECKED_OUT') {
    throw {
      statusCode: 400,
      message: 'Cannot cancel a reservation after checkout. Contact an administrator.',
      code: 'VALIDATION_ERROR',
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: reservation.userId },
    select: { creditBalance: true },
  })

  const newBalance = user!.creditBalance + reservation.creditsCharged

  const [updatedReservation] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
        cancelledBy: userId,
        refundedAt: new Date(),
        refundedBy: userId,
        refundAmount: reservation.creditsCharged,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        product: { select: { id: true, name: true } },
      },
    }),
    prisma.user.update({
      where: { id: reservation.userId },
      data: { creditBalance: newBalance },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: reservation.userId,
        amount: reservation.creditsCharged,
        balanceAfter: newBalance,
        type: 'REFUND',
        reason: `Cancellation: ${reservation.product.name}`,
        performedBy: userId,
        reservationId,
      },
    }),
  ])

  await logAudit({
    userId: reservation.userId,
    performedBy: userId,
    action: 'RESERVATION_CANCEL',
    targetType: 'Reservation',
    targetId: reservationId,
    metadata: {
      reason,
      refundAmount: reservation.creditsCharged,
      previousStatus: reservation.status,
    },
  })

  // Send notifications
  await notificationHelper.sendReservationCancelledNotification(
    reservation.userId,
    reservationId,
    reservation.product.name,
    reason
  )

  return updatedReservation
}

// ============================================
// REFUND (Admin only - without cancellation)
// ============================================

interface RefundReservationParams {
  reservationId: string
  adminId: string
  amount?: number
  reason?: string
  request?: FastifyRequest
}

export const refundReservation = async (params: RefundReservationParams) => {
  const { reservationId, adminId, amount, reason, request: _request } = params

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { product: { select: { name: true } } },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Reservation not found', code: 'NOT_FOUND' }
  }

  if (reservation.refundedAt) {
    throw {
      statusCode: 400,
      message: 'Reservation has already been refunded',
      code: 'VALIDATION_ERROR',
    }
  }

  const refundAmount = amount ?? reservation.creditsCharged

  if (refundAmount > reservation.creditsCharged) {
    throw {
      statusCode: 400,
      message: 'Refund amount cannot exceed charged amount',
      code: 'VALIDATION_ERROR',
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: reservation.userId },
    select: { creditBalance: true },
  })

  const newBalance = user!.creditBalance + refundAmount

  const [updatedReservation] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundedBy: adminId,
        refundAmount,
        adminNotes: reservation.adminNotes
          ? `${reservation.adminNotes}\n[REFUND] ${reason || 'No reason provided'}`
          : `[REFUND] ${reason || 'No reason provided'}`,
      },
    }),
    prisma.user.update({
      where: { id: reservation.userId },
      data: { creditBalance: newBalance },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: reservation.userId,
        amount: refundAmount,
        balanceAfter: newBalance,
        type: 'REFUND',
        reason: reason || `Refund: ${reservation.product.name}`,
        performedBy: adminId,
        reservationId,
      },
    }),
  ])

  await logAudit({
    userId: reservation.userId,
    performedBy: adminId,
    action: 'RESERVATION_REFUND',
    targetType: 'Reservation',
    targetId: reservationId,
    metadata: {
      refundAmount,
      reason,
      reservationStatus: reservation.status,
    },
  })

  // Send notifications
  await notificationHelper.sendReservationRefundedNotification(
    reservation.userId,
    reservationId,
    reservation.product.name,
    refundAmount,
    newBalance
  )

  return updatedReservation
}

// ============================================
// UPDATE RESERVATION (Admin)
// ============================================

interface UpdateReservationParams {
  reservationId: string
  adminId: string
  startDate?: string
  endDate?: string
  notes?: string
  adminNotes?: string
  request?: FastifyRequest
}

export const updateReservation = async (params: UpdateReservationParams) => {
  const { reservationId, adminId, startDate, endDate, notes, adminNotes, request: _request } = params

  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } })

  if (!reservation) {
    throw { statusCode: 404, message: 'Reservation not found', code: 'NOT_FOUND' }
  }

  if (reservation.status === 'CANCELLED' || reservation.status === 'RETURNED') {
    throw {
      statusCode: 400,
      message: 'Cannot update a cancelled or completed reservation',
      code: 'VALIDATION_ERROR',
    }
  }

  const updateData: any = {}

  if (startDate || endDate) {
    const newStart = startDate ? startOfDay(new Date(startDate)) : reservation.startDate
    const newEnd = endDate ? startOfDay(new Date(endDate)) : reservation.endDate

    const dateValidation = await validateDates(reservation.productId, newStart, newEnd, true)
    if (!dateValidation.valid) {
      throw { statusCode: 400, message: dateValidation.error, code: dateValidation.code }
    }

    const conflictValidation = await validateNoConflict(
      reservation.productId,
      newStart,
      newEnd,
      reservationId
    )
    if (!conflictValidation.valid) {
      throw { statusCode: 409, message: conflictValidation.error, code: conflictValidation.code }
    }

    if (startDate) updateData.startDate = newStart
    if (endDate) updateData.endDate = newEnd
  }

  if (notes !== undefined) updateData.notes = notes
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: updateData,
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      product: { select: { id: true, name: true } },
    },
  })

  await logAudit({
    userId: reservation.userId,
    performedBy: adminId,
    action: 'RESERVATION_UPDATE',
    targetType: 'Reservation',
    targetId: reservationId,
    metadata: updateData,
  })

  return updated
}

// ============================================
// CHECKOUT / RETURN (Preview for Phase 5)
// ============================================

interface CheckoutParams {
  reservationId: string
  adminId: string
  notes?: string
  request?: FastifyRequest
}

export const checkoutReservation = async (params: CheckoutParams) => {
  const { reservationId, adminId, notes } = params

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { product: { select: { id: true, name: true } } },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Reservation not found', code: 'NOT_FOUND' }
  }

  if (reservation.status !== 'CONFIRMED') {
    throw {
      statusCode: 400,
      message: 'Only confirmed reservations can be checked out',
      code: 'VALIDATION_ERROR',
    }
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: 'CHECKED_OUT',
      checkedOutAt: new Date(),
      checkedOutBy: adminId,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      product: { select: { id: true, name: true } },
    },
  })

  await createMovement({
    productId: reservation.productId,
    reservationId,
    type: 'CHECKOUT',
    condition: 'OK',
    notes,
    performedBy: adminId,
  })

  await logAudit({
    userId: reservation.userId,
    performedBy: adminId,
    action: 'RESERVATION_CHECKOUT',
    targetType: 'Reservation',
    targetId: reservationId,
    metadata: { checkedOutAt: updated.checkedOutAt, notes },
  })

  // Send notifications
  await notificationHelper.sendCheckoutNotification(
    reservation.userId,
    reservationId,
    reservation.product.name
  )

  return updated
}

interface MovementPhotoData {
  s3Key: string
  filename: string
  mimeType: string
  size: number
}

interface ReturnParams {
  reservationId: string
  adminId: string
  condition?: ProductCondition
  notes?: string
  photos?: MovementPhotoData[]
  request?: FastifyRequest
}

export const returnReservation = async (params: ReturnParams) => {
  const { reservationId, adminId, condition = 'OK', notes, photos } = params

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { product: { select: { id: true, name: true } } },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Reservation not found', code: 'NOT_FOUND' }
  }

  if (reservation.status !== 'CHECKED_OUT') {
    throw {
      statusCode: 400,
      message: 'Only checked out reservations can be returned',
      code: 'VALIDATION_ERROR',
    }
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: 'RETURNED',
      returnedAt: new Date(),
      returnedBy: adminId,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      product: { select: { id: true, name: true } },
    },
  })

  await createMovement({
    productId: reservation.productId,
    reservationId,
    type: 'RETURN',
    condition,
    notes,
    photos,
    performedBy: adminId,
  })

  await logAudit({
    userId: reservation.userId,
    performedBy: adminId,
    action: 'RESERVATION_RETURN',
    targetType: 'Reservation',
    targetId: reservationId,
    metadata: { returnedAt: updated.returnedAt, condition, notes },
  })

  // Send notifications
  await notificationHelper.sendReturnNotification(
    reservation.userId,
    reservationId,
    reservation.product.name,
    condition
  )

  return updated
}

// ============================================
// AVAILABILITY / CALENDAR
// ============================================

export const getProductAvailability = async (productId: string, month: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { section: { select: { allowedDaysIn: true, allowedDaysOut: true } } },
  })

  if (!product) {
    throw { statusCode: 404, message: 'Product not found', code: 'NOT_FOUND' }
  }

  const [year, monthNum] = month.split('-').map(Number)
  const startOfMonth = new Date(year, monthNum - 1, 1)
  const endOfMonth = new Date(year, monthNum, 0)

  const reservations = await prisma.reservation.findMany({
    where: {
      productId,
      status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
      OR: [
        {
          startDate: { lte: endOfMonth },
          endDate: { gte: startOfMonth },
        },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
    },
  })

  const days: Array<{
    date: string
    dayOfWeek: number
    status: 'LIBRE' | 'RÉSERVÉ' | 'SORTI'
    reservationId?: string
    isBlocked: boolean
  }> = []

  const currentDate = new Date(startOfMonth)

  while (currentDate <= endOfMonth) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayOfWeek = currentDate.getDay()

    const isBlockedIn = !product.section.allowedDaysIn.includes(dayOfWeek)
    const isBlockedOut = !product.section.allowedDaysOut.includes(dayOfWeek)
    const isBlocked = isBlockedIn && isBlockedOut

    let status: 'LIBRE' | 'RÉSERVÉ' | 'SORTI' = 'LIBRE'
    let reservationId: string | undefined

    for (const res of reservations) {
      const resStart = new Date(res.startDate)
      const resEnd = new Date(res.endDate)

      if (currentDate >= resStart && currentDate <= resEnd) {
        reservationId = res.id
        status = res.status === 'CHECKED_OUT' ? 'SORTI' : 'RÉSERVÉ'
        break
      }
    }

    days.push({
      date: dateStr,
      dayOfWeek,
      status,
      reservationId,
      isBlocked,
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return {
    productId,
    productName: product.name,
    month,
    allowedDaysIn: product.section.allowedDaysIn,
    allowedDaysOut: product.section.allowedDaysOut,
    days,
  }
}

export const checkAvailability = async (
  productId: string,
  startDate: string,
  endDate: string
): Promise<{ available: boolean; conflictingReservation?: any }> => {
  const start = startOfDay(new Date(startDate))
  const end = startOfDay(new Date(endDate))

  const conflict = await prisma.reservation.findFirst({
    where: {
      productId,
      status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
    },
  })

  return {
    available: !conflict,
    conflictingReservation: conflict,
  }
}
