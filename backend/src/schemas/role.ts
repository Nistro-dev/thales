import { z } from 'zod'

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  permissionKeys: z.array(z.string().min(1, 'Clé de permission invalide')),
  sectionIds: z.array(z.string().uuid('ID de section invalide')).optional(),
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>

export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  description: z.string().optional(),
  permissionKeys: z.array(z.string().min(1, 'Clé de permission invalide')).optional(),
  sectionIds: z.array(z.string().uuid('ID de section invalide')).optional(),
})

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>

export const roleIdParamSchema = z.object({
  id: z.string().uuid('ID de rôle invalide'),
})

export type RoleIdParam = z.infer<typeof roleIdParamSchema>

export const assignRoleSchema = z.object({
  roleId: z.string().uuid('ID de rôle invalide'),
  sectionId: z.string().uuid('ID de section invalide').optional(),
})

export type AssignRoleInput = z.infer<typeof assignRoleSchema>

export const revokeRoleSchema = z.object({
  roleId: z.string().uuid('ID de rôle invalide'),
})

export type RevokeRoleInput = z.infer<typeof revokeRoleSchema>

export const getRolesQuerySchema = z.object({
  includeSystem: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
})

export type GetRolesQuery = z.infer<typeof getRolesQuerySchema>
