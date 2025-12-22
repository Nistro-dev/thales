// src/services/reservation.service.ts

import { prisma } from '../utils/prisma.js'
import { logAudit } from './audit.service.js'
import { createMovement } from './movement.service.js'
import { generateReservationQRCode } from '../utils/qrCode.js'
import { generatePresignedUrl } from '../utils/s3.js'
import { FastifyRequest } from 'fastify'
import type { ReservationStatus, ProductCondition, CreditPeriod } from '@prisma/client'
import * as notificationHelper from './notification-helper.service.js'
import * as closureService from './section-closure.service.js'
import * as timeSlotService from './time-slot.service.js'
import * as maintenanceService from './maintenance.service.js'
import { logger } from '../utils/logger.js'

// ============================================
// HELPERS
// ============================================

const startOfDay = (date: Date): Date => {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

const getDayOfWeek = (date: Date): number => {
  return date.getUTCDay()
}

const daysBetween = (start: Date, end: Date): number => {
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calculate credits based on duration and credit period
 * @param priceCredits - Price per period (day or week)
 * @param creditPeriod - Period type (DAY or WEEK)
 * @param durationDays - Duration in days
 * @returns Total credits to charge
 */
export const calculateCredits = (
  priceCredits: number,
  creditPeriod: CreditPeriod,
  durationDays: number
): number => {
  if (creditPeriod === 'WEEK') {
    // Calculate weeks (rounded up)
    const weeks = Math.ceil(durationDays / 7)
    return priceCredits * weeks
  }
  // Default: per day
  return priceCredits * durationDays
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
  isAdmin: boolean = false,
  startTime?: string,
  endTime?: string
): Promise<ValidationResult> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { section: true },
  })

  if (!product) {
    return { valid: false, error: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  const now = new Date()
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0))

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

  // maxDuration = 0 means unlimited
  if (product.maxDuration > 0 && duration > product.maxDuration) {
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

  // Validate time slots if provided
  if (startTime) {
    const timeValidation = await timeSlotService.validateTimeInSlot({
      sectionId: product.section.id,
      type: 'CHECKOUT',
      dayOfWeek: startDayOfWeek,
      time: startTime,
    })
    if (!timeValidation.valid) {
      return {
        valid: false,
        error: timeValidation.error,
        code: 'INVALID_TIME_SLOT',
      }
    }
  }

  if (endTime) {
    const timeValidation = await timeSlotService.validateTimeInSlot({
      sectionId: product.section.id,
      type: 'RETURN',
      dayOfWeek: endDayOfWeek,
      time: endTime,
    })
    if (!timeValidation.valid) {
      return {
        valid: false,
        error: timeValidation.error,
        code: 'INVALID_TIME_SLOT',
      }
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
  // Get all active reservations for this product
  const reservationsWhere: any = {
    productId,
    status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
  }

  if (excludeReservationId) {
    reservationsWhere.id = { not: excludeReservationId }
  }

  const reservations = await prisma.reservation.findMany({
    where: reservationsWhere,
    select: {
      status: true,
      startDate: true,
      endDate: true,
      checkedOutAt: true,
    },
  })

  // Normalize input dates
  const reqStart = new Date(startDate)
  reqStart.setUTCHours(0, 0, 0, 0)
  const reqEnd = new Date(endDate)
  reqEnd.setUTCHours(0, 0, 0, 0)

  // Check for conflicts manually to handle early checkouts
  // IMPORTANT: The return day (endDate) is available for new reservations to start
  // A new reservation can start on the same day another one ends (return day)
  for (const res of reservations) {
    const resStart = new Date(res.startDate)
    resStart.setUTCHours(0, 0, 0, 0)
    const resEnd = new Date(res.endDate)
    resEnd.setUTCHours(0, 0, 0, 0)

    let effectiveStart = resStart

    // For CHECKED_OUT reservations with early checkout, use checkout date as effective start
    if (res.status === 'CHECKED_OUT' && res.checkedOutAt) {
      const checkoutDate = new Date(res.checkedOutAt)
      checkoutDate.setUTCHours(0, 0, 0, 0)
      if (checkoutDate < resStart) {
        effectiveStart = checkoutDate
      }
    }

    // Check if there's an overlap
    // A reservation occupies from startDate to endDate-1 (the return day is free for new bookings)
    // Overlap occurs if: reqStart < resEnd AND reqEnd > effectiveStart
    // This allows: resEnd === reqStart (new reservation starts on return day of existing one)
    if (reqStart < resEnd && reqEnd > effectiveStart) {
      return {
        valid: false,
        error: 'Le produit est déjà réservé pour cette période',
        code: 'CONFLICT',
      }
    }
  }

  return { valid: true }
}

export const validateNoClosureConflict = async (
  sectionId: string,
  startDate: Date,
  endDate: Date
): Promise<ValidationResult> => {
  const closureCheck = await closureService.checkDatesForClosure(sectionId, startDate, endDate)

  if (closureCheck.hasConflict) {
    const actionType = closureCheck.conflictType === 'checkout' ? 'de sortie' : 'de retour'
    return {
      valid: false,
      error: `La date ${actionType} tombe pendant une période de fermeture : ${closureCheck.closureReason}`,
      code: 'SECTION_CLOSED',
    }
  }

  return { valid: true }
}

export const validateNoMaintenanceConflict = async (
  productId: string,
  startDate: Date,
  endDate: Date
): Promise<ValidationResult> => {
  // Get all active and scheduled maintenances for this product
  const maintenances = await prisma.productMaintenance.findMany({
    where: {
      productId,
      endedAt: null, // Only active/scheduled maintenances
    },
  })

  const reqStart = new Date(startDate)
  reqStart.setUTCHours(0, 0, 0, 0)
  const reqEnd = new Date(endDate)
  reqEnd.setUTCHours(0, 0, 0, 0)

  for (const maintenance of maintenances) {
    const mStart = new Date(maintenance.startDate)
    mStart.setUTCHours(0, 0, 0, 0)
    const mEnd = maintenance.endDate ? new Date(maintenance.endDate) : null
    if (mEnd) {
      mEnd.setUTCHours(0, 0, 0, 0)
    }

    // Check for overlap
    if (mEnd === null) {
      // Indefinite maintenance - blocks all dates from mStart onwards
      if (reqEnd >= mStart) {
        const reason = maintenance.reason ? ` (${maintenance.reason})` : ''
        return {
          valid: false,
          error: `Le produit est en maintenance${reason}`,
          code: 'PRODUCT_MAINTENANCE',
        }
      }
    } else {
      // Maintenance with end date - check for overlap
      // Overlap if: reqStart <= mEnd AND reqEnd >= mStart
      if (reqStart <= mEnd && reqEnd >= mStart) {
        const reason = maintenance.reason ? ` (${maintenance.reason})` : ''
        return {
          valid: false,
          error: `Le produit est en maintenance du ${mStart.toLocaleDateString('fr-FR')} au ${mEnd.toLocaleDateString('fr-FR')}${reason}`,
          code: 'PRODUCT_MAINTENANCE',
        }
      }
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
  startTime?: string
  endTime?: string
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
    startTime,
    endTime,
    notes,
    adminNotes,
    createdBy,
    isAdmin = false,
    request: _request,
  } = params

  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)

  // Pre-validation (non-critical, can be bypassed by race condition)
  const userValidation = await validateUserCanReserve(userId)
  if (!userValidation.valid) {
    throw { statusCode: 403, message: userValidation.error, code: userValidation.code }
  }

  const productValidation = await validateProductAvailable(productId)
  if (!productValidation.valid) {
    throw { statusCode: 400, message: productValidation.error, code: productValidation.code }
  }

  const dateValidation = await validateDates(productId, start, end, isAdmin, startTime, endTime)
  if (!dateValidation.valid) {
    throw { statusCode: 400, message: dateValidation.error, code: dateValidation.code }
  }

  // Pre-check for conflict (will be re-checked in transaction)
  const conflictValidation = await validateNoConflict(productId, start, end)
  if (!conflictValidation.valid) {
    throw { statusCode: 409, message: conflictValidation.error, code: conflictValidation.code }
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { priceCredits: true, creditPeriod: true, name: true, sectionId: true },
  })

  if (!product) {
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  // Check if checkout or return date falls within a section closure
  const closureValidation = await validateNoClosureConflict(product.sectionId, start, end)
  if (!closureValidation.valid) {
    throw { statusCode: 400, message: closureValidation.error, code: closureValidation.code }
  }

  // Check if the reservation period conflicts with a maintenance
  const maintenanceValidation = await validateNoMaintenanceConflict(productId, start, end)
  if (!maintenanceValidation.valid) {
    throw { statusCode: 400, message: maintenanceValidation.error, code: maintenanceValidation.code }
  }

  // Calculate total credits based on credit period (per day or per week)
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const totalCredits = calculateCredits(product.priceCredits, product.creditPeriod, durationDays)

  const creditValidation = await validateUserCredits(userId, totalCredits)
  if (!creditValidation.valid) {
    throw { statusCode: 400, message: creditValidation.error, code: creditValidation.code }
  }

  // Use interactive transaction with serializable isolation to prevent race conditions
  const reservation = await prisma.$transaction(
    async (tx) => {
      // Re-check for conflicts inside transaction (atomic check)
      // A reservation occupies from startDate to endDate-1 (the return day is free for new bookings)
      // Conflict occurs if: new.startDate < existing.endDate AND new.endDate > existing.startDate
      const existingConflict = await tx.reservation.findFirst({
        where: {
          productId,
          status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
          startDate: { lt: end }, // existing starts before new ends
          endDate: { gt: start }, // existing ends after new starts
        },
      })

      if (existingConflict) {
        throw { statusCode: 409, message: 'Le produit est déjà réservé pour cette période', code: 'CONFLICT' }
      }

      // Check for duplicate reservation (same user, same product, same dates)
      const duplicateReservation = await tx.reservation.findFirst({
        where: {
          userId,
          productId,
          startDate: start,
          endDate: end,
          status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
        },
      })

      if (duplicateReservation) {
        throw { statusCode: 409, message: 'Une réservation identique existe déjà', code: 'DUPLICATE' }
      }

      // Get current user balance (with lock via transaction)
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      })

      if (!user || user.creditBalance < totalCredits) {
        throw { statusCode: 400, message: 'Crédits insuffisants', code: 'VALIDATION_ERROR' }
      }

      const newBalance = user.creditBalance - totalCredits

      // Create reservation
      const newReservation = await tx.reservation.create({
        data: {
          userId,
          productId,
          startDate: start,
          endDate: end,
          startTime,
          endTime,
          status: 'CONFIRMED',
          creditsCharged: totalCredits,
          notes,
          adminNotes,
          createdBy,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          product: { select: { id: true, name: true, reference: true } },
        },
      })

      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: { creditBalance: newBalance },
      })

      // Create credit transaction
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -totalCredits,
          balanceAfter: newBalance,
          type: 'RESERVATION',
          reason: `Réservation : ${product.name}`,
          performedBy: createdBy,
        },
      })

      return newReservation
    },
    {
      isolationLevel: 'Serializable', // Prevent race conditions
      timeout: 10000, // 10 second timeout
    }
  )

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
      startTime,
      endTime,
      durationDays,
      pricePerDay: product.priceCredits,
      creditsCharged: totalCredits,
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
  overdue?: 'checkouts' | 'returns' // Filter for overdue reservations
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
    overdue,
    sortBy = 'startDate',
    sortOrder = 'asc',
  } = params

  const where: any = {}
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (forUserId) {
    where.userId = forUserId
  } else if (userId) {
    where.userId = userId
  }

  // Handle overdue filter
  if (overdue === 'checkouts') {
    // Overdue checkouts: CONFIRMED status with startDate < today
    where.status = 'CONFIRMED'
    where.startDate = { lt: today }
  } else if (overdue === 'returns') {
    // Overdue returns: CHECKED_OUT status with endDate < today
    where.status = 'CHECKED_OUT'
    where.endDate = { lt: today }
  } else {
    // Normal filters
    if (status) {
      where.status = status
    }

    if (startDateFrom || startDateTo) {
      where.startDate = {}
      if (startDateFrom) where.startDate.gte = new Date(startDateFrom)
      if (startDateTo) where.startDate.lte = new Date(startDateTo)
    }
  }

  if (productId) {
    where.productId = productId
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
            section: { select: { id: true, name: true, refundDeadlineHours: true } },
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
          section: { select: { id: true, name: true, refundDeadlineHours: true } },
          subSection: { select: { id: true, name: true } },
        },
      },
      movements: {
        include: {
          photos: {
            orderBy: { sortOrder: 'asc' },
          },
          performedByUser: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { performedAt: 'desc' },
      },
    },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Réservation introuvable', code: 'NOT_FOUND' }
  }

  // Add presigned URLs for movement photos
  if (reservation.movements) {
    for (const movement of reservation.movements) {
      if (movement.photos) {
        for (const photo of movement.photos) {
          (photo as any).url = await generatePresignedUrl(photo.s3Key)
        }
      }
    }
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
    include: {
      product: {
        select: {
          name: true,
          section: { select: { refundDeadlineHours: true } },
        },
      },
    },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Réservation introuvable', code: 'NOT_FOUND' }
  }

  if (!isAdmin && reservation.userId !== userId) {
    throw {
      statusCode: 403,
      message: 'Vous ne pouvez annuler que vos propres réservations',
      code: 'FORBIDDEN',
    }
  }

  if (reservation.status === 'CANCELLED') {
    throw { statusCode: 400, message: 'La réservation est déjà annulée', code: 'VALIDATION_ERROR' }
  }

  if (reservation.status === 'RETURNED') {
    throw {
      statusCode: 400,
      message: "Impossible d'annuler une réservation terminée",
      code: 'VALIDATION_ERROR',
    }
  }

  if (!isAdmin && reservation.status === 'CHECKED_OUT') {
    throw {
      statusCode: 400,
      message: "Impossible d'annuler une réservation après le retrait. Contactez un administrateur.",
      code: 'VALIDATION_ERROR',
    }
  }

  // Check if eligible for refund based on refundDeadlineHours
  const refundDeadlineHours = reservation.product.section.refundDeadlineHours
  const now = new Date()
  const startDate = new Date(reservation.startDate)
  const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  const isEligibleForRefund = hoursUntilStart >= refundDeadlineHours

  const user = await prisma.user.findUnique({
    where: { id: reservation.userId },
    select: { creditBalance: true },
  })

  if (isEligibleForRefund) {
    // Full refund
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
          reason: `Annulation : ${reservation.product.name}`,
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
        refunded: true,
      },
    })

    // Send notifications
    await notificationHelper.sendReservationCancelledNotification(
      reservation.userId,
      reservationId,
      reservation.product.name,
      reason
    )

    return { ...updatedReservation, refunded: true }
  } else {
    // No refund - cancellation is too late
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
        cancelledBy: userId,
        // No refund fields set
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        product: { select: { id: true, name: true } },
      },
    })

    await logAudit({
      userId: reservation.userId,
      performedBy: userId,
      action: 'RESERVATION_CANCEL',
      targetType: 'Reservation',
      targetId: reservationId,
      metadata: {
        reason,
        refundAmount: 0,
        previousStatus: reservation.status,
        refunded: false,
        hoursUntilStart: Math.floor(hoursUntilStart),
        refundDeadlineHours,
      },
    })

    // Send notifications (no refund version)
    await notificationHelper.sendReservationCancelledNotification(
      reservation.userId,
      reservationId,
      reservation.product.name,
      reason
    )

    return { ...updatedReservation, refunded: false }
  }
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
    throw { statusCode: 404, message: 'Réservation introuvable', code: 'NOT_FOUND' }
  }

  if (reservation.refundedAt) {
    throw {
      statusCode: 400,
      message: 'La réservation a déjà été remboursée',
      code: 'VALIDATION_ERROR',
    }
  }

  const refundAmount = amount ?? reservation.creditsCharged

  if (refundAmount > reservation.creditsCharged) {
    throw {
      statusCode: 400,
      message: 'Le montant du remboursement ne peut pas dépasser le montant facturé',
      code: 'VALIDATION_ERROR',
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: reservation.userId },
    select: { creditBalance: true },
  })

  const newBalance = user!.creditBalance + refundAmount

  // For CANCELLED reservations, keep status as CANCELLED
  // For RETURNED reservations, change to REFUNDED
  const newStatus = reservation.status === 'CANCELLED' ? 'CANCELLED' : 'REFUNDED'

  const [updatedReservation] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: newStatus,
        refundedAt: new Date(),
        refundedBy: adminId,
        refundAmount,
        adminNotes: reservation.adminNotes
          ? `${reservation.adminNotes}\n[REMBOURSEMENT] ${reason || 'Aucune raison fournie'}`
          : `[REMBOURSEMENT] ${reason || 'Aucune raison fournie'}`,
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
        reason: reason || `Remboursement : ${reservation.product.name}`,
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
    throw { statusCode: 404, message: 'Réservation introuvable', code: 'NOT_FOUND' }
  }

  if (reservation.status === 'CANCELLED' || reservation.status === 'RETURNED') {
    throw {
      statusCode: 400,
      message: 'Impossible de modifier une réservation annulée ou terminée',
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
    include: { product: { select: { id: true, name: true, status: true, sectionId: true } } },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Réservation introuvable', code: 'NOT_FOUND' }
  }

  if (reservation.status !== 'CONFIRMED') {
    throw {
      statusCode: 400,
      message: 'Seules les réservations confirmées peuvent être retirées',
      code: 'VALIDATION_ERROR',
    }
  }

  // Check if today is in a section closure
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const closureCheck = await closureService.isDateInClosure(reservation.product.sectionId, today)
  if (closureCheck.closed) {
    throw {
      statusCode: 400,
      message: `Impossible d'effectuer un retrait : la section est fermée (${closureCheck.reason})`,
      code: 'SECTION_CLOSED',
    }
  }

  // Check if this is an early checkout (before startDate)
  const startDate = new Date(reservation.startDate)
  startDate.setHours(0, 0, 0, 0)
  const isEarlyCheckout = today < startDate

  // Build adminNotes with checkout notes if provided
  let updatedAdminNotes = reservation.adminNotes || ''
  if (notes) {
    const checkoutNote = `[RETRAIT] ${notes}`
    updatedAdminNotes = updatedAdminNotes ? `${updatedAdminNotes}\n${checkoutNote}` : checkoutNote
  }
  if (isEarlyCheckout) {
    const earlyNote = `[RETRAIT ANTICIPÉ] Produit sorti avant la date prévue`
    updatedAdminNotes = updatedAdminNotes ? `${updatedAdminNotes}\n${earlyNote}` : earlyNote
  }

  // Note: Product stays AVAILABLE - calendar handles blocking based on checkedOutAt date

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: 'CHECKED_OUT',
      checkedOutAt: new Date(),
      checkedOutBy: adminId,
      adminNotes: updatedAdminNotes || undefined,
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
  caption?: string
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
    include: { product: { select: { id: true, name: true, status: true, sectionId: true } } },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Réservation introuvable', code: 'NOT_FOUND' }
  }

  if (reservation.status !== 'CHECKED_OUT') {
    throw {
      statusCode: 400,
      message: 'Seules les réservations retirées peuvent être retournées',
      code: 'VALIDATION_ERROR',
    }
  }

  // Check if today is in a section closure (admin can bypass in exceptional cases)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const closureCheck = await closureService.isDateInClosure(reservation.product.sectionId, today)
  if (closureCheck.closed) {
    throw {
      statusCode: 400,
      message: `Impossible d'effectuer un retour : la section est fermée (${closureCheck.reason})`,
      code: 'SECTION_CLOSED',
    }
  }

  // Build adminNotes with return notes if provided
  let updatedAdminNotes = reservation.adminNotes || ''
  if (notes) {
    const returnNote = `[RETOUR] ${notes}`
    updatedAdminNotes = updatedAdminNotes ? `${updatedAdminNotes}\n${returnNote}` : returnNote
  }

  // Note: Product status is not changed - it stays AVAILABLE throughout the reservation lifecycle

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: 'RETURNED',
      returnedAt: new Date(),
      returnedBy: adminId,
      ...(notes && { adminNotes: updatedAdminNotes }),
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
    include: { section: { select: { id: true, allowedDaysIn: true, allowedDaysOut: true } } },
  })

  if (!product) {
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
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
      status: true,
      startDate: true,
      endDate: true,
      checkedOutAt: true,
    },
  })

  // Build list of reserved dates (without exposing reservation IDs for security)
  // IMPORTANT: The return day (endDate) is NOT blocked - it's available for new reservations to start
  const reservedDates: Array<{ date: string }> = []
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Iterate through each day of the month
  for (let day = 1; day <= endOfMonth.getDate(); day++) {
    const currentDate = new Date(Date.UTC(year, monthNum - 1, day, 0, 0, 0, 0))
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    for (const res of reservations) {
      // Normalize reservation dates to start of day UTC
      const resStart = new Date(res.startDate)
      resStart.setUTCHours(0, 0, 0, 0)
      const resEnd = new Date(res.endDate)
      resEnd.setUTCHours(0, 0, 0, 0)

      // For CHECKED_OUT reservations with early checkout, block from checkout date
      if (res.status === 'CHECKED_OUT' && res.checkedOutAt) {
        const checkoutDate = new Date(res.checkedOutAt)
        checkoutDate.setUTCHours(0, 0, 0, 0)

        // If checked out before start date (early checkout), block from checkout date to end date - 1
        // The return day (endDate) is available for new reservations
        if (checkoutDate < resStart) {
          if (currentDate >= checkoutDate && currentDate < resEnd) {
            reservedDates.push({ date: dateStr })
            break
          }
        } else {
          // Normal case: block from start to end - 1 (return day is free)
          if (currentDate >= resStart && currentDate < resEnd) {
            reservedDates.push({ date: dateStr })
            break
          }
        }
      } else {
        // CONFIRMED reservations: block from start to end - 1 (return day is free)
        if (currentDate >= resStart && currentDate < resEnd) {
          reservedDates.push({ date: dateStr })
          break
        }
      }
    }
  }

  // Get section closures for the month
  const closures = await closureService.getClosuresForMonth(product.section.id, month)
  const closedDates: Array<{ date: string; reason: string }> = []

  // Get time slots for the section
  const timeSlots = await timeSlotService.listTimeSlots({ sectionId: product.section.id })

  for (const closure of closures) {
    const closureStart = new Date(closure.startDate)
    closureStart.setUTCHours(0, 0, 0, 0)
    const closureEnd = new Date(closure.endDate)
    closureEnd.setUTCHours(0, 0, 0, 0)

    // Iterate through each day of the closure period within this month
    for (let day = 1; day <= endOfMonth.getDate(); day++) {
      const currentDate = new Date(Date.UTC(year, monthNum - 1, day, 0, 0, 0, 0))
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      if (currentDate >= closureStart && currentDate <= closureEnd) {
        // Avoid duplicates
        if (!closedDates.find((d) => d.date === dateStr)) {
          closedDates.push({ date: dateStr, reason: closure.reason })
        }
      }
    }
  }

  // Get maintenance periods for the month
  const maintenancePeriods = await maintenanceService.getMaintenancePeriodsForMonth(productId, month)
  const maintenanceDates: Array<{ date: string; reason: string | null }> = []

  for (const maintenance of maintenancePeriods) {
    const mStart = new Date(maintenance.startDate)
    mStart.setUTCHours(0, 0, 0, 0)
    const mEnd = maintenance.endDate ? new Date(maintenance.endDate) : null
    if (mEnd) {
      mEnd.setUTCHours(0, 0, 0, 0)
    }

    // Iterate through each day of the month
    for (let day = 1; day <= endOfMonth.getDate(); day++) {
      const currentDate = new Date(Date.UTC(year, monthNum - 1, day, 0, 0, 0, 0))
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      // Check if this date is in the maintenance period
      if (mEnd === null) {
        // Indefinite maintenance - all dates from mStart onwards
        if (currentDate >= mStart) {
          if (!maintenanceDates.find((d) => d.date === dateStr)) {
            maintenanceDates.push({ date: dateStr, reason: maintenance.reason })
          }
        }
      } else {
        // Maintenance with end date (inclusive)
        if (currentDate >= mStart && currentDate <= mEnd) {
          if (!maintenanceDates.find((d) => d.date === dateStr)) {
            maintenanceDates.push({ date: dateStr, reason: maintenance.reason })
          }
        }
      }
    }
  }

  return {
    productId,
    month,
    allowedDaysIn: product.section.allowedDaysIn,
    allowedDaysOut: product.section.allowedDaysOut,
    reservedDates,
    closedDates,
    maintenanceDates,
    timeSlots: {
      checkout: timeSlots.filter((ts) => ts.type === 'CHECKOUT'),
      return: timeSlots.filter((ts) => ts.type === 'RETURN'),
    },
  }
}

