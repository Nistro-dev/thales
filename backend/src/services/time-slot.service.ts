// src/services/time-slot.service.ts

import { SlotType } from '@prisma/client'
import { prisma } from '../utils/prisma.js'
import { logAudit } from './audit.service.js'

// ============================================
// HELPERS
// ============================================

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/**
 * Check if a time string (HH:mm) is within a time slot
 */
export const isTimeInSlot = (time: string, slotStart: string, slotEnd: string): boolean => {
  return time >= slotStart && time <= slotEnd
}

// ============================================
// LIST TIME SLOTS
// ============================================

interface ListTimeSlotsParams {
  sectionId: string
  type?: SlotType
}

export const listTimeSlots = async (params: ListTimeSlotsParams) => {
  const { sectionId, type } = params

  const where: any = { sectionId }
  if (type) {
    where.type = type
  }

  const timeSlots = await prisma.timeSlot.findMany({
    where,
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  return timeSlots
}

// ============================================
// GET TIME SLOTS FOR A SPECIFIC DAY
// ============================================

export const getTimeSlotsForDay = async (
  sectionId: string,
  type: SlotType,
  dayOfWeek: number
) => {
  const timeSlots = await prisma.timeSlot.findMany({
    where: {
      sectionId,
      type,
      dayOfWeek,
    },
    orderBy: { startTime: 'asc' },
  })

  return timeSlots
}

// ============================================
// GET TIME SLOT BY ID
// ============================================

export const getTimeSlotById = async (id: string) => {
  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id },
    include: {
      section: { select: { id: true, name: true } },
    },
  })

  if (!timeSlot) {
    throw { statusCode: 404, message: 'Créneau horaire introuvable', code: 'NOT_FOUND' }
  }

  return timeSlot
}

// ============================================
// CREATE TIME SLOT
// ============================================

interface CreateTimeSlotParams {
  sectionId: string
  type: SlotType
  dayOfWeek: number
  startTime: string
  endTime: string
  adminId: string
}

export const createTimeSlot = async (params: CreateTimeSlotParams) => {
  const { sectionId, type, dayOfWeek, startTime, endTime, adminId } = params

  // Validate section exists
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { id: true, name: true },
  })

  if (!section) {
    throw { statusCode: 404, message: 'Section introuvable', code: 'NOT_FOUND' }
  }

  // Check for overlapping time slots on the same day and type
  const overlappingSlot = await prisma.timeSlot.findFirst({
    where: {
      sectionId,
      type,
      dayOfWeek,
      OR: [
        // New slot starts within existing slot
        { startTime: { lte: startTime }, endTime: { gt: startTime } },
        // New slot ends within existing slot
        { startTime: { lt: endTime }, endTime: { gte: endTime } },
        // New slot contains existing slot
        { startTime: { gte: startTime }, endTime: { lte: endTime } },
      ],
    },
  })

  if (overlappingSlot) {
    throw {
      statusCode: 409,
      message: `Un créneau existe déjà le ${DAY_NAMES[dayOfWeek]} de ${overlappingSlot.startTime} à ${overlappingSlot.endTime}`,
      code: 'CONFLICT',
    }
  }

  const timeSlot = await prisma.timeSlot.create({
    data: {
      sectionId,
      type,
      dayOfWeek,
      startTime,
      endTime,
    },
  })

  await logAudit({
    performedBy: adminId,
    action: 'SECTION_TIMESLOT_CREATE',
    targetType: 'TimeSlot',
    targetId: timeSlot.id,
    metadata: {
      sectionId,
      sectionName: section.name,
      type,
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek],
      startTime,
      endTime,
    },
  })

  return timeSlot
}

// ============================================
// UPDATE TIME SLOT
// ============================================

interface UpdateTimeSlotParams {
  timeSlotId: string
  type?: SlotType
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  adminId: string
}

