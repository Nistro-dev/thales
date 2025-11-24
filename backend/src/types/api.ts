// Types pour les réponses API standardisées

export interface ApiSuccessResponse<T = any> {
  success: true
  message: string
  data: T
  meta: {
    timestamp: string
    pagination?: PaginationMeta
  }
}

export interface ApiErrorResponse {
  success: false
  message: string
  error: {
    code: ErrorCode
    details?: any
  }
  meta: {
    timestamp: string
  }
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginationParams {
  page: number
  limit: number
  total: number
}

// Codes d'erreur
export type ErrorCode =
  // Auth
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_DISABLED'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  // Resources
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  // Validation
  | 'VALIDATION_ERROR'
  | 'MISSING_FIELD'
  | 'INVALID_FORMAT'
  // Server
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'SERVICE_UNAVAILABLE'

export interface AppError {
  statusCode: number
  message: string
  code?: ErrorCode
  details?: any
}
