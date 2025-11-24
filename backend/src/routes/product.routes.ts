// src/routes/product.routes.ts

import { FastifyInstance } from 'fastify'
import * as productController from '../controllers/product.controller.js'
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
}
