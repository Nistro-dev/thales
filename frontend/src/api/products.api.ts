import { apiClient } from './client'
import type { Product, ProductFilters } from '@/types'
import type { ApiResponse, PaginatedResponse } from '@/types'

/**
 * Build query string from filters
 */
const buildQueryString = (filters: ProductFilters & { page?: number; limit?: number }): string => {
  const params = new URLSearchParams()

  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.search) params.append('search', filters.search)
  if (filters.sectionId) params.append('sectionId', filters.sectionId)
  if (filters.subSectionId) params.append('subSectionId', filters.subSectionId)
  if (filters.status) params.append('status', filters.status)
  if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString())
  if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString())
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
  if (filters.includeArchived) params.append('includeArchived', 'true')

  const query = params.toString()
  return query ? `?${query}` : ''
}

/**
 * Products API
 */
export const productsApi = {
  /**
   * Get products list with filters and pagination
   */
  list: (filters: ProductFilters = {}, page = 1, limit = 20) => {
    const query = buildQueryString({ ...filters, page, limit })
    return apiClient.get<PaginatedResponse<Product>>(`/products${query}`)
  },

  /**
   * Get product detail (public view)
   */
  get: (id: string) => {
    return apiClient.get<ApiResponse<Product>>(`/products/${id}`)
  },

  /**
   * Get product detail with admin data (requires MANAGE_PRODUCTS permission)
   */
  getAdmin: (id: string) => {
    return apiClient.get<ApiResponse<Product>>(`/products/${id}/admin`)
  },

  /**
   * Get product files (public only)
   */
  getFiles: (id: string) => {
    return apiClient.get<ApiResponse<Product['files']>>(`/products/${id}/files`)
  },

  /**
   * Get product files including admin-only files (requires MANAGE_PRODUCTS permission)
   */
  getFilesAdmin: (id: string) => {
    return apiClient.get<ApiResponse<Product['files']>>(`/products/${id}/files/admin`)
  },
}
