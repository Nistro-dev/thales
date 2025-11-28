import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/api/client'
import type { ApiResponse, User } from '@/types'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore()
  const initCalled = useRef(false)

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initCalled.current) return
    initCalled.current = true

    const initAuth = async () => {
      setLoading(true)
      try {
        const { data } = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me', {
          skipErrorToast: true,
        })
        setUser(data.data?.user || null)
      } catch {
        setUser(null)
      }
    }

    initAuth()
  }, [setUser, setLoading])

  return <>{children}</>
}
