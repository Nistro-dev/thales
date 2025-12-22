// src/services/maintenance.service.ts

import { prisma } from '../utils/prisma.js'
import { logAudit } from './audit.service.js'
import { logger } from '../utils/logger.js'
import * as notificationHelper from './notification-helper.service.js'

// ============================================
// HELPERS
// ============================================

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR')
}

// ============================================
// TYPES
// ============================================

interface CreateMaintenanceParams {
  productId: string
  startDate: string // YYYY-MM-DD
  endDate?: string | null // YYYY-MM-DD, null = indéterminée
  reason?: string | null
  performedBy: string
}

interface UpdateMaintenanceParams {
  maintenanceId: string
  endDate?: string | null
  reason?: string | null
  performedBy: string
}

interface MaintenanceWithStats {
  id: string
  productId: string
  startDate: Date
  endDate: Date | null
  reason: string | null
  cancelledReservationsCount: number
  refundedCreditsTotal: number
  createdBy: string
  endedAt: Date | null
  endedBy: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================
// VALIDATION
// ============================================

/**
 * Check if a new maintenance period overlaps with existing maintenances
 */
export const checkMaintenanceOverlap = async (
  productId: string,
  startDate: Date,
  endDate: Date | null,
  excludeMaintenanceId?: string
): Promise<{ hasOverlap: boolean; overlappingMaintenance?: MaintenanceWithStats }> => {
  const where: any = {
    productId,
    endedAt: null, // Only active/scheduled maintenances
  }

  if (excludeMaintenanceId) {
    where.id = { not: excludeMaintenanceId }
  }

  const existingMaintenances = await prisma.productMaintenance.findMany({
    where,
  })

  for (const maintenance of existingMaintenances) {
    const mStart = new Date(maintenance.startDate)
    mStart.setUTCHours(0, 0, 0, 0)
    const mEnd = maintenance.endDate ? new Date(maintenance.endDate) : null

    // If either maintenance is indefinite, any overlap is a conflict
    if (endDate === null || mEnd === null) {
      // Indefinite maintenances conflict if their start dates overlap at all
      if (endDate === null && mEnd === null) {
        // Both indefinite - conflict if either starts before the other or same day
        return { hasOverlap: true, overlappingMaintenance: maintenance }
      }
      if (endDate === null) {
        // New is indefinite - conflicts if it starts before existing ends
        if (startDate <= mEnd!) {
          return { hasOverlap: true, overlappingMaintenance: maintenance }
        }
      }
      if (mEnd === null) {
        // Existing is indefinite - conflicts if new starts after existing starts
        // Or if new ends after existing starts
        if (startDate >= mStart || (endDate && endDate >= mStart)) {
          return { hasOverlap: true, overlappingMaintenance: maintenance }
        }
      }
    } else {
      // Both have end dates - standard overlap check
      // Overlap if: newStart <= existingEnd AND newEnd >= existingStart
      if (startDate <= mEnd && endDate >= mStart) {
        return { hasOverlap: true, overlappingMaintenance: maintenance }
      }
    }
  }

  return { hasOverlap: false }
}

/**
 * Get reservations that would be affected by a maintenance period
 */
export const getAffectedReservations = async (
  productId: string,
  startDate: Date,
  endDate: Date | null
): Promise<Array<{
  id: string
  userId: string
  startDate: Date
  endDate: Date
  creditsCharged: number
  status: string
  user: { id: string; email: string; firstName: string; lastName: string }
}>> => {
  const where: any = {
    productId,
    status: { in: ['CONFIRMED'] }, // Only CONFIRMED, not CHECKED_OUT
  }

  if (endDate) {
    // Maintenance with end date: find reservations that overlap
    where.OR = [
      {
        // Reservation starts during maintenance
        startDate: { gte: startDate, lte: endDate },
      },
      {
        // Reservation ends during maintenance
        endDate: { gte: startDate, lte: endDate },
      },
      {
        // Reservation spans entire maintenance
        startDate: { lte: startDate },
        endDate: { gte: endDate },
      },
    ]
  } else {
    // Indefinite maintenance: find all future reservations starting from startDate
    where.startDate = { gte: startDate }
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
    orderBy: { startDate: 'asc' },
  })

