import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  adminUsersApi,
  rolesApi,
  usersApi,
  invitationsApi,
  type UserFilters,
  type UpdateUserInput,
  type AdjustCreditsInput,
  type UserStatus,
} from '@/api/users.api'

// ============================================
// QUERY KEYS
// ============================================

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  reservations: (id: string) => [...userKeys.detail(id), 'reservations'] as const,
  creditTransactions: (id: string) => [...userKeys.detail(id), 'credits'] as const,
  roles: () => ['roles'] as const,
}

// ============================================
// LIST USERS
// ============================================

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => adminUsersApi.getUsers(filters),
    select: (response) => response.data,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// ============================================
// GET USER DETAIL
// ============================================

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn: () => adminUsersApi.getUser(id!),
    select: (response) => response.data,
    enabled: !!id,
  })
}

// ============================================
// INVITE USER
// ============================================

export function useInviteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (email: string) => invitationsApi.create(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      toast.success('Invitation envoyée avec succès')
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de l'invitation")
    },
  })
}

// ============================================
// PENDING INVITATIONS
// ============================================

export function usePendingInvitations() {
  return useQuery({
    queryKey: ['invitations', 'pending'],
    queryFn: () => invitationsApi.listPending(),
    select: (response) => response.data,
  })
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => invitationsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      toast.success('Invitation annulée')
    },
    onError: () => {
      toast.error("Erreur lors de l'annulation de l'invitation")
    },
  })
}

// ============================================
// UPDATE USER
// ============================================

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      adminUsersApi.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      toast.success('Utilisateur mis à jour')
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de l'utilisateur")
    },
  })
}

// ============================================
// UPDATE USER STATUS (SUSPEND/ACTIVATE)
// ============================================

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      adminUsersApi.updateUserStatus(id, status),
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      const message =
        status === 'ACTIVE'
          ? 'Utilisateur activé'
          : status === 'SUSPENDED'
            ? 'Utilisateur suspendu'
            : 'Utilisateur désactivé'
      toast.success(message)
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du statut de l'utilisateur")
    },
  })
}

// ============================================
// DELETE USER
// ============================================

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminUsersApi.deleteUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      toast.success('Utilisateur supprimé')
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de l'utilisateur")
    },
  })
}

// ============================================
// ADJUST CREDITS
// ============================================

export function useAdjustCredits() {
  const queryClient = useQueryClient()
  // Import lazily to avoid circular dependencies
  const refreshAuthUser = async () => {
    const { useAuthStore } = await import('@/stores/auth.store')
    await useAuthStore.getState().refreshUser()
  }

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdjustCreditsInput }) =>
      adminUsersApi.adjustCredits(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.creditTransactions(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      // Refresh auth user to update credits in sidebar
      refreshAuthUser()
      toast.success('Crédits ajustés avec succès')
    },
    onError: () => {
      toast.error("Erreur lors de l'ajustement des crédits")
    },
  })
}

// ============================================
// GET USER CREDIT TRANSACTIONS
// ============================================

export function useUserCreditTransactions(userId: string | undefined, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...userKeys.creditTransactions(userId!), { page, limit }],
    queryFn: () => usersApi.getCreditTransactions(userId!, page, limit),
    select: (response) => response.data,
    enabled: !!userId,
  })
}

// ============================================
// GET USER RESERVATIONS
// ============================================

export function useUserReservations(userId: string | undefined, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...userKeys.reservations(userId!), { page, limit }],
    queryFn: () => adminUsersApi.getUserReservations(userId!, { page, limit }),
    // Backend returns reservations directly in data array, wrap it for component compatibility
    select: (response) => ({ reservations: response.data }),
    enabled: !!userId,
  })
}

// ============================================
// CAUTION MANAGEMENT
// ============================================

export function useValidateCaution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminUsersApi.validateCaution(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('Caution validée')
    },
    onError: () => {
      toast.error('Erreur lors de la validation de la caution')
    },
  })
}

export function useExemptCaution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminUsersApi.exemptCaution(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('Utilisateur exempté de caution')
    },
    onError: () => {
      toast.error("Erreur lors de l'exemption de caution")
    },
  })
}

export function useResetCaution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminUsersApi.resetCaution(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('Caution réinitialisée')
    },
    onError: () => {
      toast.error('Erreur lors de la réinitialisation de la caution')
    },
  })
}

// ============================================
// ROLE MANAGEMENT
// ============================================

export function useRoles() {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: () => rolesApi.getRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAssignRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      adminUsersApi.assignRole(userId, roleId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) })
      toast.success('Rôle assigné')
    },
    onError: () => {
      toast.error("Erreur lors de l'assignation du rôle")
    },
  })
}

export function useRevokeRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      adminUsersApi.revokeRole(userId, roleId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) })
      toast.success('Rôle révoqué')
    },
    onError: () => {
      toast.error('Erreur lors de la révocation du rôle')
    },
  })
}
