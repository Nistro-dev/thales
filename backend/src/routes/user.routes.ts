import { FastifyInstance } from 'fastify'
import * as userController from '../controllers/user.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

export default async function userRoutes(fastify: FastifyInstance) {
  // Get all users (with filters)
  fastify.get(
    '/',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.VIEW_USERS)],
    },
    userController.getUsers
  )

  // Create user
  fastify.post(
    '/',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.CREATE_USERS)],
    },
    userController.createUser
  )

  // Get user by ID
  fastify.get(
    '/:id',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.VIEW_USERS)],
    },
    userController.getUserById
  )

  // Update user
  fastify.put(
    '/:id',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.UPDATE_USERS)],
    },
    userController.updateUser
  )

  // Delete user
  fastify.delete(
    '/:id',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.DELETE_USERS)],
    },
    userController.deleteUser
  )

  // Change user status
  fastify.patch(
    '/:id/status',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.SUSPEND_USERS)],
    },
    userController.changeUserStatus
  )

  // Validate caution
  fastify.post(
    '/:id/caution/validate',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.VALIDATE_CAUTION)],
    },
    userController.validateCaution
  )

  // Exempt caution
  fastify.post(
    '/:id/caution/exempt',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.EXEMPT_CAUTION)],
    },
    userController.exemptCaution
  )

  // Reset caution
  fastify.post(
    '/:id/caution/reset',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_CAUTION)],
    },
    userController.resetCaution
  )

  // Adjust credits
  fastify.post(
    '/:id/credits/adjust',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.ADJUST_CREDITS)],
    },
    userController.adjustCredits
  )

  // Get credit transactions
  fastify.get(
    '/:id/credits/transactions',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.VIEW_CREDIT_HISTORY)],
    },
    userController.getCreditTransactions
  )
}
