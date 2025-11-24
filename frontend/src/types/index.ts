export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  status: UserStatus
  createdAt?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface CompleteRegistrationData {
  token: string
  firstName: string
  lastName: string
  password: string
  gdprConsent: boolean
}

export interface Invitation {
  id: string
  email: string
  createdAt: string
  expiresAt: string
}

export interface FileItem {
  id: string
  filename: string
  mimeType: string
  size: number
  createdAt: string
  url?: string
}

export interface ApiError {
  error: string
  code?: string
  details?: Array<{
    field: string
    message: string
  }>
}
