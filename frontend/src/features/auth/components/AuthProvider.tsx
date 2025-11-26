import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/api/client'
import type { ApiResponse, User } from '@/types'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      try {
        // This will automatically refresh the token if it's expired
        // The interceptor handles the refresh logic
        // Skip error toasts during initial auth check
        const { data } = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me', {
          skipErrorToast: true,
        })
        setUser(data.data?.user || null)
      } catch (error) {
        // If the token refresh fails, the user is truly not authenticated
        setUser(null)
      }
    }

    initAuth()
  }, [setUser, setLoading])

  return <>{children}</>
}
