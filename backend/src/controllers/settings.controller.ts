// src/controllers/settings.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as settingsService from '../services/settings.service.js'
import { clearTransporterCache } from '../services/email.service.js'
import { createSuccessResponse } from '../utils/response.js'

interface SmtpSettingsBody {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  smtpSecure: boolean
  fromEmail: string
  fromName: string
  replyToEmail: string
}

// GET /api/settings/smtp
export const getSmtpSettings = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  const settings = await settingsService.getSmtpSettingsForApi()
  return reply.send(createSuccessResponse('Paramètres SMTP récupérés', settings))
}

// PUT /api/settings/smtp
export const updateSmtpSettings = async (
  request: FastifyRequest<{ Body: SmtpSettingsBody }>,
  reply: FastifyReply
) => {
  await settingsService.saveSmtpSettings(request.body)
  // Clear the email transporter cache so it uses the new settings
  clearTransporterCache()
  const settings = await settingsService.getSmtpSettingsForApi()
  return reply.send(createSuccessResponse('Paramètres SMTP mis à jour', settings))
}

// POST /api/settings/smtp/test
export const testSmtpConnection = async (
  request: FastifyRequest<{ Body: SmtpSettingsBody }>,
  reply: FastifyReply
) => {
  const result = await settingsService.testSmtpConnection(request.body)

  if (result.success) {
    return reply.send(createSuccessResponse('Connexion SMTP réussie', { success: true }))
  }

  return reply.status(400).send({
    success: false,
    message: 'Échec de la connexion SMTP',
    error: {
      code: 'SMTP_CONNECTION_FAILED',
      details: result.error,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  })
}

// ============================================
// SECURITY SETTINGS
// ============================================

interface SecuritySettingsBody {
  accountInactivityDays: number
  accountInactivityEnabled: boolean
}

// GET /api/settings/security
export const getSecuritySettings = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  const settings = await settingsService.getSecuritySettings()
  return reply.send(createSuccessResponse('Paramètres de sécurité récupérés', settings))
}

// PUT /api/settings/security
export const updateSecuritySettings = async (
  request: FastifyRequest<{ Body: SecuritySettingsBody }>,
  reply: FastifyReply
) => {
  await settingsService.saveSecuritySettings(request.body)
  const settings = await settingsService.getSecuritySettings()
  return reply.send(createSuccessResponse('Paramètres de sécurité mis à jour', settings))
}

// ============================================
// MAINTENANCE SETTINGS
// ============================================

interface MaintenanceSettingsBody {
  maintenanceEnabled: boolean
  maintenanceMessage: string
}

// GET /api/settings/maintenance
export const getMaintenanceSettings = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  const settings = await settingsService.getMaintenanceSettings()
  return reply.send(createSuccessResponse('Paramètres de maintenance récupérés', settings))
}

// PUT /api/settings/maintenance
export const updateMaintenanceSettings = async (
  request: FastifyRequest<{ Body: MaintenanceSettingsBody }>,
  reply: FastifyReply
) => {
  await settingsService.saveMaintenanceSettings(request.body)
  const settings = await settingsService.getMaintenanceSettings()
  return reply.send(createSuccessResponse('Paramètres de maintenance mis à jour', settings))
}

// GET /api/settings/maintenance/status (public endpoint for checking maintenance status)
export const getMaintenanceStatus = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  const settings = await settingsService.getMaintenanceSettings()
  return reply.send(createSuccessResponse('Statut de maintenance récupéré', settings))
}
