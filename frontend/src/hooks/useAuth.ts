import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { authService } from '@/services/auth'
import type { LoginCredentials, RegisterCredentials } from '@/types'

export const useAuth = () => {
  const navigate = useNavigate()
  const { login: storeLogin, logout: storeLogout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const { user, accessToken } = await authService.login(credentials)
      storeLogin(user, accessToken)
      navigate('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const { user, accessToken } = await authService.register(credentials)
      storeLogin(user, accessToken)
      navigate('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authService.logout()
    } catch {
      // Ignore logout errors
    } finally {
      storeLogout()
      setIsLoading(false)
      navigate('/login')
    }
  }

  return {
    login,
    register,
    logout,
    isLoading,
    error,
  }
}