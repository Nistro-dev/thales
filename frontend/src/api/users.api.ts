import { get, post, patch } from './client'
import type { User } from '@/types'

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  phone?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface CreditTransaction {
  id: string
  userId: string
  amount: number
  balanceAfter: number
  type: string
  reason?: string
  performedBy?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CreditTransactionsData {
  transactions: CreditTransaction[]
}

export const usersApi = {
  // Get current user profile (using existing auth/me endpoint)
  getProfile: () => get<{ user: User }>('/auth/me'),

  // Update current user's profile
  updateProfile: (data: UpdateProfileInput) => patch<{ user: User }>('/users/me', data),

  // Change password - requires backend endpoint to be added
  changePassword: (data: ChangePasswordInput) => post<Record<string, never>>('/auth/change-password', data),

  // Get current user's credit transactions (no special permission required)
  getMyCreditTransactions: (page = 1, limit = 20) =>
    get<CreditTransactionsData>('/users/me/credits/transactions', { page, limit }),

  // Get credit transactions for a specific user (requires VIEW_CREDITS permission)
  getCreditTransactions: (userId: string, page = 1, limit = 20) =>
    get<CreditTransactionsData>(`/users/${userId}/credits/transactions`, { page, limit }),
}
