import { useAuthStore } from '@/store/auth'
import type { ApiError } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth, ...fetchOptions } = options

    const config: RequestInit = {
      ...fetchOptions,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config)

    if (response.status === 401 && !skipAuth) {
      const refreshed = await this.refreshToken()
      if (refreshed) {
        return this.request<T>(endpoint, options)
      }
      useAuthStore.getState().logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'An unexpected error occurred',
      }))
      throw { status: response.status, ...error }
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  private async refreshToken(): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      return true
    } catch {
      return false
    }
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const api = new ApiClient(API_URL)