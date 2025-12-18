import { FastifyInstance } from 'fastify'
import * as backupController from '../controllers/backup.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

export const backupRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // Download database backup
  fastify.get('/database', {
    preHandler: requirePermission(PERMISSIONS.BACKUP_DATABASE),
    handler: backupController.downloadDatabaseBackup,
  })
}