  return reservations
}

// ============================================
// CREATE MAINTENANCE
// ============================================

export const createMaintenance = async (params: CreateMaintenanceParams) => {
  const { productId, startDate, endDate, reason, performedBy } = params

  const start = parseLocalDate(startDate)
  const end = endDate ? parseLocalDate(endDate) : null

  // Validate product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, status: true },
  })

  if (!product) {
    throw { statusCode: 404, message: 'Produit introuvable', code: 'NOT_FOUND' }
  }

  // Validate dates
  if (end && end < start) {
    throw {
      statusCode: 400,
      message: 'La date de fin doit être après la date de début',
      code: 'VALIDATION_ERROR',
    }
  }

  // Check for overlapping maintenances
  const overlapCheck = await checkMaintenanceOverlap(productId, start, end)
  if (overlapCheck.hasOverlap) {
    throw {
      statusCode: 409,
      message: 'Une maintenance existe déjà pour cette période',
      code: 'MAINTENANCE_OVERLAP',
    }
  }

  // Get affected reservations BEFORE creating maintenance
  const affectedReservations = await getAffectedReservations(productId, start, end)

  // Use transaction to create maintenance, cancel reservations, and refund
  const result = await prisma.$transaction(async (tx) => {
    let totalRefunded = 0
    const cancelledCount = affectedReservations.length

    // Cancel and refund each affected reservation
    for (const reservation of affectedReservations) {
      const user = await tx.user.findUnique({
        where: { id: reservation.userId },
        select: { creditBalance: true },
      })

      if (user) {
        const newBalance = user.creditBalance + reservation.creditsCharged
        totalRefunded += reservation.creditsCharged

        // Update reservation status
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelReason: reason
              ? `Maintenance : ${reason}`
              : 'Annulée pour maintenance du produit',
            cancelledBy: performedBy,
            refundedAt: new Date(),
            refundedBy: performedBy,
            refundAmount: reservation.creditsCharged,
          },
        })

        // Refund credits
        await tx.user.update({
          where: { id: reservation.userId },
          data: { creditBalance: newBalance },
        })

        // Create credit transaction
        await tx.creditTransaction.create({
          data: {
            userId: reservation.userId,
            amount: reservation.creditsCharged,
            balanceAfter: newBalance,
            type: 'REFUND',
            reason: reason
              ? `Annulation maintenance : ${reason}`
              : 'Annulation pour maintenance',
            performedBy,
            reservationId: reservation.id,
          },
        })
      }
    }

    // Create the maintenance record
    const maintenance = await tx.productMaintenance.create({
      data: {
        productId,
        startDate: start,
        endDate: end,
        reason,
        cancelledReservationsCount: cancelledCount,
        refundedCreditsTotal: totalRefunded,
        createdBy: performedBy,
      },
    })

    // Update product status to MAINTENANCE if maintenance starts today or earlier
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    if (start <= today) {
      await tx.product.update({
        where: { id: productId },
        data: { status: 'MAINTENANCE' },
      })
    }

    return { maintenance, cancelledCount, totalRefunded, affectedReservations }
  })

  // Send notifications to affected users (outside transaction)
  for (const reservation of result.affectedReservations) {
    try {
      await notificationHelper.sendMaintenanceCancellationNotification(
        reservation.userId,
        reservation.id,
        product.name,
        reservation.creditsCharged,
        reason || undefined
      )
    } catch (error) {
      logger.error({ error, reservationId: reservation.id }, 'Failed to send maintenance cancellation notification')
    }
  }

  // Audit log
  await logAudit({
    performedBy,
    action: 'MAINTENANCE_CREATE',
    targetType: 'ProductMaintenance',
    targetId: result.maintenance.id,
    metadata: {
      productId,
      productName: product.name,
      startDate: start.toISOString(),
      endDate: end?.toISOString() || null,
      reason,
      cancelledReservationsCount: result.cancelledCount,
      refundedCreditsTotal: result.totalRefunded,
    },
  })

  return {
    maintenance: result.maintenance,
    cancelledReservationsCount: result.cancelledCount,
    refundedCreditsTotal: result.totalRefunded,
  }
}

// ============================================
// UPDATE MAINTENANCE
// ============================================

