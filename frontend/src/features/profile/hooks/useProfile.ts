import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi, type UpdateProfileInput, type ChangePasswordInput } from '@/api/users.api'
import { useAuthStore } from '@/stores/auth.store'
import toast from 'react-hot-toast'

/**
 * Get current user profile
 */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await usersApi.getProfile()
      return response.data!.user
    },
    enabled,
  })
}

/**
 * Update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const response = await usersApi.updateProfile(data)
      return response.data!.user
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      useAuthStore.getState().setUser(user)
      toast.success('Profil mis à jour')
    },
  })
}

/**
 * Change user password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      await usersApi.changePassword(data)
    },
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès')
    },
  })
}

/**
 * Get current user's credit transactions history
 */
export function useMyCreditTransactions(page = 1, limit = 20, enabled = true) {
  return useQuery({
    queryKey: ['my-credit-transactions', page, limit],
    queryFn: async () => {
      const response = await usersApi.getMyCreditTransactions(page, limit)
      return {
        transactions: response.data!.transactions,
        pagination: response.meta?.pagination,
      }
    },
    enabled,
  })
}
