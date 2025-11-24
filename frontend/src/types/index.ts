export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
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
  details?: Array<{
    field: string
    message: string
  }>
}