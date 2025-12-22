import { z } from 'zod'

export const createSectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  allowedDaysIn: z.array(z.number().min(0).max(6)).optional(),
  allowedDaysOut: z.array(z.number().min(0).max(6)).optional(),
  refundDeadlineHours: z.number().int().min(0).default(48),
  sortOrder: z.number().int().optional(),
})

export const updateSectionSchema = createSectionSchema.partial()

export const createSubSectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
})

export const updateSubSectionSchema = createSubSectionSchema.partial().extend({
  sectionId: z.string().uuid().optional(),
})

// TimeSlot schemas
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const createTimeSlotSchema = z
  .object({
    type: z.enum(['CHECKOUT', 'RETURN']),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(timeRegex, 'Format HH:mm requis (ex: 09:00)'),
    endTime: z.string().regex(timeRegex, 'Format HH:mm requis (ex: 18:00)'),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ['endTime'],
  })

export const updateTimeSlotSchema = z
  .object({
    type: z.enum(['CHECKOUT', 'RETURN']).optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startTime: z.string().regex(timeRegex, 'Format HH:mm requis (ex: 09:00)').optional(),
    endTime: z.string().regex(timeRegex, 'Format HH:mm requis (ex: 18:00)').optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime
      }
      return true
    },
    {
      message: "L'heure de fin doit être après l'heure de début",
      path: ['endTime'],
    }
  )

// Closure schemas
export const createClosureSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  reason: z.string().min(1).max(200),
})

export const updateClosureSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
  reason: z.string().min(1).max(200).optional(),
})

export type CreateSectionInput = z.infer<typeof createSectionSchema>
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>
export type CreateSubSectionInput = z.infer<typeof createSubSectionSchema>
export type UpdateSubSectionInput = z.infer<typeof updateSubSectionSchema>
export type CreateClosureInput = z.infer<typeof createClosureSchema>
export type UpdateClosureInput = z.infer<typeof updateClosureSchema>
export type CreateTimeSlotInput = z.infer<typeof createTimeSlotSchema>
export type UpdateTimeSlotInput = z.infer<typeof updateTimeSlotSchema>