export const updateMaintenance = async (params: UpdateMaintenanceParams) => {
  const { maintenanceId, endDate, reason, performedBy } = params

  const maintenance = await prisma.productMaintenance.findUnique({
    where: { id: maintenanceId },
    include: { product: { select: { id: true, name: true } } },
  })

  if (!maintenance) {
    throw { statusCode: 404, message: 'Maintenance introuvable', code: 'NOT_FOUND' }
  }

  if (maintenance.endedAt) {
    throw {
      statusCode: 400,
      message: 'Impossible de modifier une maintenance terminée',
      code: 'VALIDATION_ERROR',
    }
  }

  const updateData: any = {}
  const newEnd = endDate !== undefined ? (endDate ? parseLocalDate(endDate) : null) : undefined

  if (newEnd !== undefined) {
    const start = new Date(maintenance.startDate)
    if (newEnd && newEnd < start) {
      throw {
        statusCode: 400,
        message: 'La date de fin doit être après la date de début',
        code: 'VALIDATION_ERROR',
      }
    }

    // Check for overlapping maintenances with new dates
    const overlapCheck = await checkMaintenanceOverlap(
      maintenance.productId,
      start,
      newEnd,
      maintenanceId
    )
    if (overlapCheck.hasOverlap) {
      throw {
        statusCode: 409,
        message: 'Une maintenance existe déjà pour cette période',
        code: 'MAINTENANCE_OVERLAP',
      }
    }

    updateData.endDate = newEnd
  }

  if (reason !== undefined) {
    updateData.reason = reason
  }

  const updated = await prisma.productMaintenance.update({
    where: { id: maintenanceId },
    data: updateData,
  })

  await logAudit({
    performedBy,
    action: 'MAINTENANCE_UPDATE',
    targetType: 'ProductMaintenance',
    targetId: maintenanceId,
    metadata: {
      productId: maintenance.productId,
      productName: maintenance.product.name,
      changes: updateData,
    },
  })

  return updated
}

// ============================================
// END MAINTENANCE (Manual early termination)
// ============================================

export const endMaintenance = async (maintenanceId: string, performedBy: string) => {
  const maintenance = await prisma.productMaintenance.findUnique({
    where: { id: maintenanceId },
    include: { product: { select: { id: true, name: true, status: true } } },
  })

  if (!maintenance) {
    throw { statusCode: 404, message: 'Maintenance introuvable', code: 'NOT_FOUND' }
  }

  if (maintenance.endedAt) {
    throw {
      statusCode: 400,
      message: 'La maintenance est déjà terminée',
      code: 'VALIDATION_ERROR',
    }
  }

  // Check if there are any other active maintenances for this product
  const otherActiveMaintenances = await prisma.productMaintenance.findFirst({
    where: {
      productId: maintenance.productId,
      id: { not: maintenanceId },
      endedAt: null,
      startDate: { lte: new Date() },
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ],
    },
  })

  const result = await prisma.$transaction(async (tx) => {
    // Mark maintenance as ended
    const updated = await tx.productMaintenance.update({
      where: { id: maintenanceId },
      data: {
        endedAt: new Date(),
        endedBy: performedBy,
      },
    })

    // Only change product status to AVAILABLE if no other active maintenances
    if (!otherActiveMaintenances && maintenance.product.status === 'MAINTENANCE') {
      await tx.product.update({
        where: { id: maintenance.productId },
        data: { status: 'AVAILABLE' },
      })
    }

    return updated
  })

  await logAudit({
    performedBy,
    action: 'MAINTENANCE_END',
    targetType: 'ProductMaintenance',
    targetId: maintenanceId,
    metadata: {
      productId: maintenance.productId,
      productName: maintenance.product.name,
      endedEarly: true,
    },
  })

  return result
}

// ============================================
// CANCEL MAINTENANCE (For future maintenances)
// ============================================

