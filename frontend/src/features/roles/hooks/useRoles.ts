import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rolesApi } from '@/api/roles.api'
import type { CreateRoleRequest, UpdateRoleRequest, AssignRoleRequest, RevokeRoleRequest } from '@/api/roles.api'
import toast from 'react-hot-toast'

// Query keys
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (includeSystem: boolean) => [...roleKeys.lists(), { includeSystem }] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
  permissions: () => [...roleKeys.all, 'permissions'] as const,
  userRoles: (userId: string) => [...roleKeys.all, 'user', userId] as const,
}

// Get all roles
export function useRoles(includeSystem = true) {
  return useQuery({
    queryKey: roleKeys.list(includeSystem),
    queryFn: () => rolesApi.getRoles(includeSystem),
  })
}

// Get role by ID
export function useRole(id: string | undefined) {
  return useQuery({
    queryKey: roleKeys.detail(id!),
    queryFn: () => rolesApi.getRole(id!),
    enabled: !!id,
  })
}

// Get all permissions
export function usePermissions() {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: () => rolesApi.getPermissions(),
    staleTime: 1000 * 60 * 60, // 1 hour - permissions rarely change
  })
}

// Get user's roles
export function useUserRoles(userId: string | undefined) {
  return useQuery({
    queryKey: roleKeys.userRoles(userId!),
    queryFn: () => rolesApi.getUserRoles(userId!),
    enabled: !!userId,
  })
}

// Create role mutation
export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      toast.success('Rôle créé avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la création du rôle')
    },
  })
}

// Update role mutation
export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleRequest }) =>
      rolesApi.updateRole(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) })
      toast.success('Rôle mis à jour avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du rôle')
    },
  })
}

// Delete role mutation
export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rolesApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      toast.success('Rôle supprimé avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du rôle')
    },
  })
}

// Assign role to user mutation
export function useAssignRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AssignRoleRequest }) =>
      rolesApi.assignRole(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roleKeys.userRoles(userId) })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success('Rôle assigné avec succès')
    },
    onError: () => {
      toast.error("Erreur lors de l'assignation du rôle")
    },
  })
}

// Revoke role from user mutation
export function useRevokeRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: RevokeRoleRequest }) =>
      rolesApi.revokeRole(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roleKeys.userRoles(userId) })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success('Rôle révoqué avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la révocation du rôle')
    },
  })
}
