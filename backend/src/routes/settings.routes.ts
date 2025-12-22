// src/routes/settings.routes.ts

import { FastifyInstance } from 'fastify'
import * as settingsController from '../controllers/settings.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

export const settingsRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // SMTP settings
  fastify.get('/smtp', {
    preHandler: requirePermission(PERMISSIONS.VIEW_SETTINGS),
    handler: settingsController.getSmtpSettings,
  })

  fastify.put('/smtp', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    handler: settingsController.updateSmtpSettings,
  })

  fastify.post('/smtp/test', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    handler: settingsController.testSmtpConnection,
  })

  // Security settings
  fastify.get('/security', {
    preHandler: requirePermission(PERMISSIONS.VIEW_SETTINGS),
    handler: settingsController.getSecuritySettings,
  })

  fastify.put('/security', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    handler: settingsController.updateSecuritySettings,
  })

  // Maintenance settings
  fastify.get('/maintenance', {
    preHandler: requirePermission(PERMISSIONS.VIEW_SETTINGS),
    handler: settingsController.getMaintenanceSettings,
  })

  fastify.put('/maintenance', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    handler: settingsController.updateMaintenanceSettings,
  })

  // Public maintenance status (no permission required, just auth)
  fastify.get('/maintenance/status', {
    handler: settingsController.getMaintenanceStatus,
  })
}
