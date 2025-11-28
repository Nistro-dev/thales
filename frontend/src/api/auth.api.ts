import { get, post } from './client'
import type { User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  invitationCode: string
}

export const authApi = {
  // Get current user
  me: () => get<{ user: User }>('/auth/me'),

  // Login
  login: (credentials: LoginCredentials) => post<{ user: User }>('/auth/login', credentials),

  // Register
  register: (data: RegisterData) => post<{ user: User }>('/auth/register', data),

  // Logout
  logout: () => post<Record<string, never>>('/auth/logout'),
}
