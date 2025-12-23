import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const createReservationSchema = z.object({
  productId: z.string().uuid(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Format de date invalide',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Format de date invalide',
  }),
  startTime: z.string().regex(timeRegex, 'Format HH:mm requis').optional(),
  endTime: z.string().regex(timeRegex, 'Format HH:mm requis').optional(),
  notes: z.string().max(500).optional(),
})

export const createReservationAdminSchema = createReservationSchema.extend({
  userId: z.string().uuid(),
  adminNotes: z.string().max(1000).optional(),
  status: z.enum(['CONFIRMED', 'CHECKED_OUT', 'RETURNED']).optional(),
})

export const updateReservationSchema = z.object({
  startDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Format de date invalide',
    })
    .optional(),
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Format de date invalide',
    })
    .optional(),
  notes: z.string().max(500).optional(),
  adminNotes: z.string().max(1000).optional(),
})

export const cancelReservationSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const listReservationsSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z.enum(['CONFIRMED', 'CHECKED_OUT', 'RETURNED', 'CANCELLED', 'REFUNDED']).optional(),
  userId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  startDateFrom: z.string().optional(),
  startDateTo: z.string().optional(),
  overdue: z.enum(['checkouts', 'returns']).optional(),
  sortBy: z.enum(['createdAt', 'startDate', 'endDate']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const availabilitySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'),
})

export const refundReservationSchema = z.object({
  amount: z.number().int().min(1).optional(),
  reason: z.string().max(500).optional(),
})

export const penaltyReservationSchema = z.object({
  amount: z.number().int().min(1, 'Le montant doit être supérieur à 0'),
  reason: z.string().min(1, 'Le motif est obligatoire').max(500),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>
export type CreateReservationAdminInput = z.infer<typeof createReservationAdminSchema>
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>
export type CancelReservationInput = z.infer<typeof cancelReservationSchema>
export type ListReservationsInput = z.infer<typeof listReservationsSchema>
export type AvailabilityInput = z.infer<typeof availabilitySchema>
export type RefundReservationInput = z.infer<typeof refundReservationSchema>
export type PenaltyReservationInput = z.infer<typeof penaltyReservationSchema>