export const updateTimeSlot = async (params: UpdateTimeSlotParams) => {
  const { timeSlotId, type, dayOfWeek, startTime, endTime, adminId } = params

  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: timeSlotId },
    include: { section: { select: { id: true, name: true } } },
  })

  if (!timeSlot) {
    throw { statusCode: 404, message: 'Créneau horaire introuvable', code: 'NOT_FOUND' }
  }

  const newType = type ?? timeSlot.type
  const newDayOfWeek = dayOfWeek ?? timeSlot.dayOfWeek
  const newStartTime = startTime ?? timeSlot.startTime
  const newEndTime = endTime ?? timeSlot.endTime

  // Validate times
  if (newStartTime >= newEndTime) {
    throw {
      statusCode: 400,
      message: "L'heure de fin doit être après l'heure de début",
      code: 'VALIDATION_ERROR',
    }
  }

  // Check for overlapping time slots (excluding current one)
  const overlappingSlot = await prisma.timeSlot.findFirst({
    where: {
      sectionId: timeSlot.sectionId,
      type: newType,
      dayOfWeek: newDayOfWeek,
      id: { not: timeSlotId },
      OR: [
        { startTime: { lte: newStartTime }, endTime: { gt: newStartTime } },
        { startTime: { lt: newEndTime }, endTime: { gte: newEndTime } },
        { startTime: { gte: newStartTime }, endTime: { lte: newEndTime } },
      ],
    },
  })

  if (overlappingSlot) {
    throw {
      statusCode: 409,
      message: `Un créneau existe déjà le ${DAY_NAMES[newDayOfWeek]} de ${overlappingSlot.startTime} à ${overlappingSlot.endTime}`,
      code: 'CONFLICT',
    }
  }

  const updateData: any = {}
  if (type !== undefined) updateData.type = type
  if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek
  if (startTime !== undefined) updateData.startTime = startTime
  if (endTime !== undefined) updateData.endTime = endTime

  const updatedTimeSlot = await prisma.timeSlot.update({
    where: { id: timeSlotId },
    data: updateData,
  })

  await logAudit({
    performedBy: adminId,
    action: 'SECTION_TIMESLOT_UPDATE',
    targetType: 'TimeSlot',
    targetId: timeSlotId,
    metadata: {
      sectionId: timeSlot.sectionId,
      sectionName: timeSlot.section.name,
      changes: updateData,
    },
  })

  return updatedTimeSlot
}

// ============================================
// DELETE TIME SLOT
// ============================================

interface DeleteTimeSlotParams {
  timeSlotId: string
  adminId: string
}

export const deleteTimeSlot = async (params: DeleteTimeSlotParams) => {
  const { timeSlotId, adminId } = params

  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: timeSlotId },
    include: { section: { select: { id: true, name: true } } },
  })

  if (!timeSlot) {
    throw { statusCode: 404, message: 'Créneau horaire introuvable', code: 'NOT_FOUND' }
  }

  await prisma.timeSlot.delete({
    where: { id: timeSlotId },
  })

  await logAudit({
    performedBy: adminId,
    action: 'SECTION_TIMESLOT_DELETE',
    targetType: 'TimeSlot',
    targetId: timeSlotId,
    metadata: {
      sectionId: timeSlot.sectionId,
      sectionName: timeSlot.section.name,
      type: timeSlot.type,
      dayOfWeek: timeSlot.dayOfWeek,
      dayName: DAY_NAMES[timeSlot.dayOfWeek],
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
    },
  })

  return { success: true }
}

// ============================================
// VALIDATE TIME IN SLOT
// (Used by reservation service)
// ============================================

interface ValidateTimeParams {
  sectionId: string
  type: SlotType
  dayOfWeek: number
  time: string
}

interface TimeValidationResult {
  valid: boolean
  error?: string
  availableSlots?: Array<{ startTime: string; endTime: string }>
}

export const validateTimeInSlot = async (params: ValidateTimeParams): Promise<TimeValidationResult> => {
  const { sectionId, type, dayOfWeek, time } = params

  const slots = await getTimeSlotsForDay(sectionId, type, dayOfWeek)

  // If no slots are defined for this day, any time is valid (retrocompatibility)
  if (slots.length === 0) {
    return { valid: true }
  }

  // Check if time is within any slot
  const isValid = slots.some((slot) => isTimeInSlot(time, slot.startTime, slot.endTime))

  if (!isValid) {
    const typeLabel = type === 'CHECKOUT' ? 'retrait' : 'retour'
    const slotsDescription = slots
      .map((s) => `${s.startTime}-${s.endTime}`)
      .join(', ')

    return {
      valid: false,
      error: `L'heure de ${typeLabel} ${time} n'est pas dans un créneau autorisé. Créneaux disponibles le ${DAY_NAMES[dayOfWeek]}: ${slotsDescription}`,
      availableSlots: slots.map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
    }
  }

  return { valid: true }
}

// ============================================
// GET TIME SLOTS GROUPED BY DAY
// (Useful for admin UI)
// ============================================

export const getTimeSlotsGroupedByDay = async (sectionId: string, type?: SlotType) => {
  const slots = await listTimeSlots({ sectionId, type })

  const grouped: Record<number, typeof slots> = {}

  for (let day = 0; day <= 6; day++) {
    grouped[day] = slots.filter((s) => s.dayOfWeek === day)
  }

  return grouped
}
