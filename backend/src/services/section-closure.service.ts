// src/services/section-closure.service.ts

import { prisma } from '../utils/prisma.js'
import { logAudit } from './audit.service.js'

const startOfDay = (date: Date): Date => {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

// ============================================
// LIST CLOSURES
// ============================================

interface ListClosuresParams {
  sectionId: string
  includeExpired?: boolean
}

export const listClosures = async (params: ListClosuresParams) => {
  const { sectionId, includeExpired = true } = params

  const where: any = { sectionId }

  if (!includeExpired) {
    const today = startOfDay(new Date())
    where.endDate = { gte: today }
  }

  const closures = await prisma.sectionClosure.findMany({
    where,
    orderBy: { startDate: 'asc' },
  })

  return closures
}

// ============================================
// GET CLOSURE BY ID
// ============================================

export const getClosureById = async (id: string) => {
  const closure = await prisma.sectionClosure.findUnique({
    where: { id },
    include: {
      section: { select: { id: true, name: true } },
    },
  })

  if (!closure) {
    throw { statusCode: 404, message: 'Période de fermeture introuvable', code: 'NOT_FOUND' }
  }

  return closure
}

// ============================================
// CREATE CLOSURE
// ============================================

interface CreateClosureParams {
  sectionId: string
  startDate: string
  endDate: string
  reason: string
  adminId: string
}

interface ConflictingReservation {
  id: string
  startDate: Date
  endDate: Date
  user: { firstName: string; lastName: string; email: string }
  product: { name: string }
}

export const createClosure = async (params: CreateClosureParams) => {
  const { sectionId, startDate, endDate, reason, adminId } = params

  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)

  // Validate section exists
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { id: true, name: true },
  })

  if (!section) {
    throw { statusCode: 404, message: 'Section introuvable', code: 'NOT_FOUND' }
  }

  // Validate dates
  if (end < start) {
    throw {
      statusCode: 400,
      message: 'La date de fin doit être après ou égale à la date de début',
      code: 'VALIDATION_ERROR',
    }
  }

  // Check for overlapping closures
  const overlappingClosure = await prisma.sectionClosure.findFirst({
    where: {
      sectionId,
      startDate: { lte: end },
      endDate: { gte: start },
    },
  })

  if (overlappingClosure) {
    throw {
      statusCode: 409,
      message: 'Une période de fermeture existe déjà sur ces dates',
      code: 'CONFLICT',
    }
  }

  // Check for conflicting reservations (checkout or return in closure period)
  // We need reservations where:
  // - startDate (checkout) is within the closure period, OR
  // - endDate (return) is within the closure period
  const conflictingReservations = await prisma.reservation.findMany({
    where: {
      product: { sectionId },
      status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
      OR: [
        // Checkout falls within closure
        { startDate: { gte: start, lte: end } },
        // Return falls within closure
        { endDate: { gte: start, lte: end } },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      product: { select: { name: true } },
    },
  })

  // Create the closure
  const closure = await prisma.sectionClosure.create({
    data: {
      sectionId,
      startDate: start,
      endDate: end,
      reason,
      createdBy: adminId,
    },
  })

  await logAudit({
    performedBy: adminId,
    action: 'SECTION_CLOSURE_CREATE',
    targetType: 'SectionClosure',
    targetId: closure.id,
    metadata: {
      sectionId,
      sectionName: section.name,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      reason,
      conflictingReservationsCount: conflictingReservations.length,
    },
  })

  return {
    closure,
    warnings: conflictingReservations.length > 0
      ? {
          message: `${conflictingReservations.length} réservation(s) existante(s) ont un retrait ou retour pendant cette période`,
          reservations: conflictingReservations as ConflictingReservation[],
        }
      : null,
  }
}

// ============================================
// UPDATE CLOSURE
// ============================================

interface UpdateClosureParams {
  closureId: string
  startDate?: string
  endDate?: string
  reason?: string
  adminId: string
}

