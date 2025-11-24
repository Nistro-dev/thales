import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { authService } from '@/services/auth'
import { useToast } from './useToast'
import type { LoginCredentials, RegisterCredentials } from '@/types'

export const useAuth = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, isAuthenticated, isLoading, login: setLogin, logout: setLogout, setLoading } = useAuthStore()

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)
      const response = await authService.getMe()
      setLogin(response.user)
    } catch {
      setLogout()
    } finally {
      setLoading(false)
    }
  }, [setLogin, setLogout, setLoading])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials)
      setLogin(response.user)
      toast({ title: 'Connexion réussie', description: `Bienvenue ${response.user.firstName}` })
      navigate('/dashboard')
    } catch (error: unknown) {
      const err = error as { code?: string; error?: string }
      if (err.code === 'ACCOUNT_PENDING') {
        navigate('/pending-approval')
        return
      }
      toast({ title: 'Erreur', description: err.error || 'Identifiants invalides', variant: 'destructive' })
      throw error
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    try {
      await authService.register(credentials)
      toast({ title: 'Inscription réussie', description: 'Votre compte est en attente de validation.' })
      navigate('/pending-approval')
    } catch (error: unknown) {
      const err = error as { error?: string }
      toast({ title: 'Erreur', description: err.error || "Erreur lors de l'inscription", variant: 'destructive' })
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      setLogout()
      navigate('/login')
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email)
      toast({ title: 'Email envoyé', description: 'Vérifiez votre boîte de réception.' })
    } catch (error: unknown) {
      const err = error as { error?: string }
      toast({ title: 'Erreur', description: err.error || 'Erreur lors de la demande', variant: 'destructive' })
      throw error
    }
  }

  const resetPassword = async (token: string, password: string) => {
    try {
      await authService.resetPassword(token, password)
      toast({ title: 'Mot de passe modifié', description: 'Vous pouvez maintenant vous connecter.' })
      navigate('/login')
    } catch (error: unknown) {
      const err = error as { error?: string }
      toast({ title: 'Erreur', description: err.error || 'Lien invalide ou expiré', variant: 'destructive' })
      throw error
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    checkAuth,
  }
}