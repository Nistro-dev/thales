import { apiClient } from './client'
import type { ApiResponse } from '@/types'

// ============================================
// TYPES
// ============================================

export interface SmtpSettings {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  smtpSecure: boolean
  fromEmail: string
  fromName: string
  replyToEmail: string
}

export interface SmtpTestResult {
  success: boolean
  error?: string
}

export interface SecuritySettings {
  accountInactivityDays: number
  accountInactivityEnabled: boolean
}

export interface MaintenanceSettings {
  maintenanceEnabled: boolean
  maintenanceMessage: string
}

// ============================================
// SETTINGS API
// ============================================

export const settingsApi = {
  /**
   * Get SMTP settings
   */
  getSmtp: () => {
    return apiClient.get<ApiResponse<SmtpSettings>>('/settings/smtp')
  },

  /**
   * Update SMTP settings
   */
  updateSmtp: (data: SmtpSettings) => {
    return apiClient.put<ApiResponse<SmtpSettings>>('/settings/smtp', data)
  },

  /**
   * Test SMTP connection
   */
  testSmtp: (data: SmtpSettings) => {
    return apiClient.post<ApiResponse<SmtpTestResult>>('/settings/smtp/test', data)
  },

  /**
   * Get security settings
   */
  getSecurity: () => {
    return apiClient.get<ApiResponse<SecuritySettings>>('/settings/security')
  },

  /**
   * Update security settings
   */
  updateSecurity: (data: SecuritySettings) => {
    return apiClient.put<ApiResponse<SecuritySettings>>('/settings/security', data)
  },

  /**
   * Get maintenance settings
   */
  getMaintenance: () => {
    return apiClient.get<ApiResponse<MaintenanceSettings>>('/settings/maintenance')
  },

  /**
   * Update maintenance settings
   */
  updateMaintenance: (data: MaintenanceSettings) => {
    return apiClient.put<ApiResponse<MaintenanceSettings>>('/settings/maintenance', data)
  },

  /**
   * Get maintenance status (public endpoint)
   */
  getMaintenanceStatus: () => {
    return apiClient.get<ApiResponse<MaintenanceSettings>>('/settings/maintenance/status')
  },
}
