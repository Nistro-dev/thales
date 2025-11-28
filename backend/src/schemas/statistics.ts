// src/schemas/statistics.ts

import { z } from 'zod'

// Date range validation
const dateRangeSchema = z.object({
  from: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Format de date invalide pour "from"',
  }),
  to: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Format de date invalide pour "to"',
  }),
})

// Dashboard stats query
export const dashboardStatsSchema = dateRangeSchema

// Top products query
export const topProductsSchema = dateRangeSchema.extend({
  limit: z
    .string()
    .transform(Number)
    .default('10')
    .refine((val) => val > 0 && val <= 100, {
      message: 'La limite doit être entre 1 et 100',
    }),
})

// Top users query
export const topUsersSchema = dateRangeSchema.extend({
  limit: z
    .string()
    .transform(Number)
    .default('10')
    .refine((val) => val > 0 && val <= 100, {
      message: 'La limite doit être entre 1 et 100',
    }),
})

// Sections stats query
export const sectionsStatsSchema = dateRangeSchema

// Export query
export const exportStatsSchema = dateRangeSchema.extend({
  format: z.enum(['csv', 'xlsx']),
  type: z.enum(['reservations', 'products', 'users', 'movements']),
})

// Type exports
export type DashboardStatsInput = z.infer<typeof dashboardStatsSchema>
export type TopProductsInput = z.infer<typeof topProductsSchema>
export type TopUsersInput = z.infer<typeof topUsersSchema>
export type SectionsStatsInput = z.infer<typeof sectionsStatsSchema>
export type ExportStatsInput = z.infer<typeof exportStatsSchema>
