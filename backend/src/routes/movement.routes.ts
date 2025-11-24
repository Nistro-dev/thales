// src/routes/movement.routes.ts

import { FastifyInstance } from 'fastify'
import * as movementController from '../controllers/movement.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

export const movementRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // List all movements (admin)
  fastify.get('/admin/movements', {
    preHandler: requirePermission(PERMISSIONS.VIEW_RESERVATIONS),
    handler: movementController.listMovements,
  })

  // Get product movements
  fastify.get('/products/:id/movements', {
    preHandler: requirePermission(PERMISSIONS.VIEW_PRODUCTS),
    handler: movementController.getProductMovements,
  })
}