export const cancelMaintenance = async (maintenanceId: string, performedBy: string) => {
  const maintenance = await prisma.productMaintenance.findUnique({
    where: { id: maintenanceId },
    include: { product: { select: { id: true, name: true } } },
  })

  if (!maintenance) {
    throw { statusCode: 404, message: 'Maintenance introuvable', code: 'NOT_FOUND' }
  }

  if (maintenance.endedAt) {
    throw {
      statusCode: 400,
      message: 'La maintenance est déjà terminée',
      code: 'VALIDATION_ERROR',
    }
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const startDate = new Date(maintenance.startDate)
  startDate.setUTCHours(0, 0, 0, 0)

  if (startDate <= today) {
    throw {
      statusCode: 400,
      message: 'Impossible d\'annuler une maintenance déjà commencée. Utilisez "Terminer" à la place.',
      code: 'VALIDATION_ERROR',
    }
  }

  // Delete the maintenance (it hasn't started yet, so no reservations were affected)
  await prisma.productMaintenance.delete({
    where: { id: maintenanceId },
  })

  await logAudit({
    performedBy,
    action: 'MAINTENANCE_CANCEL',
    targetType: 'ProductMaintenance',
    targetId: maintenanceId,
    metadata: {
      productId: maintenance.productId,
      productName: maintenance.product.name,
      startDate: maintenance.startDate.toISOString(),
      endDate: maintenance.endDate?.toISOString() || null,
      reason: maintenance.reason,
    },
  })

  return { success: true }
}

// ============================================
// GET MAINTENANCE DATA
// ============================================

export const getProductMaintenances = async (productId: string) => {
  const maintenances = await prisma.productMaintenance.findMany({
    where: { productId },
    orderBy: { startDate: 'desc' },
  })

  // Récupérer les infos utilisateur pour createdBy et endedBy
  const userIds = new Set<string>()
  for (const m of maintenances) {
    if (m.createdBy && m.createdBy !== 'SYSTEM') userIds.add(m.createdBy)
    if (m.endedBy && m.endedBy !== 'SYSTEM') userIds.add(m.endedBy)
  }

  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, firstName: true, lastName: true },
  })

  const userMap = new Map(users.map(u => [u.id, u]))

  return maintenances.map(m => ({
    ...m,
    createdByUser: m.createdBy === 'SYSTEM'
      ? { firstName: 'Système', lastName: '' }
      : userMap.get(m.createdBy) || null,
    endedByUser: m.endedBy === 'SYSTEM'
      ? { firstName: 'Système', lastName: '' }
      : m.endedBy ? userMap.get(m.endedBy) || null : null,
  }))
}

export const getActiveMaintenance = async (productId: string) => {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Find active maintenance (started and not ended)
  const activeMaintenance = await prisma.productMaintenance.findFirst({
    where: {
      productId,
      startDate: { lte: today },
      endedAt: null,
      OR: [
        { endDate: null }, // Indefinite
        { endDate: { gte: today } }, // Not yet ended
      ],
    },
    orderBy: { startDate: 'desc' },
  })

  return activeMaintenance
}

export const getScheduledMaintenances = async (productId: string) => {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Find future scheduled maintenances
  const scheduledMaintenances = await prisma.productMaintenance.findMany({
    where: {
      productId,
      startDate: { gt: today },
      endedAt: null,
    },
    orderBy: { startDate: 'asc' },
  })

  return scheduledMaintenances
}

export const getMaintenanceById = async (maintenanceId: string) => {
  const maintenance = await prisma.productMaintenance.findUnique({
    where: { id: maintenanceId },
    include: {
      product: { select: { id: true, name: true, reference: true } },
    },
  })

  if (!maintenance) {
    throw { statusCode: 404, message: 'Maintenance introuvable', code: 'NOT_FOUND' }
  }

  return maintenance
}

// ============================================
// MAINTENANCE JOB HELPERS
// ============================================

/**
 * Process scheduled maintenances that should start today
 * Called by the maintenance CRON job
 */
export const activateScheduledMaintenances = async () => {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Find maintenances that should start today
  const maintenancesToActivate = await prisma.productMaintenance.findMany({
    where: {
      startDate: { lte: today },
      endedAt: null,
      product: {
        status: { not: 'MAINTENANCE' },
      },
    },
    include: {
      product: { select: { id: true, name: true, status: true } },
    },
  })

  let activatedCount = 0

  for (const maintenance of maintenancesToActivate) {
    // Check if maintenance is still active (hasn't passed end date)
    if (maintenance.endDate) {
      const endDate = new Date(maintenance.endDate)
      endDate.setUTCHours(0, 0, 0, 0)
      if (endDate < today) {
        continue // Skip, maintenance period has passed
      }
    }

    await prisma.product.update({
      where: { id: maintenance.productId },
      data: { status: 'MAINTENANCE' },
    })

    activatedCount++
    logger.info(
      { productId: maintenance.productId, maintenanceId: maintenance.id },
      'Activated scheduled maintenance'
    )
  }

  return activatedCount
}

