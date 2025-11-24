// src/routes/reservation.routes.ts

import { FastifyInstance } from 'fastify'
import * as reservationController from '../controllers/reservation.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

// User routes
export const reservationRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // My reservations
  fastify.get('/', {
    handler: reservationController.listMyReservations,
  })

  fastify.get('/:id', {
    handler: reservationController.getMyReservation,
  })

  fastify.post('/', {
    handler: reservationController.create,
  })

  fastify.post('/:id/cancel', {
    handler: reservationController.cancelMine,
  })
}

// Admin routes
export const reservationAdminRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // List all reservations
  fastify.get('/', {
    preHandler: requirePermission(PERMISSIONS.VIEW_RESERVATIONS),
    handler: reservationController.listAll,
  })

  // Get single reservation
  fastify.get('/:id', {
    preHandler: requirePermission(PERMISSIONS.VIEW_RESERVATIONS),
    handler: reservationController.getById,
  })

  // Create reservation for a user
  fastify.post('/', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_RESERVATIONS),
    handler: reservationController.createAdmin,
  })

  // Update reservation
  fastify.patch('/:id', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_RESERVATIONS),
    handler: reservationController.update,
  })

  // Cancel reservation
  fastify.post('/:id/cancel', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_RESERVATIONS),
    handler: reservationController.cancelAdmin,
  })

  // Refund reservation (without cancelling)
  fastify.post('/:id/refund', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_RESERVATIONS),
    handler: reservationController.refund,
  })

  // Checkout (with optional notes)
  fastify.post('/:id/checkout', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_RESERVATIONS),
    handler: reservationController.checkout,
  })

  // Return (with condition)
  fastify.post('/:id/return', {
    preHandler: requirePermission(PERMISSIONS.MANAGE_RESERVATIONS),
    handler: reservationController.returnProduct,
  })
}

// Availability routes (on products)
export const availabilityRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authMiddleware)

  // Get monthly availability calendar
  fastify.get('/:id/availability', {
    handler: reservationController.getAvailability,
  })

  // Check if specific dates are available
  fastify.get('/:id/check-availability', {
    handler: reservationController.checkAvailability,
  })
}
