// src/routes/product.routes.ts

import { FastifyInstance } from 'fastify'
import * as productController from '../controllers/product.controller.js'
import * as maintenanceController from '../controllers/maintenance.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

export const productRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // Public (authenticated users)
  fastify.get('/', { handler: productController.list })

  // Admin routes (must be before /:id to avoid matching "admin" as an ID)
  fastify.get('/:id/admin', {
    onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_PRODUCTS)],
    handler: productController.getByIdAdmin,
  })

  fastify.get('/:id/files/admin', {
    onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_PRODUCTS)],
    handler: productController.listFilesAdmin,
  })

  // Product reservations (admin only)
  fastify.get('/:id/reservations', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_RESERVATIONS),
    handler: productController.listReservations,
  })

  // ============================================
  // MAINTENANCE ROUTES (Admin only)
  // ============================================

  // Preview affected reservations before creating maintenance
  fastify.post('/:id/maintenance/preview', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: maintenanceController.previewAffected,
  })

  // Get active and scheduled maintenances
  fastify.get('/:id/maintenance/active', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: maintenanceController.getActive,
  })

  // Create new maintenance
  fastify.post('/:id/maintenance', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: maintenanceController.create,
  })

  // Get all maintenances (history)
  fastify.get('/:id/maintenance', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: maintenanceController.list,
  })

  // Get a specific maintenance
  fastify.get('/:id/maintenance/:maintenanceId', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: maintenanceController.getById,
  })

  // Update a maintenance
  fastify.patch('/:id/maintenance/:maintenanceId', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: maintenanceController.update,
  })

  // End a maintenance early
  fastify.post('/:id/maintenance/:maintenanceId/end', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: maintenanceController.end,
  })

  // Cancel a scheduled maintenance (before it starts)
  fastify.delete('/:id/maintenance/:maintenanceId', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: maintenanceController.cancel,
  })

  // Public product detail
  fastify.get('/:id', { handler: productController.getById })

  // Admin only
  fastify.post('/', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: productController.create,
  })

  fastify.patch('/:id', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: productController.update,
  })

  fastify.patch('/:id/status', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: productController.changeStatus,
  })

  fastify.delete('/:id', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: productController.remove,
  })

  // Attributes
  fastify.post('/:id/attributes', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: productController.addAttribute,
  })

  fastify.patch('/:id/attributes/:key', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: productController.updateAttribute,
  })

  fastify.delete('/:id/attributes/:key', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: productController.deleteAttribute,
  })

  // Files
  fastify.post('/:id/files', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: productController.uploadFile,
  })

  fastify.get('/:id/files', {
    handler: productController.listFiles,
  })

  fastify.delete('/:id/files/:fileId', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: productController.deleteFile,
  })

  fastify.patch('/:id/files/reorder', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: productController.reorderFiles,
  })

  fastify.patch('/:id/files/:fileId/visibility', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: productController.setFileVisibility,
  })

  fastify.patch('/:id/files/:fileId/rename', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_PRODUCTS),
    handler: productController.renameFile,
  })
}
