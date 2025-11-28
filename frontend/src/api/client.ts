import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import type { ApiResponse } from '@/types'

// Extend AxiosRequestConfig to include custom properties
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipErrorHandling?: boolean
    skipErrorToast?: boolean
    _retry?: boolean
  }
}

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Include cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token refresh state
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })

  failedQueue = []
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Response interceptor with token refresh logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 errors with token refresh (always attempt refresh, even if skipErrorHandling is set)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Don't retry refresh endpoint or login page
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
          toast.error('Session expirée. Veuillez vous reconnecter.')
        }
        return Promise.reject(error)
      }

      // For /auth/me on initial load, don't try to refresh if we're on login page
      // This avoids unnecessary refresh attempts when user is clearly not logged in
      if (originalRequest.url?.includes('/auth/me') && window.location.pathname.includes('/login')) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Try to refresh the token
        await apiClient.post('/auth/refresh', {}, { skipErrorHandling: true })

        // Token refreshed successfully, process queued requests
        processQueue(null)
        isRefreshing = false

        // Retry the original request
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear queue and redirect to login
        processQueue(refreshError as Error)
        isRefreshing = false

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
          toast.error('Session expirée. Veuillez vous reconnecter.')
        }

        return Promise.reject(refreshError)
      }
    }

    // Skip all other error handling if flag is set
    if (originalRequest?.skipErrorHandling) {
      return Promise.reject(error)
    }

    // Skip error toasts if flag is set, but still reject the promise
    if (originalRequest?.skipErrorToast) {
      return Promise.reject(error)
    }

    // Handle different error cases
    if (error.response) {
      const { status, data } = error.response

      // Handle specific status codes
      switch (status) {
        case 403:
          toast.error("Vous n'avez pas la permission d'effectuer cette action.")
          break

        case 404:
          toast.error('Ressource non trouvée.')
          break

        case 500:
          toast.error('Erreur serveur. Veuillez réessayer plus tard.')
          break

        default:
          // Show error message from API if available
          if (data?.message) {
            toast.error(data.message)
          } else {
            toast.error('Une erreur est survenue.')
          }
      }
    } else if (error.request) {
      // Network error
      toast.error('Erreur de connexion. Vérifiez votre connexion internet.')
    } else {
      toast.error('Une erreur est survenue.')
    }

    return Promise.reject(error)
  }
)

// Helper function for GET requests
export async function get<T>(url: string, params?: Record<string, unknown>) {
  const response = await apiClient.get<ApiResponse<T>>(url, { params })
  return response.data
}

// Helper function for POST requests
export async function post<T>(url: string, data?: unknown) {
  const response = await apiClient.post<ApiResponse<T>>(url, data)
  return response.data
}

// Helper function for PUT requests
export async function put<T>(url: string, data?: unknown) {
  const response = await apiClient.put<ApiResponse<T>>(url, data)
  return response.data
}

// Helper function for PATCH requests
export async function patch<T>(url: string, data?: unknown) {
  const response = await apiClient.patch<ApiResponse<T>>(url, data)
  return response.data
}

// Helper function for DELETE requests
export async function del<T>(url: string) {
  const response = await apiClient.delete<ApiResponse<T>>(url)
  return response.data
}
