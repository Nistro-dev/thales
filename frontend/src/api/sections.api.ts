import { apiClient } from './client'
import type { Section, SubSection } from '@/types'
import type { ApiResponse } from '@/types'

// ============================================
// TYPES
// ============================================

export interface CreateSectionInput {
  name: string
  description?: string
  allowedDaysIn?: number[]
  allowedDaysOut?: number[]
  sortOrder?: number
}

export interface UpdateSectionInput {
  name?: string
  description?: string
  allowedDaysIn?: number[]
  allowedDaysOut?: number[]
  sortOrder?: number
}

export interface CreateSubSectionInput {
  name: string
  description?: string
  sortOrder?: number
}

export interface UpdateSubSectionInput {
  name?: string
  description?: string
  sectionId?: string | null
  sortOrder?: number
}

export interface SectionWithCount extends Section {
  _count?: {
    products: number
  }
}

export interface SubSectionWithCount extends SubSection {
  _count?: {
    products: number
  }
  section?: {
    id: string
    name: string
  } | null
}

// ============================================
// SECTIONS API
// ============================================

export const sectionsApi = {
  /**
   * Get all sections with subsections
   */
  list: (includeSystem = false) => {
    const params = includeSystem ? '?includeSystem=true' : ''
    return apiClient.get<ApiResponse<SectionWithCount[]>>(`/sections${params}`)
  },

  /**
   * Get section by ID
   */
  get: (id: string) => {
    return apiClient.get<ApiResponse<SectionWithCount>>(`/sections/${id}`)
  },

  /**
   * Create section (admin)
   */
  create: (data: CreateSectionInput) => {
    return apiClient.post<ApiResponse<Section>>('/sections', data)
  },

  /**
   * Update section (admin)
   */
  update: (id: string, data: UpdateSectionInput) => {
    return apiClient.patch<ApiResponse<Section>>(`/sections/${id}`, data)
  },

  /**
   * Delete section (admin)
   */
  delete: (id: string) => {
    return apiClient.delete<ApiResponse<void>>(`/sections/${id}`)
  },

  /**
   * Create subsection under a section (admin)
   */
  createSubSection: (sectionId: string, data: CreateSubSectionInput) => {
    return apiClient.post<ApiResponse<SubSection>>(`/sections/${sectionId}/subsections`, data)
  },
}

// ============================================
// SUBSECTIONS API
// ============================================

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
    return apiClient.get<ApiResponse<SubSectionWithCount>>(`/subsections/${id}`)
  },

  /**
   * Get orphan subsections (no parent section)
   */
  listOrphans: () => {
    return apiClient.get<ApiResponse<SubSectionWithCount[]>>('/subsections/orphans')
  },

  /**
   * Update subsection (admin)
   */
  update: (id: string, data: UpdateSubSectionInput) => {
    return apiClient.patch<ApiResponse<SubSection>>(`/subsections/${id}`, data)
  },

  /**
   * Delete subsection (admin)
   */
  delete: (id: string) => {
    return apiClient.delete<ApiResponse<void>>(`/subsections/${id}`)
  },
}
