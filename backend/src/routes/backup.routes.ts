import { FastifyInstance } from 'fastify'
import * as backupController from '../controllers/backup.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

export const backupRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // Download database backup (legacy - direct download)
  fastify.get('/database', {
    preHandler: requirePermission(PERMISSIONS.BACKUP_DATABASE),
    handler: backupController.downloadDatabaseBackup,
  })

  // List all backups
  fastify.get('/list', {
    preHandler: requirePermission(PERMISSIONS.BACKUP_DATABASE),
    handler: backupController.listBackups,
  })

  // Create a new backup
  fastify.post('/create', {
    preHandler: requirePermission(PERMISSIONS.BACKUP_DATABASE),
    handler: backupController.createBackup,
  })

  // Get download URL for a specific backup
  fastify.get('/:id/download', {
    preHandler: requirePermission(PERMISSIONS.BACKUP_DATABASE),
    handler: backupController.getBackupDownloadUrl,
  })

  // Delete a backup
  fastify.delete('/:id', {
    preHandler: requirePermission(PERMISSIONS.BACKUP_DATABASE),
    handler: backupController.deleteBackup,
  })

  // Restore from a backup
  fastify.post('/:id/restore', {
    preHandler: requirePermission(PERMISSIONS.BACKUP_DATABASE),
    handler: backupController.restoreBackup,
  })
}
