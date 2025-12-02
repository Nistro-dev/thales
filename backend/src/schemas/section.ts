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

export type CreateSectionInput = z.infer<typeof createSectionSchema>
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>
export type CreateSubSectionInput = z.infer<typeof createSubSectionSchema>
export type UpdateSubSectionInput = z.infer<typeof updateSubSectionSchema>