export const updateClosure = async (params: UpdateClosureParams) => {
  const { closureId, startDate, endDate, reason, adminId } = params

  const closure = await prisma.sectionClosure.findUnique({
    where: { id: closureId },
    include: { section: { select: { id: true, name: true } } },
  })

  if (!closure) {
    throw { statusCode: 404, message: 'Période de fermeture introuvable', code: 'NOT_FOUND' }
  }

  const newStart = startDate ? parseLocalDate(startDate) : closure.startDate
  const newEnd = endDate ? parseLocalDate(endDate) : closure.endDate

  // Validate dates
  if (newEnd < newStart) {
    throw {
      statusCode: 400,
      message: 'La date de fin doit être après ou égale à la date de début',
      code: 'VALIDATION_ERROR',
    }
  }

  // Check for overlapping closures (excluding current one)
  const overlappingClosure = await prisma.sectionClosure.findFirst({
    where: {
      sectionId: closure.sectionId,
      id: { not: closureId },
      startDate: { lte: newEnd },
      endDate: { gte: newStart },
    },
  })

  if (overlappingClosure) {
    throw {
      statusCode: 409,
      message: 'Une autre période de fermeture existe déjà sur ces dates',
      code: 'CONFLICT',
    }
  }

  // Check for conflicting reservations
  const conflictingReservations = await prisma.reservation.findMany({
    where: {
      product: { sectionId: closure.sectionId },
      status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
      OR: [
        { startDate: { gte: newStart, lte: newEnd } },
        { endDate: { gte: newStart, lte: newEnd } },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      product: { select: { name: true } },
    },
  })

  const updateData: any = {}
  if (startDate) updateData.startDate = newStart
  if (endDate) updateData.endDate = newEnd
  if (reason !== undefined) updateData.reason = reason

  const updatedClosure = await prisma.sectionClosure.update({
    where: { id: closureId },
    data: updateData,
  })

  await logAudit({
    performedBy: adminId,
    action: 'SECTION_CLOSURE_UPDATE',
    targetType: 'SectionClosure',
    targetId: closureId,
    metadata: {
      sectionId: closure.sectionId,
      sectionName: closure.section.name,
      changes: updateData,
      conflictingReservationsCount: conflictingReservations.length,
    },
  })

  return {
    closure: updatedClosure,
    warnings: conflictingReservations.length > 0
      ? {
          message: `${conflictingReservations.length} réservation(s) existante(s) ont un retrait ou retour pendant cette période`,
          reservations: conflictingReservations as ConflictingReservation[],
        }
      : null,
  }
}

// ============================================
// DELETE CLOSURE
// ============================================

interface DeleteClosureParams {
  closureId: string
  adminId: string
}

export const deleteClosure = async (params: DeleteClosureParams) => {
  const { closureId, adminId } = params

  const closure = await prisma.sectionClosure.findUnique({
    where: { id: closureId },
    include: { section: { select: { id: true, name: true } } },
  })

  if (!closure) {
    throw { statusCode: 404, message: 'Période de fermeture introuvable', code: 'NOT_FOUND' }
  }

  // Check if closure is in the past (cannot delete past closures)
  const today = startOfDay(new Date())
  const closureEnd = startOfDay(closure.endDate)

  if (closureEnd < today) {
    throw {
      statusCode: 400,
      message: 'Impossible de supprimer une période de fermeture passée',
      code: 'VALIDATION_ERROR',
    }
  }

  await prisma.sectionClosure.delete({
    where: { id: closureId },
  })

  await logAudit({
    performedBy: adminId,
    action: 'SECTION_CLOSURE_DELETE',
    targetType: 'SectionClosure',
    targetId: closureId,
    metadata: {
      sectionId: closure.sectionId,
      sectionName: closure.section.name,
      startDate: closure.startDate.toISOString(),
      endDate: closure.endDate.toISOString(),
      reason: closure.reason,
    },
  })

  return { success: true }
}

// ============================================
// CHECK IF DATE IS IN CLOSURE
// ============================================

export const isDateInClosure = async (sectionId: string, date: Date): Promise<{ closed: boolean; reason?: string }> => {
  const checkDate = startOfDay(date)

  const closure = await prisma.sectionClosure.findFirst({
    where: {
      sectionId,
      startDate: { lte: checkDate },
      endDate: { gte: checkDate },
    },
  })

  if (closure) {
    return { closed: true, reason: closure.reason }
  }

  return { closed: false }
}

// ============================================
// CHECK IF DATES CONFLICT WITH CLOSURE
// (For reservation validation - checks if startDate OR endDate is in a closure)
// ============================================

export const checkDatesForClosure = async (
  sectionId: string,
  startDate: Date,
  endDate: Date
): Promise<{ hasConflict: boolean; closureReason?: string; conflictType?: 'checkout' | 'return' }> => {
  const start = startOfDay(startDate)
  const end = startOfDay(endDate)

  // Check if checkout date (startDate) is in a closure
  const checkoutClosure = await prisma.sectionClosure.findFirst({
    where: {
      sectionId,
      startDate: { lte: start },
      endDate: { gte: start },
    },
  })

  if (checkoutClosure) {
    return {
      hasConflict: true,
      closureReason: checkoutClosure.reason,
      conflictType: 'checkout',
    }
  }

  // Check if return date (endDate) is in a closure
  const returnClosure = await prisma.sectionClosure.findFirst({
    where: {
      sectionId,
      startDate: { lte: end },
      endDate: { gte: end },
    },
  })

  if (returnClosure) {
    return {
      hasConflict: true,
      closureReason: returnClosure.reason,
      conflictType: 'return',
    }
  }

  return { hasConflict: false }
}

// ============================================
// GET CLOSURES FOR MONTH (for calendar)
// ============================================

export const getClosuresForMonth = async (sectionId: string, month: string) => {
  const [year, monthNum] = month.split('-').map(Number)
  const startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0))
  const endOfMonth = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999))

  const closures = await prisma.sectionClosure.findMany({
    where: {
      sectionId,
      OR: [
        // Closure starts in the month
        { startDate: { gte: startOfMonth, lte: endOfMonth } },
        // Closure ends in the month
        { endDate: { gte: startOfMonth, lte: endOfMonth } },
        // Closure spans the entire month
        { startDate: { lte: startOfMonth }, endDate: { gte: endOfMonth } },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      reason: true,
    },
  })

  return closures
}

// ============================================
// GET CURRENT CLOSURE (if section is currently closed)
// ============================================

export const getCurrentClosure = async (sectionId: string) => {
  const today = startOfDay(new Date())

  const closure = await prisma.sectionClosure.findFirst({
    where: {
      sectionId,
      startDate: { lte: today },
      endDate: { gte: today },
    },
  })

  return closure
}
