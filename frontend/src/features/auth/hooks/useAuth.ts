import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi, type LoginCredentials, type RegisterData } from '@/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { queryClient } from '@/lib/query-client'
import { ROUTES } from '@/constants/routes'


export function useAuth() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, setUser, logout: storeLogout } = useAuthStore()

  // Note: Initial auth check is done by AuthProvider
  // This hook only provides auth state and mutations

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (response) => {
      setUser(response.data?.user || null)
      toast.success('Connexion réussie')
      navigate(ROUTES.HOME)
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (response) => {
      setUser(response.data?.user || null)
      toast.success('Inscription réussie')
      navigate(ROUTES.HOME)
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      storeLogout()
      queryClient.clear()
      toast.success('Déconnexion réussie')
      navigate(ROUTES.LOGIN)
    },
  })

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
  }
}
