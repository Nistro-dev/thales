import { api } from './api'
import type { User, LoginCredentials, RegisterCredentials } from '@/types'

interface AuthResponse {
  user: User
}

interface MessageResponse {
  message: string
}

interface ValidateTokenResponse {
  valid: boolean
  email?: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', credentials, { skipAuth: true })
  },

  async register(credentials: RegisterCredentials): Promise<MessageResponse & { user: User }> {
    return api.post('/auth/register', credentials, { skipAuth: true })
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async logoutAll(): Promise<void> {
    await api.post('/auth/logout-all')
  },

  async getMe(): Promise<AuthResponse> {
    return api.get<AuthResponse>('/auth/me')
  },

  async forgotPassword(email: string): Promise<MessageResponse> {
    return api.post('/auth/forgot-password', { email }, { skipAuth: true })
  },

  async validateResetToken(token: string): Promise<ValidateTokenResponse> {
    return api.get(`/auth/validate-reset-token?token=${token}`, { skipAuth: true })
  },

  async resetPassword(token: string, password: string): Promise<MessageResponse> {
    return api.post('/auth/reset-password', { token, password }, { skipAuth: true })
  },
}