import { FastifyRequest, FastifyReply } from 'fastify'
import { getMaintenanceSettings } from '../services/settings.service.js'
import { hasPermission } from '../services/permission.service.js'
import { PERMISSIONS } from '../constants/permissions.js'

/**
 * Middleware to check if the application is in maintenance mode.
 * Users with BYPASS_MAINTENANCE permission can still access the app.
 */
export const maintenanceMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const settings = await getMaintenanceSettings()

  // If maintenance is not enabled, allow access
  if (!settings.maintenanceEnabled) {
    return
  }

  // If user is authenticated, check if they have BYPASS_MAINTENANCE permission
  if (request.user?.userId) {
    const canBypass = await hasPermission(
      request.user.userId,
      PERMISSIONS.BYPASS_MAINTENANCE
    )

    if (canBypass) {
      return
    }
  }

  // Block access with maintenance message
  return reply.status(503).send({
    success: false,
    message: settings.maintenanceMessage,
    error: {
      code: 'MAINTENANCE_MODE',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  })
}
