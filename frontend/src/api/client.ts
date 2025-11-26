import axios, { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import type { ApiResponse } from '@/types'

// Extend AxiosRequestConfig to include custom properties
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipErrorHandling?: boolean
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

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError<ApiResponse>) => {
    // Skip error handling if flag is set
    if (error.config?.skipErrorHandling) {
      return Promise.reject(error)
    }

    // Handle different error cases
    if (error.response) {
      const { status, data } = error.response

      // Handle specific status codes
      switch (status) {
        case 401:
          // Unauthorized - redirect to login if not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
            toast.error('Session expirée. Veuillez vous reconnecter.')
          }
          break

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
