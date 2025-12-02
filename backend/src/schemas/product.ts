import { z } from 'zod'

export const listProductsSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  sectionId: z.string().uuid().optional(),
  subSectionId: z.string().uuid().optional(),
  status: z.enum(['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE', 'ARCHIVED']).optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  sortBy: z.enum(['createdAt', 'name', 'priceCredits']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  reference: z.string().max(100).optional(),
  priceCredits: z.number().int().min(0),
  creditPeriod: z.enum(['DAY', 'WEEK']).default('DAY'),
  minDuration: z.number().int().min(1).default(1),
  maxDuration: z.number().int().min(0).default(0), // 0 = unlimited
  sectionId: z.string().uuid(),
  subSectionId: z.string().uuid().optional(),
  attributes: z
    .array(
      z.object({
        key: z.string().min(1).max(50),
        value: z.string().min(1).max(500),
      })
    )
    .optional(),
})

export const updateProductSchema = createProductSchema.partial()

export const changeProductStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE', 'ARCHIVED']),
})

export const productAttributeSchema = z.object({
  key: z.string().min(1).max(50),
  value: z.string().min(1).max(500),
})

export const reorderFilesSchema = z.object({
  fileIds: z.array(z.string().uuid()),
})

export const setFileVisibilitySchema = z.object({
  visibility: z.enum(['PUBLIC', 'ADMIN']),
})

export const renameFileSchema = z.object({
  filename: z.string().min(1).max(255),
})

export type ListProductsInput = z.infer<typeof listProductsSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ChangeProductStatusInput = z.infer<typeof changeProductStatusSchema>
export type ProductAttributeInput = z.infer<typeof productAttributeSchema>
export type ReorderFilesInput = z.infer<typeof reorderFilesSchema>
export type SetFileVisibilityInput = z.infer<typeof setFileVisibilitySchema>
export type RenameFileInput = z.infer<typeof renameFileSchema>
