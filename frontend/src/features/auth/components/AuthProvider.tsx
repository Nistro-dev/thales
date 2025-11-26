import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/api/client'
import type { ApiResponse, User } from '@/types'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me', {
          skipErrorHandling: true,
        })
        setUser(data.data?.user || null)
      } catch {
        // User not authenticated or backend not available
        setUser(null)
      }
    }

    initAuth()
  }, [setUser])

  return <>{children}</>
}
