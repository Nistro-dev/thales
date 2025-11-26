import { create } from 'zustand'
import type { User } from '@/types'
import type { Permission } from '@/constants/permissions'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  hasPermission: (permission) => {
    const { user } = get()
    if (!user || !user.roles || user.roles.length === 0) return false

    // Check if user has the permission in ANY of their roles
    return user.roles.some((role) =>
      role.permissions?.includes(permission)
    )
  },

  hasAnyPermission: (permissions) => {
    const { user } = get()
    if (!user || !user.roles || user.roles.length === 0) return false

    // Check if user has ANY of the required permissions across ALL their roles
    return permissions.some((permission) =>
      user.roles.some((role) => role.permissions?.includes(permission))
    )
  },

  hasAllPermissions: (permissions) => {
    const { user } = get()
    if (!user || !user.roles || user.roles.length === 0) return false

    // Get all permissions from all roles
    const allUserPermissions = user.roles.flatMap((role) => role.permissions || [])

    // Check if user has ALL required permissions
    return permissions.every((permission) =>
      allUserPermissions.includes(permission)
    )
  },
}))