export const checkAvailability = async (
  productId: string,
  startDate: string,
  endDate: string
): Promise<{ available: boolean; conflictingReservation?: any }> => {
  const start = startOfDay(new Date(startDate))
  const end = startOfDay(new Date(endDate))

  // A reservation occupies from startDate to endDate-1 (the return day is free for new bookings)
  // Conflict occurs if: new.startDate < existing.endDate AND new.endDate > existing.startDate
  const conflict = await prisma.reservation.findFirst({
    where: {
      productId,
      status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
      startDate: { lt: end }, // existing starts before new ends
      endDate: { gt: start }, // existing ends after new starts
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

// ============================================
// PRODUCT RESERVATIONS (for product detail page)
// ============================================

interface ListProductReservationsParams {
  productId: string
  page: number
  limit: number
  search?: string
  status?: ReservationStatus
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const listProductReservations = async (params: ListProductReservationsParams) => {
  const {
    productId,
    page,
    limit,
    search,
    status,
    sortBy = 'startDate',
    sortOrder = 'desc',
  } = params

  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  const where: any = { productId }

  if (status) {
    where.status = status
  }

  if (search) {
    where.user = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }
  }

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reservation.count({ where }),
  ])

  // Get return conditions from movements for returned reservations
  const returnedIds = reservations.filter(r => r.status === 'RETURNED').map(r => r.id)
  const returnMovements = returnedIds.length > 0
    ? await prisma.productMovement.findMany({
        where: {
          reservationId: { in: returnedIds },
          type: 'RETURN',
        },
        select: {
          reservationId: true,
          condition: true,
        },
      })
    : []

  const conditionMap = new Map(returnMovements.map(m => [m.reservationId, m.condition]))

  const reservationsWithCondition = reservations.map(r => ({
    ...r,
    returnCondition: r.status === 'RETURNED' ? conditionMap.get(r.id) || null : null,
  }))

  return { reservations: reservationsWithCondition, total }
}