/**
 * End maintenances that have reached their end date
 * Called by the maintenance CRON job
 */
export const endExpiredMaintenances = async () => {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Find maintenances that ended yesterday (end date is inclusive)
  const maintenancesToEnd = await prisma.productMaintenance.findMany({
    where: {
      endDate: { lt: today }, // End date before today
      endedAt: null,
    },
    include: {
      product: { select: { id: true, name: true, status: true } },
    },
  })

  let endedCount = 0

  for (const maintenance of maintenancesToEnd) {
    // Check if there are other active maintenances for this product
    const otherActiveMaintenances = await prisma.productMaintenance.findFirst({
      where: {
        productId: maintenance.productId,
        id: { not: maintenance.id },
        endedAt: null,
        startDate: { lte: today },
        OR: [
          { endDate: null },
          { endDate: { gte: today } },
        ],
      },
    })

    await prisma.$transaction(async (tx) => {
      // Mark maintenance as ended
      await tx.productMaintenance.update({
        where: { id: maintenance.id },
        data: {
          endedAt: new Date(),
          endedBy: 'SYSTEM',
        },
      })

      // Only change product status if no other active maintenances
      if (!otherActiveMaintenances && maintenance.product.status === 'MAINTENANCE') {
        await tx.product.update({
          where: { id: maintenance.productId },
          data: { status: 'AVAILABLE' },
        })
      }
    })

    endedCount++
    logger.info(
      { productId: maintenance.productId, maintenanceId: maintenance.id },
      'Ended expired maintenance'
    )
  }

  return endedCount
}

// ============================================
// CALENDAR HELPERS
// ============================================

/**
 * Get maintenance periods for a product in a specific month
 * Used by the availability calendar
 */
export const getMaintenancePeriodsForMonth = async (
  productId: string,
  month: string
): Promise<Array<{ startDate: string; endDate: string | null; reason: string | null }>> => {
  const [year, monthNum] = month.split('-').map(Number)
  const startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0))
  const endOfMonth = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999))

  // Find all maintenances that overlap with this month
  const maintenances = await prisma.productMaintenance.findMany({
    where: {
      productId,
      endedAt: null, // Only active/scheduled
      OR: [
        // Maintenance starts in this month
        {
          startDate: { gte: startOfMonth, lte: endOfMonth },
        },
        // Maintenance ends in this month
        {
          endDate: { gte: startOfMonth, lte: endOfMonth },
        },
        // Maintenance spans the entire month
        {
          startDate: { lte: startOfMonth },
          OR: [
            { endDate: null },
            { endDate: { gte: endOfMonth } },
          ],
        },
        // Indefinite maintenance that started before this month
        {
          startDate: { lte: endOfMonth },
          endDate: null,
        },
      ],
    },
    orderBy: { startDate: 'asc' },
  })

  return maintenances.map((m) => ({
    startDate: m.startDate.toISOString().split('T')[0],
    endDate: m.endDate ? m.endDate.toISOString().split('T')[0] : null,
    reason: m.reason,
  }))
}

/**
 * Check if a specific date is in a maintenance period
 */
export const isDateInMaintenance = async (
  productId: string,
  date: Date
): Promise<{ inMaintenance: boolean; reason?: string }> => {
  const checkDate = new Date(date)
  checkDate.setUTCHours(0, 0, 0, 0)

  const maintenance = await prisma.productMaintenance.findFirst({
    where: {
      productId,
      startDate: { lte: checkDate },
      endedAt: null,
      OR: [
        { endDate: null },
        { endDate: { gte: checkDate } },
      ],
    },
  })

  if (maintenance) {
    return { inMaintenance: true, reason: maintenance.reason || undefined }
  }

  return { inMaintenance: false }
}
