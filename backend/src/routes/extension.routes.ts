// src/routes/extension.routes.ts

import { FastifyInstance } from 'fastify'
import * as extensionController from '../controllers/extension.controller.js'
import { authMiddleware } from '../middlewares/auth.js'

// User routes
export async function extensionRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware)

  // Check if extension is possible
  fastify.get('/:id/extension/info', extensionController.checkExtension)

  // Extend reservation (automatic)
  fastify.post('/:id/extend', extensionController.extendReservation)
}
