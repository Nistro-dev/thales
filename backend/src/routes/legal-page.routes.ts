import { FastifyInstance } from 'fastify'
import * as legalPageController from '../controllers/legal-page.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

// Public routes for viewing legal pages
export const legalPagePublicRoutes = async (fastify: FastifyInstance) => {
  // GET /api/legal/:type - Get legal page by type (public, no auth required)
  fastify.get('/:type', {
    handler: legalPageController.getLegalPage,
  })
}

// Admin routes for managing legal pages
export const legalPageAdminRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // GET /api/admin/legal - Get all legal pages (admin)
  fastify.get('/', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    handler: legalPageController.getAllLegalPages,
  })

  // PUT /api/admin/legal/:type - Update legal page (admin)
  fastify.put('/:type', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    handler: legalPageController.upsertLegalPage,
  })
}
