// src/schemas/movement.ts

import { z } from 'zod'

export const productConditionEnum = z.enum([
  'OK',
  'MINOR_DAMAGE',
  'MAJOR_DAMAGE',
  'MISSING_PARTS',
  'BROKEN',
])

export const checkoutSchema = z.object({
  notes: z.string().max(500).optional(),
})

export const movementPhotoSchema = z.object({
  s3Key: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
})

export const returnSchema = z.object({
  condition: productConditionEnum.default('OK'),
  notes: z.string().max(500).optional(),
  photos: z.array(movementPhotoSchema).max(3).optional(),
})

export const listMovementsSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  productId: z.string().uuid().optional(),
  reservationId: z.string().uuid().optional(),
  type: z.enum(['CHECKOUT', 'RETURN']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
export type ReturnInput = z.infer<typeof returnSchema>
export type ListMovementsInput = z.infer<typeof listMovementsSchema>