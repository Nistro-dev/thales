import { apiClient } from './client'
import type { Section, SubSection } from '@/types'
import type { ApiResponse } from '@/types'

/**
 * Sections API
 */
export const sectionsApi = {
  /**
   * Get all sections
   */
  list: () => {
    return apiClient.get<ApiResponse<Section[]>>('/sections')
  },

  /**
   * Get section by ID
   */
  get: (id: string) => {
    return apiClient.get<ApiResponse<Section>>(`/sections/${id}`)
  },
}

/**
 * SubSections API
 */
export const subSectionsApi = {
  /**
   * Get all subsections
   */
  list: () => {
    return apiClient.get<ApiResponse<SubSection[]>>('/subsections')
  },

  /**
   * Get subsection by ID
   */
  get: (id: string) => {
    return apiClient.get<ApiResponse<SubSection>>(`/subsections/${id}`)
  },
}
