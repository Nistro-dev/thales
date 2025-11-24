import api from './api'
import type { User, LoginCredentials, RegisterCredentials } from '@/types'

interface AuthResponse {
  user: User
  accessToken: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials)
    return response.data
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', credentials)
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async refresh(): Promise<{ accessToken: string }> {
    const response = await api.post<{ accessToken: string }>('/auth/refresh')
    return response.data
  },

  async me(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },
}