import { z } from 'zod'
import { UserStatus, CautionStatus } from '@prisma/client'

export const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phone: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  firstName: z.string().min(1, 'Le prénom est requis').optional(),
  lastName: z.string().min(1, 'Le nom est requis').optional(),
  phone: z.string().optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const changeUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
})

export type ChangeUserStatusInput = z.infer<typeof changeUserStatusSchema>

export const getUsersQuerySchema = z.object({
  status: z.nativeEnum(UserStatus).optional(),
  cautionStatus: z.nativeEnum(CautionStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>

export const userIdParamSchema = z.object({
  id: z.string().uuid('ID utilisateur invalide'),
})

export type UserIdParam = z.infer<typeof userIdParamSchema>

export const adjustCreditsSchema = z.object({
  amount: z.number().int('Le montant doit être un entier'),
  reason: z.string().optional(),
})

export type AdjustCreditsInput = z.infer<typeof adjustCreditsSchema>

export const getCreditTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type GetCreditTransactionsQuery = z.infer<typeof getCreditTransactionsQuerySchema>
